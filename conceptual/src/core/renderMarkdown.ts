import { ConceptSheet } from '../types/model.js';

export function renderConceptMarkdown(c: ConceptSheet): string {
  const lines: string[] = [];

  lines.push(`# ${c.metadata.name}`);
  lines.push('');
  lines.push(`**Type:** ${c.metadata.type}`);
  if (c.metadata.boundedContext) lines.push(`**Bounded Context:** ${c.metadata.boundedContext}`);
  if (c.metadata.aggregateRoot !== undefined) {
    lines.push(`**Aggregate Root:** ${c.metadata.aggregateRoot ? 'Yes' : 'No'}`);
  }
  if (c.metadata.criticality) {
    lines.push(`**Criticality:** ${c.metadata.criticality}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 1. Definition');
  lines.push('');
  lines.push('**Short Description:**');
  lines.push('');
  lines.push(c.definition.shortDescription);
  lines.push('');

  if (c.definition.ubiquitousLanguage) {
    lines.push('**Ubiquitous Language:**');
    lines.push('');
    lines.push(c.definition.ubiquitousLanguage);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 2. Structure');
  lines.push('');

  lines.push('### Fields');
  lines.push('');
  if (!c.structure.fields || c.structure.fields.length === 0) {
    lines.push('_None inferred_');
  } else {
    for (const f of c.structure.fields) {
      lines.push(`- \`${f.name}: ${f.type}\`${f.description ? ` — ${f.description}` : ''}`);
    }
  }
  lines.push('');

  lines.push('### Relationships');
  lines.push('');
  if (c.structure.relationships.length === 0) {
    lines.push('_None inferred_');
  } else {
    for (const r of c.structure.relationships) {
      lines.push(`- ${r.description}`);
    }
  }
  lines.push('');

  if (c.lifecycle && (c.lifecycle.states?.length || c.lifecycle.validTransitions?.length)) {
    lines.push('---');
    lines.push('');
    lines.push('## 3. Lifecycle');
    lines.push('');

    if (c.lifecycle.states && c.lifecycle.states.length > 0) {
      lines.push('**States:**');
      lines.push('');
      for (const state of c.lifecycle.states) {
        lines.push(`- \`${state}\``);
      }
      lines.push('');
    }

    if (c.lifecycle.validTransitions && c.lifecycle.validTransitions.length > 0) {
      lines.push('**Valid Transitions:**');
      lines.push('');
      for (const transition of c.lifecycle.validTransitions) {
        lines.push(`- \`${transition}\``);
      }
      lines.push('');
    }
  }

  if (c.invariants && c.invariants.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## 4. Invariants');
    lines.push('');
    for (const invariant of c.invariants) {
      lines.push(`- **${invariant.rule}**${invariant.notes ? ` (${invariant.notes})` : ''}`);
    }
    lines.push('');
  }

  if (c.commands && c.commands.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## 5. Commands');
    lines.push('');
    for (const command of c.commands) {
      lines.push(`- **${command.name}**${command.description ? `: ${command.description}` : ''}`);
    }
    lines.push('');
  }

  if (c.events && c.events.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## 6. Events');
    lines.push('');
    for (const event of c.events) {
      lines.push(`- **${event.name}**${event.description ? `: ${event.description}` : ''}`);
    }
    lines.push('');
  }

  if (c.implementation && c.implementation.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## 7. Implementation');
    lines.push('');
    for (const impl of c.implementation) {
      if (impl.kind === 'file') {
        lines.push(`- **${impl.label}:** \`${impl.path}\``);
      } else if (impl.kind === 'symbol') {
        lines.push(`- **${impl.label}:** \`${impl.path}\``);
      } else if (impl.kind === 'url') {
        lines.push(`- **${impl.label}:** ${impl.path}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
