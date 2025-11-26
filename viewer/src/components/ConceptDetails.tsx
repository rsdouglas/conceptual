import type { ConceptSheet } from '../../../src/types/model';

interface Props {
  concept?: ConceptSheet;
}

export function ConceptDetails({ concept }: Props) {
  if (!concept) {
    return <div style={{ padding: 16 }}>Select a concept</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>{concept.metadata.name}</h1>
      <p>{concept.definition.shortDescription}</p>

      {/* Metadata section */}
      <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#666' }}>Metadata</h3>
        <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
          <div><strong>Type:</strong> {concept.metadata.type}</div>
          {concept.metadata.boundedContext && (
            <div><strong>Bounded Context:</strong> {concept.metadata.boundedContext}</div>
          )}
          {concept.metadata.aggregateRoot !== undefined && (
            <div><strong>Aggregate Root:</strong> {concept.metadata.aggregateRoot ? 'Yes' : 'No'}</div>
          )}
          {concept.metadata.criticality && (
            <div><strong>Criticality:</strong> {concept.metadata.criticality}</div>
          )}
        </div>
      </div>

      {/* Ubiquitous Language */}
      {concept.definition.ubiquitousLanguage && (
        <div style={{ marginBottom: 24 }}>
          <h2>Ubiquitous Language</h2>
          <p style={{ fontStyle: 'italic', color: '#555' }}>{concept.definition.ubiquitousLanguage}</p>
        </div>
      )}

      <h2>Fields</h2>
      <ul>
        {concept.structure.fields.map((f) => (
          <li key={f.name}>
            <strong>{f.name}</strong>: {f.type}
            {f.description ? <> – <em>{f.description}</em></> : null}
          </li>
        ))}
      </ul>

      {concept.structure.relationships && concept.structure.relationships.length > 0 && (
        <>
          <h2>Relationships</h2>
          <ul>
            {concept.structure.relationships.map((r, i) => (
              <li key={i}>{r.description}</li>
            ))}
          </ul>
        </>
      )}

      {concept.lifecycle && (concept.lifecycle.states?.length || concept.lifecycle.validTransitions?.length) && (
        <>
          <h2>Lifecycle</h2>
          {concept.lifecycle.states && concept.lifecycle.states.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3>States</h3>
              <ul>
                {concept.lifecycle.states.map((state, i) => (
                  <li key={i}><code>{state}</code></li>
                ))}
              </ul>
            </div>
          )}
          {concept.lifecycle.validTransitions && concept.lifecycle.validTransitions.length > 0 && (
            <div>
              <h3>Valid Transitions</h3>
              <ul>
                {concept.lifecycle.validTransitions.map((transition, i) => (
                  <li key={i}><code>{transition}</code></li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {concept.invariants && concept.invariants.length > 0 && (
        <>
          <h2>Invariants</h2>
          <ul>
            {concept.invariants.map((i, idx) => (
              <li key={idx}>
                <strong>{i.rule}</strong> {i.notes && <>({i.notes})</>}
              </li>
            ))}
          </ul>
        </>
      )}

      {concept.commands && concept.commands.length > 0 && (
        <>
          <h2>Commands</h2>
          <ul>
            {concept.commands.map((c, idx) => (
              <li key={idx}>
                <strong>{c.name}</strong>
                {c.description && <>: {c.description}</>}
              </li>
            ))}
          </ul>
        </>
      )}

      {concept.events && concept.events.length > 0 && (
        <>
          <h2>Events</h2>
          <ul>
            {concept.events.map((e, idx) => (
              <li key={idx}>
                <strong>{e.name}</strong>
                {e.description && <>: {e.description}</>}
              </li>
            ))}
          </ul>
        </>
      )}

      {concept.implementation && concept.implementation.length > 0 && (
        <>
          <h2>Implementation</h2>
          <ul>
            {concept.implementation.map((impl, idx) => (
              <li key={idx}>
                <strong>{impl.label}</strong>
                {impl.kind === 'file' && (
                  <>: <code>{impl.path}</code></>
                )}
                {impl.kind === 'symbol' && (
                  <>: <code>{impl.path}</code></>
                )}
                {impl.kind === 'url' && (
                  <>: <a href={impl.path} target="_blank" rel="noopener noreferrer">{impl.path}</a></>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
