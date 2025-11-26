import type { ConceptModel } from '../../../src/types/model';

interface Props {
  model: ConceptModel;
  onSelect: (name: string) => void;
}

export function ConceptList({ model, onSelect }: Props) {
  return (
    <div style={{ padding: 16, borderRight: '1px solid #ddd', width: 280 }}>
      <h2 style={{ marginTop: 0 }}>Navigation</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {/* Project Overview */}
        <li style={{ marginBottom: 16 }}>
          <button
            onClick={() => onSelect('__overview__')}
            style={{
              backgroundColor: '#f0f8ff',
              border: '1px solid #e1e5e9',
              padding: 8,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              width: '100%',
              borderRadius: 4,
            }}
          >
            <strong>🏗️ Project Overview</strong>
            <br />
            <span style={{ color: '#666', fontSize: '12px' }}>System architecture & context</span>
          </button>
        </li>

        {/* Concepts header */}
        <li style={{ marginBottom: 8 }}>
          <h3 style={{ margin: '16px 0 8px', fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
            Domain Concepts ({model.concepts.length})
          </h3>
        </li>

        {model.concepts.map((c) => (
          <li key={c.metadata.name} style={{ marginBottom: 8 }}>
            <button
              onClick={() => onSelect(c.metadata.name)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
              }}
            >
              <strong>{c.metadata.name}</strong>
              <br />
              <span style={{ color: '#666' }}>{c.metadata.type}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
