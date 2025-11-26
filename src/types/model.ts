export type ConceptType =
  | 'entity'
  | 'value_object'
  | 'aggregate_root'
  | 'domain_service'
  | 'application_service'
  | 'event'
  | 'other';

export interface ConceptMetadata {
  name: string;
  type: ConceptType;
  boundedContext?: string;
  aggregateRoot?: boolean;
  criticality?: 'core' | 'supporting' | 'experimental';
}

export interface ConceptDefinition {
  shortDescription: string;
  ubiquitousLanguage?: string;
}

export interface ConceptStructureField {
  name: string;
  type: string;
  description?: string;
}

export interface ConceptRelationship {
  description: string;
}

export interface ConceptLifecycle {
  states?: string[];
  validTransitions?: string[];
}

export interface ConceptInvariant {
  rule: string;
  notes?: string;
}

export interface ConceptCommand {
  name: string;
  description?: string;
}

export interface ConceptEvent {
  name: string;
  description?: string;
}

export interface ImplementationLink {
  kind: 'file' | 'symbol' | 'url';
  label: string;
  path: string;
}

export interface ConceptReference {
  file: string;        // relative path
  line?: number;       // optional line number
  symbol?: string;     // optional symbol name at this location
}

export interface ExternalSystem {
  name: string;
  description?: string;
  direction?: 'inbound' | 'outbound' | 'bidirectional';
}

export interface ConceptSheet {
  metadata: ConceptMetadata;
  definition: ConceptDefinition;
  structure: {
    fields: ConceptStructureField[];
    relationships: ConceptRelationship[];
  };
  lifecycle?: ConceptLifecycle;
  invariants?: ConceptInvariant[];
  commands?: ConceptCommand[];
  events?: ConceptEvent[];
  implementation?: ImplementationLink[];
}

export interface ConceptCandidate {
  name: string;
  type: ConceptType;
  description: string;
  references: ConceptReference[]; // precise references to relevant code locations
}

export interface ProjectOverview {
  summary: string;        // brief description of what the project does
  systemContext: {
    externalSystems: ExternalSystem[];    // systems that interact with this one
    userRoles: { name: string; description?: string }[];  // types of users that interact with the system
    keyDependencies: string[];    // important external dependencies
  };
  containers: {
    services: string[];            // main deployable services/APIs
    userInterfaces: string[];      // web apps, mobile apps, CLIs
    dataStores: string[];          // databases, caches, storage systems
    backgroundJobs: string[];      // workers, queues, scheduled tasks
    deploymentTargets: string[];   // where things run (AWS, GCP, Cloudflare, etc.)
  };
  modules: {
    boundaries: string[];          // how codebase is organized
    responsibilities: string[];    // what each major module does
    domainFocus: string;           // primary domain area
  };
}

export interface ConceptDiscoveryResult {
  repoRoot: string;
  generatedAt: string;
  concepts: ConceptCandidate[];
}

export interface ConceptModel {
  repoRoot: string;
  generatedAt: string;
  projectOverview?: ProjectOverview;
  concepts: ConceptSheet[];
}
