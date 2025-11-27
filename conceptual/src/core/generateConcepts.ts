import fs from 'node:fs';
import path from 'node:path';

import {
  ConceptCandidate,
  ConceptDiscoveryResult,
  ConceptModel,
  ConceptSheet,
  ProjectOverview,
} from '../types/model.js';
import { extractSnippets } from './extractSnippets.js';
import {
  callLLM,
  LLMEnv,
} from './llm.js';
import { renderConceptMarkdown } from './renderMarkdown.js';
import {
  FileInfo,
  scanRepo,
} from './scanRepo.js';
import {
  extractSymbolsFromFiles,
  SymbolInfo,
} from './tsSymbols.js';

// Cache the concept sheet template at module load time
let CONCEPT_TEMPLATE = '';
try {
  // Load from the tool's directory (../../ from /conceptual/src/core/)
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const templatePath = path.join(currentDir, '../../concept-sheet-annotated.md');
  CONCEPT_TEMPLATE = fs.readFileSync(templatePath, 'utf8');
} catch (error) {
  console.warn('⚠️ Could not load concept template, proceeding without it:', error instanceof Error ? error.message : String(error));
}

interface AnalyzeOptions {
  repoRoot: string;
  outDir: string;
  clean?: boolean;
  verbose?: boolean;
  maxDiscoveryIterations?: number;
  projectName?: string;
  publish?: boolean;
}

async function generateProjectOverview(
  llmEnv: LLMEnv,
  repoRoot: string,
  symbols: SymbolInfo[],
  verbose?: boolean,
): Promise<ProjectOverview> {
  const prompt = buildProjectOverviewPrompt(repoRoot, symbols);

  if (verbose) {
    console.log('\n📝 Project Overview Prompt:');
    console.log('─'.repeat(50));
    console.log(prompt);
    console.log('─'.repeat(50));
  }

  const overview = await callLLM<ProjectOverview>(
    llmEnv,
    [
      { role: "system", content: "You are an expert software architect analyzing codebases to understand project structure and purpose." },
      { role: "user", content: prompt },
    ],
    { responseFormat: 'json_object' },
  );

  return overview;
}

async function discoverConcepts(
  llmEnv: LLMEnv,
  repoRoot: string,
  symbols: SymbolInfo[],
  overview: ProjectOverview,
  verbose?: boolean,
  maxIterations: number = 5,
): Promise<ConceptDiscoveryResult> {
  const allConcepts: ConceptCandidate[] = [];
  let iteration = 1;
  let hasMoreConcepts = true;

  while (hasMoreConcepts && iteration <= maxIterations) {
    console.log(`🔄 Discovery iteration ${iteration}...`);

    const prompt = iteration === 1
      ? buildDiscoveryPrompt(repoRoot, symbols, overview)
      : buildIterationPrompt(repoRoot, symbols, overview, allConcepts);

    if (verbose) {
      console.log(`\n📝 Discovery Prompt (Iteration ${iteration}):`);
      console.log('─'.repeat(50));
      console.log(prompt);
      console.log('─'.repeat(50));
    }

    const result = await callLLM<ConceptDiscoveryResult>(
      llmEnv,
      [
        { role: "system", content: "You are an expert software architect analyzing codebases to identify domain concepts." },
        { role: "user", content: prompt },
      ],
      { responseFormat: 'json_object' },
    );

    // Filter out duplicates by concept name
    const newConcepts = result.concepts.filter(
      newConcept => !allConcepts.some(existing => existing.name === newConcept.name)
    );

    if (newConcepts.length > 0) {
      console.log(`   Found ${newConcepts.length} new concepts: ${newConcepts.map(c => c.name).join(', ')}`);
      allConcepts.push(...newConcepts);
    } else {
      console.log(`   No new concepts found`);
      hasMoreConcepts = false;
    }

    iteration++;

    // Safety check: stop if we haven't found new concepts in this iteration
    if (result.concepts.length === 0) {
      hasMoreConcepts = false;
    }
  }

  console.log(`📋 Total concepts discovered: ${allConcepts.length}`);

  return {
    repoRoot,
    generatedAt: new Date().toISOString(),
    concepts: allConcepts,
  };
}

