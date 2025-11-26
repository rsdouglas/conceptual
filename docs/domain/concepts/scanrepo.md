# scanRepo

**Type:** Domain Service
**Bounded Context:** Source Code Analysis
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

Service function responsible for scanning a source code repository and producing scan results including file information.

**Ubiquitous Language:**

scanRepo refers specifically to the operation of recursively scanning a repository directory to identify source code files of interest, respecting ignore rules such as .gitignore. It excludes non-source files and directories ignored by the repository configuration.

---

## 2. Structure

### Fields

- `repoRoot: string` — The absolute path to the root directory of the repository to scan.
- `srcDir: string` — Optional subdirectory within the repoRoot to start scanning from, defaults to 'src'.
- `ScanResult: object` — The result of the scan containing an array of FileInfo objects.
- `FileInfo: object` — Information about a single source code file including its absolute path, relative path, and size in bytes.

### Relationships

- scanRepo produces a ScanResult which aggregates multiple FileInfo entities representing discovered source files.
