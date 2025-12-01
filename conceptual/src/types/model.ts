/**
 * A project (or repository) groups multiple concept models that
 * belong together, typically around a single product, system, or domain.
 *
 * Examples:
 * - "Slack Data Request System"
 * - "AI Meeting Assistant (Potato)"
 * - "Monolith → Services Modernization"
 *
 * This is a container *above* individual ConceptModels.
 * It lets you:
 * - keep a high-level summary of what the whole thing is,
 * - organize related models,
 * - and give LLMs/project tooling one entry point.
 */
export type ConceptProjectId = string;

export interface ConceptProject {
  /** Unique identifier for this project/workspace. */
  id: ConceptProjectId;

  /**
   * Human-readable name of the project.
   * Example: "Slack Data Request System" or "Potato Meeting Assistant".
   */
  name: string;

  /**
   * Short summary (1-3 sentences) of what this project is about.
   * Ideal for:
   * - README-style overviews
   * - LLM context
   * - UI project cards
   */
  summary: string;

  /**
   * Optional longer description or background.
   * Use this for narrative context, scope, and goals.
   */
  description?: string;

  /**
   * The concept models that belong to this project.
   * Each ConceptModel can still reference others via `ConceptExternalRef`.
   */
  models: ConceptModel[];

  /**
   * Optional ID of the "primary" or default model to open first in the UI.
   */
  primaryModelId?: ConceptModelId;

  /**
   * Optional tags for organizing or searching projects.
   * Example: ["slack", "data", "ai", "potato"].
   */
  tags?: string[];

  /**
   * Optional link back to the code repository or documentation.
   * Example: "https://github.com/your-org/your-repo"
   */
  repoUrl?: string;

  /**
   * Optional free-form notes (for maintainers, TODOs, etc.).
   */
  notes?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  path: string;
  updatedAt: string;
}

export interface ProjectRegistry {
  projects: ProjectEntry[];
}

/**
 * TypeScript types for representing a Dubberly-style concept model.
 *
 * This version includes:
 * - Concepts, relationships, views
 * - Rules on the model.
 * - NEW: Explicit lifecycles per concept.
 * - NEW: Concept aliases (synonyms).
 * - NEW: Cross-model references for concepts.
 * - NEW: View-level rules.
 */

/* -------------------------------------------------------------------------- */
/*  Basic ID Types                                                            */
/* -------------------------------------------------------------------------- */

export type ConceptModelId = string;
export type ConceptId = string;
export type RelationshipId = string;
export type ModelViewId = string;
export type ModelRuleId = string;

/**
 * Unique ID for a lifecycle specification.
 * Each lifecycle describes how one concept changes state over time.
 */
export type ConceptLifecycleId = string;

/* -------------------------------------------------------------------------- */
/*  Concept Model                                                             */
/* -------------------------------------------------------------------------- */

export interface ConceptModel {
  id: ConceptModelId;

  title: string;
  subtitle?: string;
  description?: string;

  concepts: Concept[];
  relationships: Relationship[];

  /**
   * Natural-language rules / constraints / principles about the model.
   */
  rules?: ModelRule[];

  /**
   * NEW: Lifecycles for specific concepts.
   *
   * Each lifecycle:
   * - identifies a "subject" concept (e.g. Data Request)
   * - lists the state concepts that form its state space
   * - points at relationships that represent allowed transitions
   * - can mark initial and terminal states
   */
  lifecycles?: ConceptLifecycle[];

  /**
   * Subsets of concepts/relationships used to present focused diagrams
   * or perspectives (e.g. "Slack bot flow", "Admin UI").
   */
  views?: ModelView[];

  /**
   * Narrative, path-based perspectives on this model.
   * Each StoryView breaks the model into a sequence of steps, where
   * each step highlights a small subgraph plus explanatory text.
   */
  storyViews?: StoryView[];
}

/* -------------------------------------------------------------------------- */
/*  Concepts (Nodes)                                                          */
/* -------------------------------------------------------------------------- */

