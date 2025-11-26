# Conceptual

**Understand any codebase instantly.**  
Conceptual analyzes a software repository and generates a complete 
high-level model of the project:

- A **system overview** (services, dependencies, external systems)
- A **domain map** of core entities, aggregates, services, and events
- Rich **concept sheets** capturing business logic, invariants, and workflows
- A lightweight **UI viewer** for exploring concepts visually
- Direct links back to implementation files and symbols

Perfect for:
- Understanding AI-generated codebases  
- Onboarding new developers  
- PM & stakeholder visibility  
- Auditing legacy systems  
- Refactoring & architecture work  
- Aligning domain language across teams  

---

## ✨ Features

### 🔍 Concept Extraction
Automatically identifies domain concepts from code:
- Entities, value objects, aggregates  
- Domain & application services  
- Events, invariants, commands  
- Lifecycle states and transitions  

### 📘 Concept Sheets
Clear, structured “spec-like” Markdown files describing each concept:
- Metadata  
- Structure  
- Relationships  
- Invariants  
- Commands & events  
- Implementation links  

### 🗺️ Domain Map UI
A modern Tailwind-powered viewer:
- Project overview  
- Concept map  
- Drill-down into details  
- Source links  

### ⚡ Fast and Local
Works entirely offline.  
No data or source code leaves your machine.

---

## 🚀 Getting Started

### Install

```bash
cd conceptual
pnpm install
pnpm build
````

### Analyze a codebase

```bash
cd conceptual
pnpm dev analyze /path/to/repo
```

Generates:

```
docs/domain/concept-model.json
docs/domain/concepts/*.md
```

### Run the viewer

```bash
cd viewer
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 🧪 Status

Conceptual is early but evolving quickly.
Expect breaking changes as the model becomes richer and more precise.

Pull requests are welcome!

---

## 🪪 License

Conceptual is licensed under the **Business Source License 1.1 (BSL)**.

* Free for personal, educational, research, and internal commercial use.
* **Not permitted**: hosting or offering Conceptual as a competitive
  cloud service.
* Automatically converts to Apache 2.0 after the change date.

See [`LICENSE`](./LICENSE) for details.

---

## ❤️ Contributing

We welcome:

* Bug reports
* Feature requests
* New extraction heuristics
* LLM prompt improvements
* Viewer UI suggestions

PRs encouraged!

---

## 🌟 Roadmap

* Workflow extraction
* Cross-concept relationship graphs
* Code hotspots & dependency insights
* LLM-driven concept refinement
* Cloud version with collaboration and continuous analysis