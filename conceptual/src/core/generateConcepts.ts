import fs from 'node:fs';
import path from 'node:path';

import ejs from 'ejs';

import {
  Concept,
  ConceptLifecycle,
  ConceptModel,
  ConceptProject,
  ModelRule,
  ModelView,
  ProjectEntry,
  ProjectRegistry,
  Relationship,
  StoryView,
} from '../types/model.js';
import { extractSnippets } from './extractSnippets.js';
import { LanguageAdapter } from './languages/LanguageAdapter.js';
import { TypeScriptAdapter } from './languages/typescript/TypeScriptAdapter.js';
import {
  callLLM,
  LLMEnv,
} from './llm.js';
import {
  FileInfo,
  scanRepo,
} from './scanRepo.js';
import { SymbolInfo } from './tsSymbols.js';

export interface AnalyzeOptions {
  repoRoot: string;
  outDir: string;
  clean?: boolean;
  verbose?: boolean;
  maxModels?: number;
  projectName?: string;
  publish?: boolean;
}

// Intermediate type for discovery that includes code references
interface DiscoveredConcept extends Concept {
  references: { file: string; line?: number; symbol?: string }[];
}

interface DiscoveredModel extends ConceptModel {
  concepts: DiscoveredConcept[];
}

interface DiscoveredProject extends ConceptProject {
  models: DiscoveredModel[];
}

async function discoverProjectStructure(
  llmEnv: LLMEnv,
  repoRoot: string,
  symbols: SymbolInfo[],
  verbose?: boolean,
): Promise<DiscoveredProject> {
  const prompt = await buildProjectStructurePrompt(repoRoot, symbols);

  if (verbose) {
    console.log('\n📝 Project Structure Discovery Prompt:');
    console.log('─'.repeat(50));
    console.log(prompt);
    console.log('─'.repeat(50));
  }

  const result = await callLLM<DiscoveredProject>(
    llmEnv,
    [
      { role: "system", content: "You are an expert software architect analyzing codebases to identify high-level domain structure." },
      { role: "user", content: prompt },
    ],
    { responseFormat: 'json_object' },
  );

  return result;
}

async function enrichProjectModels(
  llmEnv: LLMEnv,
  repoRoot: string,
  project: DiscoveredProject,
  files: FileInfo[],
  verbose?: boolean,
  maxModels?: number,
): Promise<ConceptProject> {
  const enrichedModels: ConceptModel[] = [];

  // Apply maxModels limit if provided
  const modelsToProcess = maxModels ? project.models.slice(0, maxModels) : project.models;

  if (maxModels && project.models.length > maxModels) {
    console.log(`⚠️ Limiting enrichment to first ${maxModels} models (of ${project.models.length} discovered).`);
  }

  for (const model of modelsToProcess) {
    console.log(`📦 Enriching model: ${model.title}`);
    const enrichedConcepts: Concept[] = [];
    const allRelationships: Relationship[] = [...(model.relationships || [])];
    const allRules: ModelRule[] = [...(model.rules || [])];
    const allLifecycles: ConceptLifecycle[] = [...(model.lifecycles || [])];

    for (const concept of model.concepts) {
      console.log(`   🔬 Analyzing concept: ${concept.label}`);

      // Find relevant files
      const relevantFilePaths = [...new Set(concept.references.map(ref => ref.file))];
      const relevantFiles = files.filter(f => relevantFilePaths.includes(f.relativePath));

      if (relevantFiles.length === 0) {
        console.warn(`      ⚠️ No relevant files found for ${concept.label}, skipping enrichment.`);
        // Remove references before pushing to final model
        const { references, ...cleanConcept } = concept;
        enrichedConcepts.push(cleanConcept);
        continue;
      }

      const snippets = extractSnippets(relevantFiles);
      const prompt = buildConceptEnrichmentPrompt(project, model, concept, snippets, allRelationships);

      if (verbose) {
        console.log(`\n📝 Enrichment Prompt for "${concept.label}":`);
        console.log('─'.repeat(50));
        console.log(prompt);
        console.log('─'.repeat(50));
      }

      try {
        const enrichment = await callLLM<{
          concept: Partial<Concept>;
          relationships: Relationship[];
          rules: ModelRule[];
          lifecycles: ConceptLifecycle[];
        }>(
          llmEnv,
          [
            { role: "system", content: "You are an expert software architect creating detailed domain concept definitions." },
            { role: "user", content: prompt },
          ],
          { responseFormat: 'json_object' },
        );

        // Merge enriched data
        const { references, ...baseConcept } = concept;
        enrichedConcepts.push({
          ...baseConcept,
          ...enrichment.concept,
          // Keep original ID and Label if not overridden (though ID should be constant)
          id: concept.id,
        });

        if (enrichment.relationships) allRelationships.push(...enrichment.relationships);
        if (enrichment.rules) allRules.push(...enrichment.rules);
        if (enrichment.lifecycles) allLifecycles.push(...enrichment.lifecycles);

      } catch (error) {
        console.error(`      ❌ Failed to enrich concept ${concept.label}:`, error);
        const { references, ...cleanConcept } = concept;
        enrichedConcepts.push(cleanConcept);
      }
    }

    enrichedModels.push({
      ...model,
      concepts: enrichedConcepts,
      relationships: allRelationships,
      rules: allRules,
      lifecycles: allLifecycles,
    });
  }

  return {
    ...project,
    models: enrichedModels,
  };
}