export type ConceptCategory =
  | 'thing'
  | 'activity'
  | 'role'
  | 'state'
  | 'event'
  | 'place'
  | 'time'
  | 'other';

/**
 * Cross-model reference: indicates that this concept corresponds to (or is
 * aligned with) a concept in another model.
 *
 * Use this to avoid duplication when the same idea appears in multiple models.
 */
export interface ConceptExternalRef {
  /**
   * ID of the other model that also defines this concept.
   */
  modelId: ConceptModelId;

  /**
   * ID of the concept in that other model.
   */
  conceptId: ConceptId;

  /**
   * Optional note describing how this concept relates to the external one:
   * e.g. "Identical concept in the Organization Roles model" or
   * "More detailed version of X in the Evaluation model".
   */
  note?: string;
}

/**
 * A concept is a labeled node in the Dubberly-style model.
 */
export interface Concept {
  id: ConceptId;

  label: string;
  description?: string;
  category?: ConceptCategory;

  /**
   * NEW: Alternative labels / synonyms / colloquial names.
   *
   * Examples:
   * - "Data request" might have aliases ["request", "query"].
   * - "Admin" might have aliases ["administrator", "owner"].
   *
   * This is especially useful when different teams or tools use different terms.
   */
  aliases?: string[];

  /**
   * NEW: References to equivalent/related concepts in other models.
   *
   * This lets you keep multiple models while still showing that
   * "this concept is the same as that one over there".
   */
  externalRefs?: ConceptExternalRef[];

  notes?: string;
}

/* -------------------------------------------------------------------------- */
/*  Relationships (Arrows)                                                    */
/* -------------------------------------------------------------------------- */

export type RelationshipCategory =
  | 'is_a'
  | 'part_of'
  | 'causes'
  | 'enables'
  | 'prevents'
  | 'precedes'
  | 'uses'
  | 'represents'
  | 'other';

export interface Relationship {
  id: RelationshipId;

  from: ConceptId;
  to: ConceptId;

  phrase?: string;
  category?: RelationshipCategory;
  description?: string;
  notes?: string;
}

/* -------------------------------------------------------------------------- */
/*  Rules / Constraints / Principles                                          */
/* -------------------------------------------------------------------------- */

export type ModelRuleKind =
  | 'assumption'
  | 'invariant'
  | 'policy'
  | 'constraint'
  | 'principle'
  | 'other';

export interface ModelRule {
  id: ModelRuleId;

  title: string;
  text: string;
  kind?: ModelRuleKind;

  conceptIds?: ConceptId[];
  relationshipIds?: RelationshipId[];

  notes?: string;
}

/* -------------------------------------------------------------------------- */
/*  Lifecycles                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A lifecycle describes how one specific concept moves through states over time.
 *
 * Example:
 * - subjectConceptId = "DataRequest"
 * - stateConceptIds = ["Pending", "InProgress", "Completed", "Failed"]
 * - transitionRelationshipIds = relationships connecting those states
 * - initialStateId = "Pending"
 * - terminalStateIds = ["Completed", "Failed"]
 *
 * NOTE:
 * - States themselves are regular `Concept` objects (usually with category 'state').
 * - Transitions are regular `Relationship` objects (usually between state concepts).
 */
export interface ConceptLifecycle {
  id: ConceptLifecycleId;

  /**
   * The concept whose lifecycle this describes.
   * Example: the "Data Request" concept.
   */
  subjectConceptId: ConceptId;

  /**
   * Concepts that represent the states in this lifecycle.
   * These should be existing concepts (often with category 'state').
   */
  stateConceptIds: ConceptId[];

  /**
   * Relationships that represent allowed transitions between states.
   * These should be relationships whose `from` and `to` are among `stateConceptIds`.
   */
  transitionRelationshipIds: RelationshipId[];

  /**
   * Optional ID of the initial / starting state for this lifecycle.
   */
  initialStateId?: ConceptId;

