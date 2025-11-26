# FileSnippet

**Type:** Value Object
**Bounded Context:** Source Code Analysis
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

Represents a snippet of code extracted from a source file, used for conceptual analysis.

**Ubiquitous Language:**

FileSnippet refers specifically to a small excerpt of source code identified by its relative file path and the snippet content itself. It excludes entire files or metadata unrelated to the snippet content.

---

## 2. Structure

### Fields

- `relativePath: string` — The path of the source file relative to the root of the scanned repository.
- `snippet: string` — The extracted portion of the source code from the file, limited in length for analysis.

### Relationships

- Associated with a source file identified by its relative path within the repository.
