# ConceptGen

> **Automated Dubberly-style concept modeling for codebases**

ConceptGen analyzes your codebase and generates rich, Dubberly-style concept models automatically using LLM-powered analysis. It discovers domain concepts, relationships, rules, lifecycles, and creates focused diagram views—helping teams understand and communicate system architecture.

## What is a Dubberly-style Concept Model?

[Hugh Dubberly's concept modeling approach](http://www.dubberly.com/concept-maps) focuses on visualizing **domain concepts** (things, activities, roles, states, events) and their **relationships**, rather than technical implementation details.

ConceptGen brings this methodology to code analysis:

- 🎯 **Domain-focused** - Identifies real-world concepts, not just classes/functions
- 🔗 **Relationship-aware** - Maps how concepts connect and interact
- 📊 **Multi-view** - Generates focused diagram perspectives for different audiences
- 🔄 **Lifecycle tracking** - Captures how concepts change state over time
- 📜 **Rules & constraints** - Documents business logic and invariants

## Features

### Three-Phase Analysis Pipeline

```
1. Discovery      → Identify high-level domain structure
2. Enrichment     → Analyze code to fill in concept details
3. View Generation → Design focused diagrams from enriched models
```

Each phase uses targeted LLM analysis to build progressively richer understanding.

### Rich Model Output

Generated `ConceptProject` includes:

- **Concepts** - Domain entities with categories (thing, activity, role, state, event, etc.)
- **Relationships** - Typed connections between concepts (is_a, part_of, causes, enables, etc.)
- **Rules** - Business constraints and invariants
- **Lifecycles** - State machines for stateful concepts
- **Views** - Curated diagram perspectives (overview, subsystem flows, role-based, etc.)
- **Layout hints** - Optional groupings and positioning for visualization

### Automatic View Design

The view generation phase creates 3-7 focused diagram views per model:

- **System Overview** - High-level architecture
- **Subsystem Views** - Focused flows (e.g., "Slack Bot", "Admin UI", "Data Processing")
- **Role-based Views** - Perspectives for different stakeholders
- **Layer Views** - Organized by architectural layer (Frontend, Backend, Data)

Views only reference existing concepts—no invention, pure curation.

## Setup

Since this is currently a local development package:

```bash
cd conceptual
pnpm install
pnpm build
```

## Usage

### Basic Analysis

```bash
pnpm dev analyze /path/to/repo --out ./output
```

This will:
1. Scan TypeScript/JavaScript files
2. Discover project structure
3. Enrich concepts with details
4. Generate views
5. Write `project-model.json` to output directory
6. Publish to viewer (if available)

### Options

```bash
pnpm dev analyze [path] [options]

Arguments:
  path                      Path to repository root (default: ".")

Options:
  --out-dir <dir>           Output directory (default: "docs/domain/concepts")
  --name <name>             Project name (default: repo folder name)
  --max-models <number>     Limit enrichment to N models (for testing)
  --verbose                 Print LLM prompts for debugging
  --publish                 Publish to viewer (default: true)
  --no-publish              Skip viewer publishing
  --clean                   Remove existing files before generating
  -h, --help                Display help
```

### Verbose Mode (See the Prompts)

```bash
pnpm dev analyze /path/to/repo --verbose
```

Shows all LLM prompts:
- Project structure discovery prompt
- Per-concept enrichment prompts
- View design prompts

Useful for understanding and tuning the analysis.

### Environment Variables

```bash
# Required
export CONCEPTGEN_API_KEY="your-openai-api-key"

# Optional
export CONCEPTGEN_BASE_URL="https://api.openai.com/v1"  # Custom endpoint
export CONCEPTGEN_MODEL="gpt-4.1-mini"                  # Model name
```

## Output

### Generated Files

```
output/
└── project-model.json    # Complete ConceptProject with models, views, etc.
```

### Example Output Structure

```json
{
  "id": "my-project",
  "name": "My Project",
  "summary": "A system for managing data requests via Slack",
  "models": [
    {
      "id": "slack-bot-flow",
      "title": "Slack Bot Data Request Flow",
      "concepts": [
        {
          "id": "data-request",
          "label": "Data request",
          "category": "activity",
          "description": "User-initiated request for data access",
          "aliases": ["request", "query"]
        }
      ],
      "relationships": [
        {
          "id": "rel-1",
          "from": "slack-user",
          "to": "data-request",
          "phrase": "creates",
          "category": "causes"
        }
      ],
      "rules": [
        {
          "id": "rule-1",
          "title": "Data request requires approval",
          "text": "All data requests must be approved by an admin",
          "kind": "policy"
        }
      ],
      "lifecycles": [
        {
          "id": "lc-1",
          "subjectConceptId": "data-request",
          "stateConceptIds": ["pending", "approved", "rejected"],
          "initialStateId": "pending"
        }
      ],
      "views": [
        {
          "id": "overview",
          "name": "System Overview",
          "description": "End-to-end request flow",
          "conceptIds": ["slack-user", "data-request", "admin", "database"],
          "relationshipIds": ["rel-1", "rel-2", "rel-3"]
        }
      ]
    }
  ]
}
```

## Integration with Viewer

ConceptGen can publish models to a viewer application for interactive exploration:

```bash
# Auto-publish (default)
pnpm dev analyze /path/to/repo

# Skip publishing
pnpm dev analyze /path/to/repo --no-publish
```

Published models appear in `../viewer/public/models/` with a registry entry.

## How It Works

### 1. Discovery Phase

Scans codebase for TypeScript/JavaScript files and extracts exported symbols. Calls LLM with:

- Repository structure
- Exported symbols (functions, classes, types)
- Domain modeling instructions

LLM identifies high-level domain structure and creates initial `ConceptModel` objects with:
- ✅ Concepts with code references
- ✅ High-level categories
- ❌ Empty relationships/rules/lifecycles/views

### 2. Enrichment Phase

For each concept, extracts relevant code snippets and calls LLM to:

- Add aliases and descriptions
- Identify relationships to other concepts
- Extract business rules and constraints
- Discover lifecycle states and transitions

Aggregates all findings into the model.

### 3. View Generation Phase

For each enriched model, calls LLM with:

- All concept metadata (id, label, category, description)
- All relationship metadata (id, from, to, phrase, category)
- Instructions to design 3-7 useful views

LLM selects subsets of concepts/relationships to create focused diagram perspectives.

**Critical constraint:** Views must only reference existing concepts/relationships—no invention.

## Design Philosophy

### Domain Over Implementation

ConceptGen focuses on **domain concepts**, not code artifacts:

- ✅ "User places Order" - domain concept
- ❌ "OrderService calls OrderRepository" - implementation detail

### Human-Readable Models

Models should be understandable by product managers, designers, and stakeholders:

- Clear natural language descriptions
- Business-focused categories and relationships  
- Visual diagrams (via views) over code dumps

### Progressive Enrichment

Start broad, then go deep:

1. **Discovery** - Helicopter view of the system
2. **Enrichment** - Detailed analysis of each concept
3. **Views** - Curated perspectives for communication

This mirrors how humans understand systems.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run from source
pnpm dev -- analyze /path/to/repo --verbose

# TypeScript compilation
npx tsc
```

## Limitations

- **TypeScript/JavaScript only** - Currently scans `.ts`, `.tsx`, `.js`, `.jsx` files
- **LLM quality dependent** - Output quality depends on LLM model capabilities
- **English-centric** - Prompts and output are English-language
- **No semantic analysis** - Uses file structure and exports, not deep type analysis

## Roadmap

- [ ] Support for more languages (Python, Go, Java, etc.)
- [ ] Interactive refinement mode
- [ ] Integration with architecture documentation tools
- [ ] Export to Mermaid/PlantUML diagrams
- [ ] Custom prompt templates
- [ ] Incremental updates (avoid re-analyzing unchanged code)

## License

MIT

## Credits

Inspired by [Hugh Dubberly's concept modeling work](http://www.dubberly.com/concept-maps) and domain-driven design principles.