async function generateViewsForProject(
  llmEnv: LLMEnv,
  project: ConceptProject,
  verbose?: boolean,
): Promise<ConceptProject> {
  const modelsWithViews: ConceptModel[] = [];

  for (const model of project.models) {
    console.log(`🧭 Designing views for model: ${model.title}`);

    // Build a "view design" prompt from the *enriched* model
    const prompt = buildViewDesignPrompt(project, model);

    if (verbose) {
      console.log('\n📝 View Design Prompt:');
      console.log('─'.repeat(50));
      console.log(prompt);
      console.log('─'.repeat(50));
    }

    try {
      const result = await callLLM<{ views: ModelView[] }>(
        llmEnv,
        [
          { role: 'system', content: 'You are an expert at designing Dubberly-style diagrams and views.' },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      modelsWithViews.push({
        ...model,
        views: result.views ?? [],
      });

      console.log(`   ✅ Generated ${result.views?.length ?? 0} views`);
    } catch (error) {
      console.error(`   ❌ Failed to generate views for model ${model.title}:`, error);
      modelsWithViews.push({
        ...model,
        views: [],
      });
    }
  }

  return {
    ...project,
    models: modelsWithViews,
  };
}

async function generateStoryViewsForProject(
  llmEnv: LLMEnv,
  project: ConceptProject,
  verbose?: boolean,
): Promise<ConceptProject> {
  const modelsWithStoryViews: ConceptModel[] = [];

  for (const model of project.models) {
    console.log(`📖 Designing story views for model: ${model.title}`);

    // Build a "story view design" prompt from the *enriched* model
    const prompt = buildStoryViewDesignPrompt(project, model);

    if (verbose) {
      console.log('\n📝 Story View Design Prompt:');
      console.log('─'.repeat(50));
      console.log(prompt);
      console.log('─'.repeat(50));
    }

    try {
      const result = await callLLM<{ storyViews: StoryView[] }>(
        llmEnv,
        [
          { role: 'system', content: 'You are an expert at designing narrative storyboards and scenario-based views for concept models.' },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      modelsWithStoryViews.push({
        ...model,
        storyViews: result.storyViews ?? [],
      });

      console.log(`   ✅ Generated ${result.storyViews?.length ?? 0} story views`);
    } catch (error) {
      console.error(`   ❌ Failed to generate story views for model ${model.title}:`, error);
      modelsWithStoryViews.push({
        ...model,
        storyViews: [],
      });
    }
  }

  return {
    ...project,
    models: modelsWithStoryViews,
  };
}
function buildViewDesignPrompt(
  project: ConceptProject,
  model: ConceptModel,
): string {
  const conceptsText = model.concepts.map(c => ({
    id: c.id,
    label: c.label,
    category: c.category,
    description: c.description,
  }));

  const relationshipsText = model.relationships.map(r => ({
    id: r.id,
    from: r.from,
    to: r.to,
    phrase: r.phrase,
    category: r.category,
  }));

  return `
We have an enriched Dubberly-style concept model in project "${project.name}".

Model: "${model.title}"
Description: ${model.description ?? '(none)'}

Concepts:
${JSON.stringify(conceptsText, null, 2)}

Relationships:
${JSON.stringify(relationshipsText, null, 2)}

Your job:
- Design a small set of HIGH LEVEL **views** (3-7) that help a NON-TECHNICAL, EXECUTIVE audience understand this model.
- Think of each view as a **single story** or **single question** this diagram answers.
- Views should focus on business / domain ideas, not technical implementation.
- Examples:
  - "System overview"
  - "Data request lifecycle"
  - "Who are the key actors and what do they do?"
  - "What are the main artifacts and how are they related?"

### Very important constraints

0. **Audience and abstraction level**
   - Assume the reader is an executive / product leader, not an engineer.
   - Prefer **business / domain concepts** and plain language.
   - Avoid or minimise:
     - infrastructure (queues, databases, workers, containers, DOs, etc.),
     - low-level technical details (LLM tools, API methods, schemas),
     - configuration / tuning concepts unless essential to the story.
   - It is OK to include 1-2 technical concepts in a view *only if* they are crucial to understanding that high-level story.

1. **Small views, not hairballs**
   - Each view MUST have:
     - **Between 4 and 8 concepts** (inclusive).
     - **Between 4 and 10 relationships** (inclusive).
   - If the underlying model has more relevant concepts/relationships, split them across multiple views.
   - Do NOT make a view that tries to show every concept or every relationship.

2. **Only include primary relationships**
   - Treat relationships as either **primary** (story-critical) or **secondary** (nice but non-essential).
   - In each view, include only the **primary** relationships that are necessary to tell *that* view’s story.
   - Secondary relationships should be omitted from that view (they can appear in a different, more detailed view).

3. **One narrative per view**
   - Prefer views that answer things like:
     - "What is the lifecycle of a data request from start to finish?"
     - "Who are the key actors and how do they interact?"
     - "What are the main artifacts and how are they related?"
   - Avoid mixing:
     - early and late lifecycle phases in one diagram if it becomes confusing,
     - high-level lifecycle + low-level implementation details in the same view,
     - multiple unrelated domains in one diagram.

4. **Use groups as swimlanes / zones**
   - For each view, imagine **2-5 groups** that act as swimlanes or zones (e.g. "Customer / User", "Slack", "Core process", "Review & decision", "Systems of record").
   - Each concept in the view should conceptually belong to exactly one group.
   - Groups should support a left-to-right or top-to-bottom reading order (e.g. origin → core object → processing → outcome).
   - The goal is to make the flow easy to follow for a non-technical reader.

5. **Directional flow**
   - Prefer relationships that mostly flow **left→right** or **top→bottom** across groups.
   - Avoid views where many arrows go backwards or criss-cross multiple groups.
   - If a relationship would create confusing crossing arrows, treat it as secondary and omit it from that view.

6. **No new concepts or relationships**
   - You MUST NOT invent any new concept IDs or relationship IDs.
   - Every \`conceptId\` and \`relationshipId\` in the views MUST come from the lists above.

### View kinds

Classify each view with a simple \`kind\` to hint at how it should be rendered:

- "overview"      - high-level system or subsystem overview (PREFERRED for executives)
- "lifecycle"     - phases or stages over time (PREFERRED for executives)
- "structure"     - how parts/artefacts of a core thing relate
- "implementation"- technical / LLM / plumbing details (AVOID unless absolutely necessary)
- "datastore"     - persistence / storage-centric view (RARE for executives)
- "other"         - anything else

When in doubt for an executive audience, prefer "overview" or "lifecycle".

### Output format

Return JSON shaped like:

{
  "views": [
    {
      "id": "data-request-lifecycle",
      "name": "Data request lifecycle",
      "kind": "lifecycle",
      "description": "High-level lifecycle of a data request from initial request through processing to final decision/outcome.",
      "conceptIds": ["...", "..."],          // 4-8 items
      "relationshipIds": ["...", "..."]      // 4-10 items
    }
  ]
}

Only return JSON.

`.trim();
}

function buildStoryViewDesignPrompt(
  project: ConceptProject,
  model: ConceptModel,
): string {
  const conceptsText = model.concepts.map(c => ({
    id: c.id,
    label: c.label,
    category: c.category,
    description: c.description,
  }));

  const relationshipsText = model.relationships.map(r => ({
    id: r.id,
    from: r.from,
    to: r.to,
    phrase: r.phrase,
    category: r.category,
  }));

  return `
We have a Dubberly-style concept model in project "${project.name}".

Your job is to design **story views** for the model "${model.title}".  
A story view is a *temporal narrative*—a sequence of steps that explains how concepts interact over time.

---

# Model Context

Model description: ${model.description ?? '(none)'}

Concepts (valid conceptIds):
${JSON.stringify(conceptsText, null, 2)}

Relationships (valid relationshipIds):
${JSON.stringify(relationshipsText, null, 2)}

---

# Your Task

Generate **2-5 high-quality story views**.

Each story view is a coherent scenario, such as:

- A typical user flow
- An admin configuration flow
- A system-level internal process
- An error or recovery case
- A cross-system integration sequence

## Requirements for Story Views

### 1. Temporal narrative
Each story must be a sequence of **3-7 steps** that unfold over time.

### 2. Step structure
Each step must include:

- **title**  
- **narrative** (1-3 sentences)
- **conceptIds** (2-6 concepts used in this moment)
- **relationshipIds** (1-5 relationships driving this moment)
- Optional: **primaryConceptIds**, **primaryRelationshipIds**

### 4. No new IDs
- Use only conceptIds from the Concepts list.
- Use only relationshipIds from the Relationships list.
- Do not invent concept names or IDs.

### 5. Clarity and realism
Stories should:
- Start simple
- Build complexity
- End with a clear outcome
- Reflect plausible real-world flows

---

# Story Type Classification

Each story requires a \`kind\`:

- "user_flow"
- "admin_flow"
- "system_flow"
- "error_flow"
- "integration_flow"
- "other"

Pick the most appropriate one.

---

# Output Format

Return **ONLY JSON** in the following structure:

\`\`\`json
{
  "storyViews": [
    {
      "id": "kebab-case-id",
      "name": "Human readable story name",
      "kind": "user_flow",
      "description": "1-3 sentence overview.",
      "tags": ["optional", "tags"],
      "focusConceptId": "optional-concept-id",
      "steps": [
        {
          "id": "kebab-step-id",
          "index": 0,
          "title": "Step title",
          "narrative": "1-3 sentence explanation.",
          "conceptIds": ["concept-a", "concept-b"],
          "relationshipIds": ["rel-1"],
          "primaryConceptIds": ["optional"],
          "primaryRelationshipIds": ["optional"]
        }
        // more steps...
      ]
    }
    // more storyViews...
  ]
}
\`\`\`

---

ONLY return JSON. No commentary. 
`.trim();
}


export async function publishToViewer(project: ConceptProject, repoRoot: string) {
  try {
    // Resolve viewer directory relative to this file's location in dist/core or src/core
    // We assume standard monorepo: conceptual/ -> ../viewer
    const toolRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
    // If running from dist/core, toolRoot is conceptual/
    // If running from src/core, toolRoot is conceptual/

    // Check if we are in dist or src
    const isDist = toolRoot.endsWith('dist');
    const packageRoot = isDist ? path.resolve(toolRoot, '..') : toolRoot;

    const viewerDir = path.resolve(packageRoot, '../viewer');
    const viewerPublicDir = path.resolve(viewerDir, 'public/models');

    if (!fs.existsSync(viewerDir)) {
      console.warn(`⚠️ Could not find viewer directory at ${viewerDir}, skipping publish.`);
      return;
    }

    if (!fs.existsSync(viewerPublicDir)) {
      fs.mkdirSync(viewerPublicDir, { recursive: true });
    }

    // Save the project file, named based on the trailing directory of the repo root
    const safeName = path.basename(repoRoot).replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const projectFileName = `${safeName}.json`;
    const projectPath = path.join(viewerPublicDir, projectFileName);

    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2), 'utf8');
    console.log(`🚀 Published project to: ${projectPath}`);

    // Update registry
    const registryPath = path.join(viewerPublicDir, 'registry.json');
    let registry: ProjectRegistry = { projects: [] };

    if (fs.existsSync(registryPath)) {
      try {
        registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      } catch (e) {
        console.warn('⚠️ Could not parse existing registry, creating new one.');
      }
    }

    const entry: ProjectEntry = {
      id: safeName,
      name: project.name,
      path: `models/${projectFileName}`,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = registry.projects.findIndex((p) => p.id === safeName);
    if (existingIndex >= 0) {
      registry.projects[existingIndex] = entry;
    } else {
      registry.projects.push(entry);
    }

    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
    console.log(`📋 Updated registry at: ${registryPath}`);

  } catch (error) {
    console.error('❌ Failed to publish to viewer:', error);
  }
}

export async function analyzeRepo(opts: AnalyzeOptions) {
  const repoRoot = path.resolve(opts.repoRoot);
  const projectName = opts.projectName || path.basename(repoRoot);

  console.log(`🔍 Scanning repository: ${repoRoot} (Project: ${projectName})`);

  // Initialize adapters
  const adapters: LanguageAdapter[] = [new TypeScriptAdapter()];
  const extensions = adapters.flatMap(a => a.extensions);

  const scan = await scanRepo(repoRoot, extensions);
  console.log(`📁 Found ${scan.files.length} files`);

  // Extract symbols using adapters
  const symbols: SymbolInfo[] = [];
  for (const file of scan.files) {
    const ext = path.extname(file.path);
    const adapter = adapters.find(a => a.extensions.includes(ext));
    if (adapter) {
      const content = fs.readFileSync(file.path, 'utf8');
      const fileSymbols = adapter.extractSymbols(content, file.path, file.relativePath);
      symbols.push(...fileSymbols);
    }
  }
  console.log(`🔎 Extracted ${symbols.length} symbols from codebase`);

  const llmEnv: LLMEnv = {
    apiKey: process.env.CONCEPTGEN_API_KEY || "",
    baseUrl: process.env.CONCEPTGEN_BASE_URL,
    model: process.env.CONCEPTGEN_MODEL || "gpt-4.1-mini",
  };

  if (!llmEnv.apiKey) {
    throw new Error("CONCEPTGEN_API_KEY is not set");
  }

  console.log(`🏗️ Discovering project structure...`);
  const discoveredProject = await discoverProjectStructure(llmEnv, repoRoot, symbols, opts.verbose);

  // Override project name/ID if provided in opts, or keep what LLM found
  if (opts.projectName) {
    discoveredProject.name = opts.projectName;
    discoveredProject.id = opts.projectName.toLowerCase().replace(/\s+/g, '-');
  }

  console.log(`✅ Discovered structure:`);
  console.log(`   Project: ${discoveredProject.name}`);
  console.log(`   Models: ${discoveredProject.models.map(m => m.title).join(', ')}`);

  console.log(`💎 Enriching concepts...`);
  const finalProjectWithoutViews = await enrichProjectModels(llmEnv, repoRoot, discoveredProject, scan.files, opts.verbose, opts.maxModels);

  console.log(`✅ Enrichment complete.`);

  console.log(`🧭 Generating model views...`);
  const finalProjectWithViews = await generateViewsForProject(llmEnv, finalProjectWithoutViews, opts.verbose);

  console.log(`✅ Model view generation complete.`);

  console.log(`📖 Generating story views...`);
  const finalProject = await generateStoryViewsForProject(llmEnv, finalProjectWithViews, opts.verbose);

  console.log(`✅ Story view generation complete.`);

  // Write the final project file
  if (opts.outDir) {
    const absOut = path.resolve(repoRoot, opts.outDir);
    fs.mkdirSync(absOut, { recursive: true });
    const projectPath = path.join(absOut, 'project-model.json');
    fs.writeFileSync(projectPath, JSON.stringify(finalProject, null, 2), 'utf8');
    console.log(`📄 Written: ${projectPath}`);
  }

  // Publish to viewer if requested
  if (opts.publish !== false) {
    await publishToViewer(finalProject, repoRoot);
  }
}

async function buildProjectStructurePrompt(
  repoRoot: string,
  symbols: SymbolInfo[],
): Promise<string> {
  const symbolText = symbols
    .filter(s => s.isExported)
    .map(s => `- [${s.kind}] ${s.name} (in ${s.relativePath}:${s.line})`)
    .join('\n');

  // Resolve template path relative to this file
  // We assume this file is in src/core or dist/core
  // The template is in src/core/templates/projectStructure.ejs

  // If we are in src/core (dev mode with tsx), __dirname or import.meta.url points to src/core
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const templatePath = path.resolve(currentDir, 'templates/projectStructure.ejs');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  return ejs.render(template, { repoRoot, symbolText });
}

function buildConceptEnrichmentPrompt(
  project: ConceptProject,
  model: ConceptModel,
  concept: Concept,
  snippets: { relativePath: string; snippet: string }[],
  existingRelationships: Relationship[],
): string {
  const filesText = snippets
    .map((s) => `// File: ${s.relativePath}\n${s.snippet}`)
    .join("\n\n");

  // Filter out the current concept to show "other" potential relationship targets
  const otherConcepts = model.concepts
    .filter((c) => c.id !== concept.id)
    .map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description,
    }));

  const contextText = otherConcepts.length > 0
    ? JSON.stringify(otherConcepts, null, 2)
    : "(No other concepts found in this model yet)";

  const relationshipsText = existingRelationships.length > 0
    ? existingRelationships.map(r => `- ${r.from} ${r.phrase} ${r.to} (${r.category})`).join('\n')
    : "(No relationships established yet)";

  return `
We are analyzing the concept "${concept.label}" in the model "${model.title}" of project "${project.name}".

Description: ${concept.description}

## Model Context (Other Concepts)

Here are other concepts already identified in this model. You should use these as targets for relationships where appropriate.

${contextText}

## Model Context (Existing Relationships)

Here are relationships that have already been established in this model. Use this to understand how this concept fits into the broader picture.

${relationshipsText}

Based on the following code snippets, provide a detailed definition of this concept, including:
1. Aliases (synonyms used in code or comments).
2. Relationships to other concepts (e.g. "Order has line items", "User places Order").
   - **CRITICAL**: Prefer linking to the "Other Concepts" listed above if they match.
   - You may also link to concepts that *should* exist but aren't listed yet, if the code strongly implies them.
3. Rules/Constraints (e.g. "Order must have at least one item").
4. Lifecycles (if the concept has states, e.g. Pending -> Shipped).

Remember: the concept is a **domain-level idea** from a Dubberly-style concept model.
Use the code only as evidence to understand the concept's meaning, relationships, rules, and lifecycle in the domain.
Avoid describing frameworks, patterns, or low-level implementation details unless they clarify the domain behavior.

Code Snippets:
\`\`\`ts
${filesText}
\`\`\`

Return a JSON object with this structure:
{
  "concept": {
    "aliases": ["string"],
    "notes": "string (implementation details, usage notes)"
  },
  "relationships": [
    {
      "id": "rel-id",
      "from": "${concept.id}",
      "to": "target-concept-id",
      "phrase": "verb phrase (e.g. has, places, contains)",
      "category": "is_a|part_of|causes|enables|prevents|precedes|uses|represents|other",
      "description": "string"
    }
  ],
  "rules": [
    {
      "id": "rule-id",
      "title": "Rule Title",
      "text": "Rule description",
      "kind": "invariant|constraint|policy|assumption",
      "conceptIds": ["${concept.id}"]
    }
  ],
  "lifecycles": [
    {
      "id": "lifecycle-id",
      "subjectConceptId": "${concept.id}",
      "stateConceptIds": ["StateConceptId1", "StateConceptId2"],
      "transitionRelationshipIds": [],
      "initialStateId": "StateConceptId1",
      "terminalStateIds": ["StateConceptId2"]
    }
  ]
}

Only return relationships/rules/lifecycles that are strongly supported by the code.
Do not explain your reasoning. Return ONLY valid JSON.
`.trim();
}
