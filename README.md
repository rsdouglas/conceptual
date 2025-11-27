# Conceptual

**Automated Dubberly-style concept modeling for codebases**

Conceptual analyzes your codebase and generates rich, Dubberly-style concept models automatically using LLM-powered analysis. It discovers domain concepts, relationships, rules, lifecycles, and creates focused diagram views—helping teams understand and communicate system architecture.

## What is a Dubberly-style Concept Model?

[Hugh Dubberly's concept modeling approach](http://www.dubberly.com/concept-maps) focuses on visualizing **domain concepts** (things, activities, roles, states, events) and their **relationships**, rather than technical implementation details.

Conceptual brings this methodology to code analysis:

- 🎯 **Domain-focused** - Identifies real-world concepts, not just classes/functions
- 🔗 **Relationship-aware** - Maps how concepts connect and interact
- 📊 **Multi-view** - Generates focused diagram perspectives for different audiences
- 🔄 **Lifecycle tracking** - Captures how concepts change state over time
- 📜 **Rules & constraints** - Documents business logic and invariants

Perfect for:
- Understanding AI-generated codebases
- Onboarding new developers
- PM & stakeholder alignment
- Domain language standardization
- Architecture communication
- System refactoring & design  

---

## ✨ Features

### Three-Phase Analysis Pipeline

```
1. Discovery      → Identify high-level domain structure
2. Enrichment     → Analyze code to fill in concept details
3. View Generation → Design focused diagrams from enriched models
```

Each phase uses targeted LLM analysis to build progressively richer understanding.

### 🔍 Concept Discovery
Automatically identifies domain concepts from code:
- Things, activities, roles, states, events
- Business rules and constraints
- Lifecycle state machines
- Concept relationships and interactions

### 📊 Multi-View Diagrams
Generated focused diagram perspectives:
- **System Overview** - High-level architecture
- **Subsystem Views** - Focused flows (e.g., "Slack Bot", "Admin UI")
- **Role-based Views** - Stakeholder perspectives
- **Layer Views** - Organized by architectural layer

### 🗺️ Interactive Domain Explorer
A modern Tailwind-powered viewer:
- Project overview with concept relationships
- Drill-down into concept details and lifecycles
- Multiple diagram perspectives
- Direct links to source code

### ⚡ Privacy-First Analysis
- **Local processing** - Code scanning and analysis runs locally
- **Configurable LLMs** - Send only extracted symbols and code snippets to your chosen LLM provider
- **No persistent storage** - No data is stored on external servers beyond LLM API calls
- **Your API keys** - All LLM interactions use your configured API keys

---

## 🚀 Getting Started

### Install

```bash
cd conceptual
pnpm install
pnpm build
```

### Analyze a codebase

```bash
cd conceptual
pnpm dev analyze /path/to/repo
```

This will:
1. Scan TypeScript/JavaScript files
2. Discover project structure and domain concepts
3. Enrich concepts with details, relationships, and rules
4. Generate focused diagram views
5. Write `docs/domain/concept-model.json`
6. Publish to viewer (if available)

For full CLI options, environment variables, and advanced usage, see [conceptual/README.md](conceptual/README.md).

### Run the viewer

```bash
cd viewer
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to explore your concept models interactively.

---

## 🧪 Status

Conceptual is evolving rapidly as we refine the Dubberly-style concept modeling approach.
Currently supports TypeScript/JavaScript analysis with LLM-powered discovery and enrichment.

Pull requests welcome! Areas of particular interest:
- Language support expansion (Python, Go, Java, etc.)
- Analysis heuristics and LLM prompt improvements
- Viewer UI enhancements
- Integration patterns

---

## 🪪 License

Conceptual is licensed under the **Business Source License 1.1 (BSL)**.

* Free for personal, educational, research, and internal commercial use.
* **Not permitted**: hosting or offering Conceptual as a competitive cloud service.
* Automatically converts to Apache 2.0 after the change date.

See [`LICENSE`](./LICENSE) for details.

---

## ❤️ Contributing

We welcome contributions in:

* **Core Analysis**: New extraction heuristics, LLM prompt improvements
* **Language Support**: Python, Go, Java, Rust analysis capabilities
* **Viewer UI**: Interactive exploration features, diagram layouts
* **Integration**: Architecture documentation tools, CI/CD integration
* **Documentation**: Examples, tutorials, use cases

PRs encouraged! See the conceptual README for development setup.

---

## 🌟 Roadmap

* **Language Expansion**: Python, Go, Java, Rust support
* **Interactive Refinement**: Human-in-the-loop concept model improvement
* **Advanced Views**: Timeline views, dependency graphs, code hotspots
* **Export Formats**: Mermaid, PlantUML, Draw.io integration
* **Cloud Features**: Collaboration, continuous analysis, team sharing