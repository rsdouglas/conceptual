import fs from 'node:fs';
import path from 'node:path';

import {
  Concept,
  ConceptModel,
  ConceptProject,
  Relationship,
  ModelRule,
  ConceptLifecycle,
  ProjectEntry,
  ProjectRegistry,
} from '../types/model.js';
import { extractSnippets } from './extractSnippets.js';
import {
  callLLM,
  LLMEnv,
} from './llm.js';
import {
  FileInfo,
  scanRepo,
} from './scanRepo.js';
import {
  extractSymbolsFromFiles,
  SymbolInfo,
} from './tsSymbols.js';

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
  const prompt = buildProjectStructurePrompt(repoRoot, symbols);

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
      const prompt = buildConceptEnrichmentPrompt(project, model, concept, snippets);

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

    // Save the project file
    const safeName = project.id.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
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
  const scan = await scanRepo(repoRoot);
  console.log(`📁 Found ${scan.files.length} TypeScript/JavaScript files`);

  const symbols: SymbolInfo[] = extractSymbolsFromFiles(repoRoot, scan.files);
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
  const finalProject = await enrichProjectModels(llmEnv, repoRoot, discoveredProject, scan.files, opts.verbose, opts.maxModels);

  console.log(`✅ Enrichment complete.`);

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

function buildProjectStructurePrompt(
  repoRoot: string,
  symbols: SymbolInfo[],
): string {
  const symbolText = symbols
    .filter(s => s.isExported)
    .map(s => `- [${s.kind}] ${s.name} (in ${s.relativePath}:${s.line})`)
    .join('\n');

  return `
You are an expert in Dubberly-style concept modeling and domain-driven design.

We are analyzing a codebase at \`${repoRoot}\`.

Here is a list of top-level exported symbols discovered in the JS/TS files:

${symbolText}

Your job is NOT to describe the code structure. Your job is to infer the **real-world conceptual structure** of the system and express it as a **Concept Project** with one or more **Concept Models**, at a high-level "helicopter view".

Think in terms of Dubberly concept models:

- Concepts are **things, activities, roles, states, events, places, or times** in the *domain*, not in the framework.
- Relationships are how those concepts relate in the real world (e.g., "User places Order", "Slack message becomes Data request").
- Models are **coherent stories** or subsystems (e.g., "Sales", "Authentication", "Slack Bot Request Flow"), not just folders or modules.

Treat the code as **evidence** of the underlying concepts:
- Exported symbols hint at important concepts and responsibilities.
- File paths and names hint at domains or subsystems.
- Ignore low-level implementation details (framework glue, utilities).

### Very important distinctions

When choosing concepts and models:

- **DO**:
  - Focus on **domain ideas**: users, orders, tasks, requests, workflows, meetings, evaluations, data sources, permissions, etc.
  - Merge many small code elements (functions, hooks, services) into a **single conceptual thing** where appropriate.
    - e.g. many files about "data requests" → one concept: "Data request".
  - Use **human-friendly concept names**, even if the code uses technical names.
    - e.g. code symbol \`useDataRequestQuery\` → concept "Data request".
  - Group concepts into models that correspond to **subsystems / bounded contexts**:
    - e.g. "Slack Bot", "Admin / Evaluation UI", "Core Data Engine", "Authentication".
  - Prefer **few, strong concepts** over many weak/technical ones.

- **DO NOT**:
  - Do NOT create a concept for every exported function or React component.
  - Do NOT treat technical helpers as concepts (e.g. \`useState\`, \`Button\`, \`ThemeProvider\`, \`logger\`, \`httpClient\`).
  - Do NOT describe internal libraries or frameworks as concepts.
    - e.g. "React component" or "Express router" is not a domain concept.
  - Do NOT mirror the code folder structure mechanically.
  - Do NOT stay at the implementation level (e.g. "UserService", "OrderRepository") unless you can restate them as domain ideas ("User management", "Order storage").

### Heuristics for Models (ConceptModel)

Think of each **Concept Model** as a Dubberly-style diagram you could draw:

- It should have a clear **domain focus**:
  - e.g. "Slack Bot Data Request Flow", "Admin Evaluation Configuration", "Core Data Processing", "Authentication & Authorization".
- It should be **understandable to a product manager** looking at the system.
- It should NOT be “API routes” or “utility functions” as a model.

Use filenames, directory names, and symbol groupings to infer models:
- e.g. files under \`apps/slack-bot/*\` likely form a "Slack Bot" model.
- e.g. files under \`apps/admin-ui/*\` likely form an "Admin UI / Evaluation" model.
- e.g. files under \`core/data/*\` likely form a "Data Engine" model.

### Heuristics for Concepts

For each model, identify only the **key** concepts (the helicopter view):

Examples of good concepts:
- "User", "Admin", "Customer"
- "Slack message", "Data request", "Meeting", "Recording"
- "Evaluation rule", "Access policy", "Task", "Job", "Workflow"
- "Result", "Error", "Session", "Token"
- "Environment", "Project", "Repository"

Examples of things that should **NOT** be concepts here:
- "useFetch", "useQuery", "Button", "Theme", "Logger", "ConfigLoader"
- "index.ts", "types.ts", generic helpers

It is OK to:
- Rename technical names to clearer domain names.
  - \`DataRequestService\` → concept "Data request handling".
- Combine multiple related symbols into one concept.
  - \`SlackMessageHandler\`, \`SlackEventRouter\` → concept "Slack message handling".
- Infer obvious relationships even if you don’t output them yet (for now, keep \`relationships\` empty).

### Output format

Return a JSON object matching this structure:

{
  "id": "project-id",
  "name": "Project Name (domain-level, not repo name)",
  "summary": "Short summary of what this system does in the real world",
  "description": "Slightly longer description, 2-5 sentences, still at domain level",
  "models": [
    {
      "id": "model-id",
      "title": "Model Title (e.g. Slack Bot Data Request Flow)",
      "description": "Description of this model/domain in human terms",
      "concepts": [
        {
          "id": "concept-id (e.g. data-request)",
          "label": "Data request",
          "category": "thing|activity|role|state|event|place|time|other",
          "description": "Brief domain-level description (what it is, not how it is implemented)",
          "references": [
            { "file": "path/to/file.ts", "symbol": "DataRequestService" }
          ]
        }
      ],
      "relationships": [],
      "rules": [],
      "lifecycles": [],
      "views": []
    }
  ]
}

Constraints:

- Focus on the most important concepts (the "helicopter view").
- Keep concepts and models **domain-level**, not implementation-level.
- Use \`references\` to point back to the *code* that implements the concept.
- Do NOT explain your reasoning.
- Return ONLY valid JSON.
`.trim();
}

function buildConceptEnrichmentPrompt(
  project: ConceptProject,
  model: ConceptModel,
  concept: Concept,
  snippets: { relativePath: string; snippet: string }[],
): string {
  const filesText = snippets
    .map((s) => `// File: ${s.relativePath}\n${s.snippet}`)
    .join("\n\n");

  return `
We are analyzing the concept "${concept.label}" in the model "${model.title}" of project "${project.name}".

Description: ${concept.description}

Based on the following code snippets, provide a detailed definition of this concept, including:
1. Aliases (synonyms used in code or comments).
2. Relationships to other concepts (e.g. "Order has line items", "User places Order").
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