async function generateConceptSheets(
  llmEnv: LLMEnv,
  repoRoot: string,
  candidates: ConceptCandidate[],
  files: FileInfo[],
  overview: ProjectOverview,
  verbose?: boolean,
  outDir?: string,
  clean?: boolean,
): Promise<ConceptSheet[]> {
  const conceptSheets: ConceptSheet[] = [];

  // Clean existing files at the start if requested
  if (clean && outDir) {
    console.log(`🧹 Cleaning existing concept files...`);
    try {
      const absOut = path.resolve(repoRoot, outDir);
      if (fs.existsSync(absOut)) {
        const existingFiles = fs.readdirSync(absOut)
          .filter(file => file.endsWith('.md'))
          .map(file => path.join(absOut, file));

        for (const file of existingFiles) {
          fs.unlinkSync(file);
        }
        console.log(`🗑️ Removed ${existingFiles.length} existing concept files`);
      }
    } catch (err) {
      console.warn(`⚠️ Warning: Could not clean existing files:`, err);
    }
  }

  for (const candidate of candidates) {
    console.log(`🔬 Generating sheet for concept: ${candidate.name}`);

    // Get snippets from relevant files (unique files from references)
    const relevantFilePaths = [...new Set(candidate.references.map(ref => ref.file))];
    const relevantFiles = files.filter(f =>
      relevantFilePaths.includes(f.relativePath)
    );

    if (relevantFiles.length === 0) {
      console.warn(`⚠️ No relevant files found for concept: ${candidate.name}`);
      continue;
    }

    const relevantSnippets = extractSnippets(relevantFiles);
    const prompt = buildConceptPrompt(repoRoot, candidate, relevantSnippets, overview);

    if (verbose) {
      console.log(`\n📝 Concept Generation Prompt for "${candidate.name}":`);
      console.log('─'.repeat(50));
      console.log(prompt);
      console.log('─'.repeat(50));
    }

    try {
      const conceptSheet = await callLLM<ConceptSheet>(
        llmEnv,
        [
          { role: "system", content: "You are an expert software architect creating detailed domain concept documentation." },
          { role: "user", content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      conceptSheets.push(conceptSheet);

      // Write the concept sheet immediately
      if (outDir) {
        const absOut = path.resolve(repoRoot, outDir);
        fs.mkdirSync(absOut, { recursive: true });

        const safe = conceptSheet.metadata.name.replace(/[^a-z0-9-_]/gi, "_").toLowerCase();
        const filePath = path.join(absOut, `${safe}.md`);
        const md = renderConceptMarkdown(conceptSheet);
        fs.writeFileSync(filePath, md, "utf8");

        const relativeFilePath = path.join(outDir, `${safe}.md`);
        const absoluteFilePath = path.resolve(repoRoot, relativeFilePath);
        console.log(`📄 Written: ${absoluteFilePath}`);
      }

    } catch (error) {
      console.error(`❌ Failed to generate concept sheet for ${candidate.name}:`, error);
    }
  }

  return conceptSheets;
}

async function rationalizeContexts(
  llmEnv: LLMEnv,
  conceptSheets: ConceptSheet[],
  overview: ProjectOverview,
  verbose?: boolean,
): Promise<ConceptSheet[]> {
  // Group current concepts by their assigned context
  const currentContexts: Record<string, string[]> = {};
  conceptSheets.forEach(sheet => {
    const ctx = sheet.metadata.boundedContext || 'Unassigned';
    if (!currentContexts[ctx]) currentContexts[ctx] = [];
    currentContexts[ctx].push(sheet.metadata.name);
  });

  const contextSummary = Object.entries(currentContexts)
    .map(([ctx, concepts]) => `- ${ctx}: ${concepts.join(', ')}`)
    .join('\n');

  const prompt = `
You are analyzing a software system to rationalize its bounded contexts.

Project Summary: ${overview.summary}
Domain Focus: ${overview.modules.domainFocus}

Current context groupings (may be fragmented or poorly organized):
${contextSummary}

Your task: Consolidate these into 3-7 meaningful bounded contexts that reflect the actual business domains.

Guidelines:
- Combine related concepts that serve the same business capability
- Use domain-driven design principles
- Prefer fewer, cohesive contexts over many small ones
- Context names should be business-focused (e.g., "Billing", "Identity", "Catalog")
- Every concept must be assigned to exactly one context

Return a JSON object with this structure:
{
  "contexts": [
    {
      "name": "string - business-focused context name",
      "description": "string - what business capability this context serves",
      "conceptNames": ["array", "of", "concept", "names", "from", "input"]
    }
  ]
}

Do not explain your reasoning. Return ONLY valid JSON.
`.trim();

  if (verbose) {
    console.log('\n📝 Context Rationalization Prompt:');
    console.log('─'.repeat(50));
    console.log(prompt);
    console.log('─'.repeat(50));
  }

  const rationalization = await callLLM<import('../types/model.js').ContextRationalization>(
    llmEnv,
    [
      { role: "system", content: "You are an expert software architect organizing domain concepts into bounded contexts." },
      { role: "user", content: prompt },
    ],
    { responseFormat: 'json_object' },
  );

  // Build mapping from concept name to new context
  const conceptToContext = new Map<string, string>();
  rationalization.contexts.forEach(ctx => {
    ctx.conceptNames.forEach(name => {
      conceptToContext.set(name, ctx.name);
    });
  });

  // Update concept sheets with new contexts
  const updatedSheets = conceptSheets.map(sheet => {
    const newContext = conceptToContext.get(sheet.metadata.name);
    if (newContext) {
      return {
        ...sheet,
        metadata: {
          ...sheet.metadata,
          boundedContext: newContext,
        },
      };
    }
    return sheet;
  });

  console.log(`✅ Rationalized contexts:`);
  rationalization.contexts.forEach(ctx => {
    console.log(`   📦 ${ctx.name} (${ctx.conceptNames.length} concepts): ${ctx.description}`);
  });

  return updatedSheets;
}

export async function publishToViewer(model: ConceptModel, projectName: string, repoRoot: string) {
  try {
    // Assume viewer is at ../../viewer relative to this tool's execution context
    // But we are running from conceptual/dist/cli/index.js usually, or conceptual/src/cli/index.ts
    // Let's try to resolve relative to the CWD first if we are in the repo, 
    // but better to resolve relative to the tool location.

    // Actually, simpler: assume standard monorepo structure for now:
    // conceptual/ (CWD for dev) -> ../viewer

    // We need to find the viewer directory. 
    // If we are running "conceptgen analyze" from anywhere, we can't assume ../viewer exists relative to CWD.
    // However, for this specific user request, they are likely running in the monorepo.
    // Let's try to find the viewer directory relative to the tool's package root.

    const toolRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..'); // conceptual/src/core -> conceptual/src -> conceptual
    const viewerDir = path.resolve(toolRoot, '../viewer');
    const viewerPublicDir = path.resolve(viewerDir, 'public/models');

    if (!fs.existsSync(viewerDir)) {
      console.warn(`⚠️ Could not find viewer directory at ${viewerDir}, skipping publish.`);
      return;
    }

    if (!fs.existsSync(viewerPublicDir)) {
      fs.mkdirSync(viewerPublicDir, { recursive: true });
    }

    // 1. Save the model file
    const safeName = projectName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const modelFileName = `${safeName}.json`;
    const modelPath = path.join(viewerPublicDir, modelFileName);

    fs.writeFileSync(modelPath, JSON.stringify(model, null, 2), 'utf8');
    console.log(`🚀 Published model to: ${modelPath}`);

    // 2. Update registry
    const registryPath = path.join(viewerPublicDir, 'registry.json');
    let registry: import('../types/model.js').ProjectRegistry = { projects: [] };

    if (fs.existsSync(registryPath)) {
      try {
        registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      } catch (e) {
        console.warn('⚠️ Could not parse existing registry, creating new one.');
      }
    }

    const entry: import('../types/model.js').ProjectEntry = {
      id: safeName,
      name: projectName,
      path: `models/${modelFileName}`,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = registry.projects.findIndex(p => p.id === safeName);
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

  // New: get JS/TS symbols
  const symbols: SymbolInfo[] = extractSymbolsFromFiles(repoRoot, scan.files);
  console.log(`🔎 Extracted ${symbols.length} symbols from codebase`);

  const snippets = extractSnippets(scan.files);

  const llmEnv: LLMEnv = {
    apiKey: process.env.CONCEPTGEN_API_KEY || "",
    baseUrl: process.env.CONCEPTGEN_BASE_URL,
    model: process.env.CONCEPTGEN_MODEL || "gpt-4.1-mini",
  };

  if (!llmEnv.apiKey) {
    throw new Error("CONCEPTGEN_API_KEY is not set");
  }

  console.log(`📋 Generating project overview...`);
  const overview = await generateProjectOverview(llmEnv, repoRoot, symbols, opts.verbose);
  console.log(`✅ Project overview generated:`);
  console.log(`   📝 Summary: ${overview.summary}`);
  console.log(`   🌐 System Context:`);
  console.log(`      External Systems: ${overview.systemContext.externalSystems.map(s => s.name + (s.direction ? ` (${s.direction})` : '')).join(', ') || 'none identified'}`);
  console.log(`      User Roles: ${overview.systemContext.userRoles.map(r => r.name).join(', ') || 'none identified'}`);
  console.log(`      Key Dependencies: ${overview.systemContext.keyDependencies.join(', ') || 'none identified'}`);
  console.log(`   🏗️ Containers:`);
  console.log(`      Services: ${overview.containers.services.join(', ') || 'none identified'}`);
  console.log(`      User Interfaces: ${overview.containers.userInterfaces.join(', ') || 'none identified'}`);
  console.log(`      Data Stores: ${overview.containers.dataStores.join(', ') || 'none identified'}`);
  console.log(`      Background Jobs: ${overview.containers.backgroundJobs.join(', ') || 'none identified'}`);
  console.log(`      Deployment Targets: ${overview.containers.deploymentTargets.join(', ') || 'none identified'}`);
  console.log(`   📦 Modules:`);
  console.log(`      Boundaries: ${overview.modules.boundaries.join(', ') || 'none identified'}`);
  console.log(`      Responsibilities: ${overview.modules.responsibilities.join(', ') || 'none identified'}`);
  console.log(`      Domain Focus: ${overview.modules.domainFocus || 'not specified'}`);
  console.log(`   🏷️ Project Name: ${projectName}`);

  console.log(`🔍 Discovering concept candidates...`);
  const discoveryResult = await discoverConcepts(llmEnv, repoRoot, symbols, overview, opts.verbose, opts.maxDiscoveryIterations);

  console.log(`📝 Writing concept sheets...`);
  const conceptSheets = await generateConceptSheets(llmEnv, repoRoot, discoveryResult.concepts, scan.files, overview, opts.verbose, opts.outDir, opts.clean);

  console.log(`🔄 Rationalizing bounded contexts...`);
  const rationalizedSheets = await rationalizeContexts(llmEnv, conceptSheets, overview, opts.verbose);

  // Create the final ConceptModel
  const model: ConceptModel = {
    repoRoot,
    generatedAt: new Date().toISOString(),
    projectOverview: overview,
    concepts: rationalizedSheets,
  };

  console.log(`✅ Generated ${model.concepts.length} detailed concept sheets`);

  // Write the final concept-model.json file
  writeConceptSheets(model, opts.outDir, repoRoot);

  // Publish to viewer if requested
  if (opts.publish !== false) {
    await publishToViewer(model, projectName, repoRoot);
  }
}

function buildProjectOverviewPrompt(
  repoRoot: string,
  symbols: SymbolInfo[],
): string {
  const symbolText = symbols
    .filter(s => s.isExported)
    .map(s => `- [${s.kind}] ${s.name} (in ${s.relativePath}:${s.line})`)
    .join('\n');

  return `
We are analyzing a codebase at ${repoRoot}.

Here is a list of top-level exported symbols discovered in the JS/TS files:

${symbolText}

Based on these symbols, filenames, and their organization, provide a comprehensive architectural overview following C4 principles.

Return a JSON object with the following structure:
{
  "summary": "string - 2-3 sentence description of what the project does",
  "systemContext": {
    "externalSystems": [
      {
        "name": "string",
        "description": "optional string",
        "direction": "inbound|outbound|bidirectional"
      }
    ] - external systems that interact with this one (APIs, databases, third-party services, etc.),
    "userRoles": [
      {
        "name": "string",
        "description": "optional string"
      }
    ] - types of users that interact with the system (end users, admins, APIs, etc.),
    "keyDependencies": ["string"] - important external dependencies (frameworks, libraries, platforms)
  },
  "containers": {
    "services": ["string"] - main deployable services/APIs/backends,
    "userInterfaces": ["string"] - web apps, mobile apps, CLIs, admin panels,
    "dataStores": ["string"] - databases, caches, file storage, external APIs,
    "backgroundJobs": ["string"] - workers, queues, cron jobs, scheduled tasks,
    "deploymentTargets": ["string"] - where things run (AWS, GCP, Cloudflare, Vercel, local, etc.)
  },
  "modules": {
    "boundaries": ["string"] - how the codebase is organized into modules/packages,
    "responsibilities": ["string"] - what each major module/area is responsible for,
    "domainFocus": "string - primary domain or business area this system serves"
  }
}

Provide specific, concrete details based on the code structure and symbols. Focus on architectural context that will help identify domain concepts.
Do not explain your reasoning. Return ONLY valid JSON.
`.trim();
}

function buildDiscoveryPrompt(
  repoRoot: string,
  symbols: SymbolInfo[],
  overview: ProjectOverview,
): string {
  const symbolText = symbols
    .filter(s => s.isExported)
    .map(s => `- [${s.kind}] ${s.name} (in ${s.relativePath}:${s.line})`)
    .join('\n');

  return `
We are analyzing a codebase at ${repoRoot}.

Project Overview:
Summary: ${overview.summary}
System Context: External systems (${overview.systemContext.externalSystems.map(s => s.name).join(', ') || 'none'}), User roles (${overview.systemContext.userRoles.map(r => r.name).join(', ') || 'none'}), Key dependencies (${overview.systemContext.keyDependencies.join(', ') || 'none'})
Containers: Services (${overview.containers.services.join(', ') || 'none'}), UIs (${overview.containers.userInterfaces.join(', ') || 'none'}), Data stores (${overview.containers.dataStores.join(', ') || 'none'})
Modules: ${overview.modules.boundaries.join(', ') || 'not organized'} - Domain focus: ${overview.modules.domainFocus || 'general'}

Here is a list of top-level exported symbols discovered in the JS/TS files:

${symbolText}

Based on the project overview and these symbol names, types, and their file locations, identify the most important domain concepts that emerge from this codebase.

Return a JSON object with the following structure:
{
  "repoRoot": "${repoRoot}",
  "generatedAt": "${new Date().toISOString()}",
  "concepts": [
    {
      "name": "string",           // concept name
      "type": "entity|value_object|aggregate_root|domain_service|application_service|event|other",
      "criticality": "core|supporting|experimental", // importance of this concept
      "description": "string",    // brief description of what this concept represents
      "references": [             // precise references to relevant code locations
        {
          "file": "string",       // relative file path
          "line": number,         // optional line number
          "symbol": "string"      // optional symbol name at this location
        }
      ]
    }
  ]
}

Focus on concepts that have clear implementations in the code. Return 3-8 concepts.
Do not explain your reasoning. Return ONLY valid JSON.
`.trim();
}

function buildIterationPrompt(
  repoRoot: string,
  symbols: SymbolInfo[],
  overview: ProjectOverview,
  existingConcepts: ConceptCandidate[],
): string {
  const symbolText = symbols
    .filter(s => s.isExported)
    .map(s => `- [${s.kind}] ${s.name} (in ${s.relativePath}:${s.line})`)
    .join('\n');

  const existingText = existingConcepts
    .map(c => `- ${c.name} (${c.type}): ${c.description}`)
    .join('\n');

  return `
We are analyzing a codebase at ${repoRoot}.

Project Overview:
Summary: ${overview.summary}
System Context: External systems (${overview.systemContext.externalSystems.map(s => s.name).join(', ') || 'none'}), User roles (${overview.systemContext.userRoles.map(r => r.name).join(', ') || 'none'}), Key dependencies (${overview.systemContext.keyDependencies.join(', ') || 'none'})
Containers: Services (${overview.containers.services.join(', ') || 'none'}), UIs (${overview.containers.userInterfaces.join(', ') || 'none'}), Data stores (${overview.containers.dataStores.join(', ') || 'none'})
Modules: ${overview.modules.boundaries.join(', ') || 'not organized'} - Domain focus: ${overview.modules.domainFocus || 'general'}

Here are the symbols we found:
${symbolText}

We have already identified these domain concepts:
${existingText}

Based on the project overview, symbols, and what we've already found, are there any additional important domain concepts that we haven't covered yet? Look for concepts that complement or relate to the existing ones, or concepts that represent important aspects of the domain that might have been missed.

Return a JSON object with the following structure:
{
  "repoRoot": "${repoRoot}",
  "generatedAt": "${new Date().toISOString()}",
  "concepts": [
    {
      "name": "string",           // concept name (must be different from existing concepts)
      "type": "entity|value_object|aggregate_root|domain_service|application_service|event|other",
      "criticality": "core|supporting|experimental", // importance of this concept
      "description": "string",    // brief description of what this concept represents
      "references": [             // precise references to relevant code locations
        {
          "file": "string",       // relative file path
          "line": number,         // optional line number
          "symbol": "string"      // optional symbol name at this location
        }
      ]
    }
  ]
}

If you don't find any additional important concepts, return an empty concepts array: {"concepts": []}
Return 0-5 additional concepts that add meaningful value beyond what we've already found.
Do not explain your reasoning. Return ONLY valid JSON.
`.trim();
}

function buildConceptPrompt(
  repoRoot: string,
  conceptCandidate: ConceptCandidate,
  relevantSnippets: { relativePath: string; snippet: string }[],
  overview: ProjectOverview,
): string {
  const filesText = relevantSnippets
    .map((s) => `// File: ${s.relativePath}\n${s.snippet}`)
    .join("\n\n");

  // Use the cached concept sheet template for guidance
  const templateContent = CONCEPT_TEMPLATE;

  return `
We are analyzing a codebase at ${repoRoot}.

Project Overview:
Summary: ${overview.summary}
System Context: External systems (${overview.systemContext.externalSystems.map(s => s.name).join(', ') || 'none'}), User roles (${overview.systemContext.userRoles.map(r => r.name).join(', ') || 'none'}), Key dependencies (${overview.systemContext.keyDependencies.join(', ') || 'none'})
Containers: Services (${overview.containers.services.join(', ') || 'none'}), UIs (${overview.containers.userInterfaces.join(', ') || 'none'}), Data stores (${overview.containers.dataStores.join(', ') || 'none'})
Modules: ${overview.modules.boundaries.join(', ') || 'not organized'} - Domain focus: ${overview.modules.domainFocus || 'general'}

Focus on the concept: "${conceptCandidate.name}" (${conceptCandidate.type})
Description: ${conceptCandidate.description}

Use the following Concept Sheet template as a guide for the structure and content you should generate:

${templateContent ? '```markdown\n' + templateContent + '\n```' : '(Template not available)'}

Based on the project overview, template above, and the following code snippets from relevant files, create a detailed ConceptSheet for this domain concept.

\`\`\`ts
${filesText}
\`\`\`

Return a JSON object matching the ConceptSheet structure:
{
  "metadata": {
    "name": "${conceptCandidate.name}",
    "type": "${conceptCandidate.type}",
    "criticality": "${conceptCandidate.criticality}",
    "boundedContext": "optional string",
    "aggregateRoot": boolean
  },
  "definition": {
    "shortDescription": "string",
    "ubiquitousLanguage": "optional string"
  },
  "structure": {
    "fields": [{"name": "string", "type": "string", "description": "optional string"}],
    "relationships": [{"description": "string"}]
  },
  "lifecycle": {
    "states": ["optional array of strings"],
    "validTransitions": ["optional array of strings"]
  },
  "invariants": [{"rule": "string", "notes": "optional string"}],
  "commands": [{"name": "string", "description": "optional string"}],
  "events": [{"name": "string", "description": "optional string"}],
  "implementation": [{"kind": "file|symbol|url", "label": "string", "path": "string"}]
}

Do not explain your reasoning. Return ONLY valid JSON.
`.trim();
}


function writeConceptSheets(model: ConceptModel, outDir: string, repoRoot: string) {
  // Individual .md files are already written by generateConceptSheets
  // Just write the final concept-model.json file
  const absOut = path.resolve(repoRoot, outDir);
  const modelPath = path.join(absOut, "..", "concept-model.json");
  fs.writeFileSync(modelPath, JSON.stringify(model, null, 2), "utf8");
  const relativeModelPath = path.join(outDir, "..", "concept-model.json");
  const absoluteModelPath = path.resolve(repoRoot, relativeModelPath);
  console.log(`📄 Written: ${absoluteModelPath}`);
}
