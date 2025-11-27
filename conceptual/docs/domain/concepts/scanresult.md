# ScanResult

**Type:** Value Object
**Bounded Context:** Codebase Analysis
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

The result of scanning a source code repository, containing information about discovered source files relevant for further analysis.

**Ubiquitous Language:**

ScanResult refers specifically to the collection of file metadata extracted from a repository scan. It excludes runtime or dynamic analysis data.

---

## 2. Structure

### Fields

- `files: FileInfo[]` — An array of FileInfo objects representing each source file found during the scan.

### Relationships

- Contains multiple FileInfo value objects representing individual source files.

---

## 3. Lifecycle

**States:**

- `created`

---

## 4. Invariants

- **Each FileInfo must have a valid absolute path within the scanned repository.** (Ensures file references are consistent and resolvable.)
- **Files included must have extensions among the supported set (e.g., .ts, .tsx, .js, .jsx).** (Filters out irrelevant files to focus analysis on source code.)
- **Files matching .gitignore patterns are excluded from the scan result.** (Respects repository ignore rules to avoid scanning unwanted files.)

---

## 7. Implementation

- **ScanResult and FileInfo interfaces:** `src/core/scanRepo.ts`
- **scanRepo function implementing ScanResult generation:** `src/core/scanRepo.ts`
