# ConceptDiscoveryResult

**Type:** value_object
**Bounded Context:** Concept Generation
**Aggregate Root:** No
**Criticality:** core

---

## 1. Definition

**Short Description:**

The outcome of the concept discovery process, containing candidate concepts and analysis results.

**Ubiquitous Language:**

Also referred to as discovery result or concept extraction output; excludes raw source code or unrelated metadata.

---

## 2. Structure

### Fields

- `candidateConcepts: ConceptCandidate[]` — A collection of candidate concepts identified during analysis, each representing a potential domain concept extracted from the source code.
- `analysisResults: object` — Aggregated metadata and insights produced by the discovery process, such as symbol relationships, concept confidence scores, or summary statistics.

### Relationships

- Contains multiple ConceptCandidate instances representing discovered concepts.
- Produced by the Concept Generation Service after analyzing source code via the Code Analysis Service.

---

## 3. Lifecycle

**States:**

- `initialized`
- `processing`
- `completed`
- `failed`

**Valid Transitions:**

- `initialized → processing`
- `processing → completed`
- `processing → failed`

---

## 4. Invariants

- **candidateConcepts must not be empty upon completion** (A successful discovery result should contain at least one candidate concept.)
- **analysisResults must accurately reflect the candidateConcepts** (Consistency between concepts and their analysis metadata is required.)

---

## 5. Commands

- **CreateConceptDiscoveryResult**: Instantiate a new ConceptDiscoveryResult with candidate concepts and analysis data.

---

## 6. Events

- **ConceptDiscoveryCompleted**: Emitted when the concept discovery process finishes successfully.
- **ConceptDiscoveryFailed**: Emitted when the concept discovery process encounters an error.

---

## 7. Implementation

- **ConceptCandidate and ConceptDiscoveryResult types:** `src/types/model.ts`
- **Concept generation logic:** `core/generateConcepts.ts`
- **Concept discovery orchestration:** `core/scanRepo.ts`
