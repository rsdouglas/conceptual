# ConceptSheet

**Type:** entity
**Bounded Context:** Software Codebase Conceptual Modeling and Documentation Generation
**Aggregate Root:** Yes
**Criticality:** core

---

## 1. Definition

**Short Description:**

A structured document representing a detailed conceptual description of a domain concept, including metadata and relationships.

**Ubiquitous Language:**

ConceptSheet refers specifically to the structured representation of domain concepts within the project, synonymous with 'concept document' or 'concept model sheet'. It excludes informal notes or unstructured documentation.

---

## 2. Structure

### Fields

- `metadata: ConceptMetadata` — Contains the core identifying information about the concept such as name, type, bounded context, aggregate root status, and criticality.
- `definition: ConceptDefinition` — Provides a short description and optionally the ubiquitous language for the concept.
- `structure.fields: ConceptStructureField[]` — Domain-relevant properties that define the conceptual structure of the concept.
- `structure.relationships: ConceptRelationship[]` — Describes meaningful domain relationships to other concepts.
- `lifecycle: ConceptLifecycle` — Optional lifecycle states and valid transitions for the concept.
- `invariants: ConceptInvariant[]` — Non-negotiable business rules that must always hold true for the concept.
- `commands: ConceptCommand[]` — Actions that modify or interact with the concept.
- `events: ConceptEvent[]` — Domain events emitted by the concept when significant changes occur.
- `implementation: ImplementationLink[]` — References to code files, symbols, or URLs implementing or defining the concept.

### Relationships

- ConceptSheet aggregates multiple domain concepts and their metadata into a single structured document.
- ConceptSheet is used by Concept Generation Service to produce conceptual documentation.
- ConceptSheet is consumed by the Concept Viewer UI for rendering conceptual insights.

---

## 3. Lifecycle

**States:**

- `draft`
- `reviewed`
- `published`
- `archived`

**Valid Transitions:**

- `draft → reviewed`
- `reviewed → published`
- `published → archived`
- `archived → draft`

---

## 4. Invariants

- **Each ConceptSheet must have a unique name within its bounded context.** (Ensures unambiguous identification of concepts.)
- **The metadata.type must be one of the predefined ConceptType values.** (Maintains consistency in concept classification.)
- **If aggregateRoot is true, the ConceptSheet must define invariants controlling the cluster.** (Preserves domain integrity boundaries.)

---

## 5. Commands

- **CreateConceptSheet**: Initialize a new ConceptSheet with metadata and definition.
- **UpdateConceptSheet**: Modify fields, relationships, or lifecycle state of an existing ConceptSheet.
- **PublishConceptSheet**: Mark the ConceptSheet as published, making it available for consumption.
- **ArchiveConceptSheet**: Archive the ConceptSheet to indicate it is no longer active.

---

## 6. Events

- **ConceptSheetCreated**: Emitted when a new ConceptSheet is created.
- **ConceptSheetUpdated**: Emitted when an existing ConceptSheet is updated.
- **ConceptSheetPublished**: Emitted when a ConceptSheet is published.
- **ConceptSheetArchived**: Emitted when a ConceptSheet is archived.

---

## 7. Implementation

- **ConceptSheet Type Definitions:** `src/types/model.ts`
- **Concept Generation Logic:** `core/generateConcepts.ts`
- **Concept Rendering to Markdown:** `core/renderMarkdown.ts`
- **Concept Viewer UI:** `ConceptViewer (web or markdown-based UI)`
