# SymbolInfo

**Type:** Value Object
**Bounded Context:** Software Codebase Conceptual Modeling
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

Information about a TypeScript symbol extracted from source code, including its kind and metadata.

**Ubiquitous Language:**

SymbolInfo represents a code symbol such as a class, interface, function, or variable in a TypeScript codebase. Synonyms like 'code symbol metadata' or 'symbol descriptor' may be used, but 'SymbolInfo' is the preferred term. It excludes runtime symbol instances or non-TypeScript language symbols.

---

## 2. Structure

### Fields

- `name: string` — The identifier name of the symbol.
- `kind: SymbolKind` — The category of the symbol, e.g., class, interface, function.
- `filePath: string` — Absolute path to the source file containing the symbol.
- `relativePath: string` — Path to the source file relative to the repository root.
- `isExported: boolean` — Indicates if the symbol is exported from its module.
- `isDefaultExport: boolean` — Indicates if the symbol is the default export of its module.
- `line: number` — 1-based line number where the symbol is declared.
- `column: number` — 1-based column number where the symbol is declared.

### Relationships

- SymbolInfo is associated with a source code file within a repository.
- SymbolInfo instances collectively represent the conceptual model of a codebase's symbols.

---

## 4. Invariants

- **The 'name' field must be a non-empty string.** (A symbol must have a valid identifier name.)
- **The 'kind' field must be one of the predefined SymbolKind values: 'class', 'interface', 'typeAlias', 'enum', 'function', or 'variable'.**
- **The 'filePath' must be an absolute path pointing to a valid source file.** (Ensures traceability to source code.)
- **'line' and 'column' must be positive integers representing 1-based positions within the source file.**

---

## 7. Implementation

- **SymbolInfo Type and Extraction Logic:** `src/core/tsSymbols.ts`
- **SymbolInfo Interface:** `src/core/tsSymbols.ts#SymbolInfo`
- **SymbolKind Type:** `src/core/tsSymbols.ts#SymbolKind`
- **extractSymbolsFromSource Function:** `src/core/tsSymbols.ts#extractSymbolsFromSource`
