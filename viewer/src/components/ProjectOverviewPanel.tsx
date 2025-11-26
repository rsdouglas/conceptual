import type { ProjectOverview } from '../../../conceptual/src/types/model';

interface Props {
  overview?: ProjectOverview;
}

export function ProjectOverviewPanel({ overview }: Props) {
  if (!overview) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontSize: 24, borderBottom: '2px solid #eee', paddingBottom: 8 }}>
          Project Overview
        </h1>
        <p style={{ marginTop: 16, color: '#666' }}>
          No project overview data available yet. Run the analyzer with a model that populates
          <code>projectOverview</code>.
        </p>
      </div>
    );
  }

  const { summary, systemContext, containers, modules } = overview;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', fontSize: 14, lineHeight: 1.6 }}>
      <h1 style={{ margin: 0, fontSize: 24, borderBottom: '2px solid #eee', paddingBottom: 8 }}>
        Project Overview
      </h1>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: '24px 0 12px', fontSize: 18, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
          1. Overview
        </h2>
        <p style={{ margin: 0 }}>{summary}</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: '24px 0 12px', fontSize: 18, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
          2. System Context
        </h2>

        <h3 style={{ margin: '16px 0 8px', fontSize: 16 }}>External Systems</h3>
        {systemContext.externalSystems.length === 0 ? (
          <p style={{ color: '#888', margin: 0 }}>None detected</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {systemContext.externalSystems.map((s) => (
              <li key={s.name} style={{ marginBottom: 4 }}>
                <strong>{s.name}</strong>
                {s.direction && (
                  <span style={{ color: '#555' }}> ({s.direction})</span>
                )}
                {s.description && (
                  <span style={{ color: '#777' }}> – {s.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <h3 style={{ margin: '16px 0 8px', fontSize: 16 }}>User Roles</h3>
        {systemContext.userRoles.length === 0 ? (
          <p style={{ color: '#888', margin: 0 }}>None detected</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {systemContext.userRoles.map((r) => (
              <li key={r.name} style={{ marginBottom: 4 }}>
                <strong>{r.name}</strong>
                {r.description && (
                  <span style={{ color: '#777' }}> – {r.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <h3 style={{ margin: '16px 0 8px', fontSize: 16 }}>Key Dependencies</h3>
        {systemContext.keyDependencies.length === 0 ? (
          <p style={{ color: '#888', margin: 0 }}>None listed</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {systemContext.keyDependencies.map((d) => (
              <li key={d} style={{ marginBottom: 4 }}>{d}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: '24px 0 12px', fontSize: 18, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
          3. Architecture (Containers)
        </h2>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <strong>Services:</strong>{' '}
            {containers.services.length ? containers.services.join(', ') : 'None'}
          </div>
          <div>
            <strong>User Interfaces:</strong>{' '}
            {containers.userInterfaces.length ? containers.userInterfaces.join(', ') : 'None'}
          </div>
          <div>
            <strong>Data Stores:</strong>{' '}
            {containers.dataStores.length ? containers.dataStores.join(', ') : 'None'}
          </div>
          <div>
            <strong>Background Jobs:</strong>{' '}
            {containers.backgroundJobs.length ? containers.backgroundJobs.join(', ') : 'None'}
          </div>
          <div>
            <strong>Deployment Targets:</strong>{' '}
            {containers.deploymentTargets.length ? containers.deploymentTargets.join(', ') : 'None'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: '24px 0 12px', fontSize: 18, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
          4. Modules
        </h2>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <strong>Domain Focus:</strong> {modules.domainFocus || 'Not specified'}
          </div>
          <div>
            <strong>Boundaries:</strong>{' '}
            {modules.boundaries.length ? modules.boundaries.join(', ') : 'Not specified'}
          </div>
          <div>
            <strong>Responsibilities:</strong>{' '}
            {modules.responsibilities.length ? modules.responsibilities.join(', ') : 'Not specified'}
          </div>
        </div>
      </div>
    </div>
  );
}