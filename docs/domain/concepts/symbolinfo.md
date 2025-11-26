# SymbolInfo

**Type:** Value Object
**Bounded Context:** Source Code Analysis
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

Represents detailed information about a TypeScript symbol extracted from source code.

**Ubiquitous Language:**

SymbolInfo refers specifically to TypeScript code symbols such as classes, interfaces, functions, variables, enums, and type aliases. It excludes runtime or non-TypeScript symbols.

---

## 2. Structure

### Fields

- `name: string` — The identifier name of the symbol.
- `kind: SymbolKind` — The category/type of the symbol (e.g., class, interface, function).
- `filePath: string` — Absolute file system path to the source file containing the symbol.
- `relativePath: string` — File path relative to the root of the scanned repository.
- `isExported: boolean` — Indicates if the symbol is exported from its module.
- `isDefaultExport: boolean` — Indicates if the symbol is the default export of its module.
- `line: number` — 1-based line number where the symbol is declared.
- `column: number` — 1-based column number where the symbol is declared.

### Relationships

- SymbolInfo is associated with a source file within a repository.
- SymbolInfo instances collectively represent the conceptual symbols extracted from a codebase.
