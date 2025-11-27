# ConceptModel

**Type:** entity
**Bounded Context:** Software Codebase Conceptual Modeling
**Aggregate Root:** Yes
**Criticality:** core

---

## 1. Definition

**Short Description:**

Represents the conceptual model extracted from a codebase, including definitions, relationships, and metadata about software concepts.

**Ubiquitous Language:**

ConceptModel refers specifically to the structured representation of software concepts derived from source code analysis. Synonyms like 'Conceptual Model' or 'Code Concept Model' may be used interchangeably, but exclude unrelated models such as data models or UML diagrams.

---

## 2. Structure

### Fields

- `definitions: ConceptDefinition[]` — The set of conceptual definitions extracted from the codebase.
- `relationships: ConceptRelationship[]` — Describes how concepts relate to each other within the model.
- `metadata: ConceptMetadata` — Metadata about the conceptual model including name, type, bounded context, and criticality.
- `lifecycle: ConceptLifecycle` — Optional lifecycle states and transitions relevant to the conceptual model.
- `invariants: ConceptInvariant[]` — Business rules and constraints that the conceptual model must satisfy.
- `commands: ConceptCommand[]` — Actions that can be performed to modify or interact with the conceptual model.
- `events: ConceptEvent[]` — Domain events emitted by the conceptual model when significant changes occur.

### Relationships

- Aggregates multiple ConceptDefinitions representing individual software concepts.
- Maintains relationships among concepts to represent dependencies and associations.
- Interacts with external systems such as LLM APIs for concept generation and Concept Viewer for presentation.

---

## 3. Lifecycle

**States:**

- `initialized`
- `scanned`
- `conceptsGenerated`
- `published`

**Valid Transitions:**

- `initialized → scanned`
- `scanned → conceptsGenerated`
- `conceptsGenerated → published`

---

## 4. Invariants

- **Each ConceptModel must have a unique name within its bounded context.** (Ensures unambiguous identification of conceptual models.)
- **Concept relationships must not form cyclic dependencies.** (Prevents infinite loops and inconsistent conceptual graphs.)
- **All referenced concepts in relationships must exist within the ConceptModel.** (Maintains model integrity and completeness.)

---

## 5. Commands

- **ScanRepository**: Initiates scanning of the source code repository to extract raw data for concept generation.
- **GenerateConcepts**: Processes scanned data using language models to produce conceptual definitions and relationships.
- **PublishConceptModel**: Publishes the generated conceptual model to the Concept Viewer or other documentation platforms.
- **UpdateConceptModel**: Applies incremental changes or refreshes to the existing conceptual model.

---

## 6. Events

- **RepositoryScanned**: Emitted after the source code repository has been successfully scanned.
- **ConceptsGenerated**: Emitted when conceptual definitions and relationships have been generated.
- **ConceptModelPublished**: Emitted after the conceptual model has been published for consumption.
- **ConceptModelUpdated**: Emitted when the conceptual model is updated with new or changed information.

---

## 7. Implementation

- **Concept model types and interfaces:** `src/types/model.ts`
- **Concept generation logic:** `core/generateConcepts.ts`
- **Repository scanning service:** `core/scanRepo.ts`
- **LLM integration for concept extraction:** `core/llm.ts`
- **Markdown rendering for concept documentation:** `core/renderMarkdown.ts`