  /**
   * Optional IDs of terminal / end states (e.g. Completed, Failed).
   */
  terminalStateIds?: ConceptId[];

  /**
   * Optional rules specific to this lifecycle.
   * Example: "Once a Data Request reaches Completed, it must not change state again."
   */
  rules?: ModelRule[];

  notes?: string;
}

/* -------------------------------------------------------------------------- */
/*  Views (Subsets / Perspectives)                                            */
/* -------------------------------------------------------------------------- */

export interface ModelView {
  id: ModelViewId;
  name: string;
  description?: string;

  conceptIds: ConceptId[];
  relationshipIds: RelationshipId[];

  /**
   * NEW: Rules that apply specifically to this view/perspective.
   *
   * Example:
   * - In the "Slack Bot Flow" view:
   *   "Only messages from public channels are processed."
   *
   * These can coexist with model-level rules. Use view-level rules when
   * something is true only within this perspective (or when explaining this view).
   */
  rules?: ModelRule[];
}

/* -------------------------------------------------------------------------- */
/*  Story Views (Scenarios / Narratives Over the Model)                       */
/* -------------------------------------------------------------------------- */

export type StoryViewId = string;
export type StoryStepId = string;

/**
 * A StoryView is a narrative, path-based perspective on the model.
 *
 * Instead of showing the whole graph at once, it breaks things into
 * a sequence of "steps" or "panels". Each step highlights a small
 * subgraph (concepts + relationships) and adds narrative text.
 *
 * Examples:
 * - "Simple Slack data request"
 * - "Escalated request with re-classification"
 * - "Admin updates evaluation config"
 *
 * The same Concept can appear in many steps. Renderers are free to
 * duplicate nodes per step; this is *not* a single global layout.
 */
export interface StoryView {
  id: StoryViewId;
  name: string;
  description?: string;

  /**
   * Optional high-level tags for searching / grouping stories.
   * Example: ["happy_path", "slack", "admin", "error"]
   */
  tags?: string[];

  /**
   * Optional ID of the main concept this story is "about".
   * Example: the Data Request concept, or Slack Thread.
   */
  focusConceptId?: ConceptId;

  /**
   * Ordered list of steps in this story.
   *
   * Each step is typically rendered as a frame:
   * - a small diagram (subset of concepts/relationships)
   * - with explanatory text beneath or alongside it.
   */
  steps: StoryStep[];
}

/**
 * One "panel" or "frame" in a story.
 *
 * Each step:
 * - references model concepts/relationships
 * - can highlight a subset as primary/emphasised
 * - has narrative text that explains what's happening
 */
export interface StoryStep {
  id: StoryStepId;

  /** 0-based index or explicit order. */
  index: number;

  /**
   * Short title for this step.
   * Example: "User posts a question in #data-help"
   */
  title: string;

  /**
   * Optional longer narrative for this step.
   * Example:
   * "A Slack user posts a message in a public channel. The bot is listening
   *  to this channel and will consider messages as candidate data requests."
   */
  narrative?: string;

  /**
   * Concepts that participate in this step.
   * These must be valid ConceptIds from the parent ConceptModel.
   *
   * Renderers may show only these nodes for this frame, even if the
   * full model has many more.
   */
  conceptIds: ConceptId[];

  /**
   * Relationships that are relevant in this step.
   * These must be valid RelationshipIds from the parent ConceptModel.
   */
  relationshipIds: RelationshipId[];

  /**
   * Optional subset of concepts to visually emphasise in this step.
   * Example: the "Data Request" concept when it is first created.
   */
  primaryConceptIds?: ConceptId[];

  /**
   * Optional subset of relationships to emphasise.
   * Example: the specific arrow that represents "classified as".
   */
  primaryRelationshipIds?: RelationshipId[];

  /**
   * Optional notes for maintainers / modelers (not usually rendered in UI).
   */
  notes?: string;

}
