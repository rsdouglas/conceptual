# FileSnippet

**Type:** Value Object
**Bounded Context:** Code Analysis
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

A snippet of source code extracted from a file, used as input for concept extraction and analysis.

**Ubiquitous Language:**

FileSnippet refers specifically to a small portion of source code text taken from a file, identified by its relative path within the repository. It is immutable and has no identity beyond its value.

---

## 2. Structure

### Fields

- `relativePath: string` — The file path relative to the root of the repository, identifying the source file from which the snippet was extracted.
- `snippet: string` — The actual source code text extracted from the file, limited in length.

### Relationships

- Associated with a source file identified by relativePath within a scanned repository.

---

## 4. Invariants

- **The snippet must be a substring of the source file content identified by relativePath.** (Ensures snippet integrity and traceability.)
- **The snippet length must not exceed the configured maximum characters per file (e.g., 2000).** (Prevents overly large snippets that could impact performance.)

---

## 7. Implementation

- **FileSnippet interface and extractSnippets function:** `src/core/extractSnippets.ts`
