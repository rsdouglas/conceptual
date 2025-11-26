import { useState } from 'react';

import type { ConceptModel } from '../../src/types/model';
import modelJson from '../concept-model.json';
import { ConceptDetails } from './components/ConceptDetails';
import { ConceptList } from './components/ConceptList';
import { ProjectOverviewPanel } from './components/ProjectOverviewPanel';

const model = modelJson as ConceptModel;

function App() {
  const [selected, setSelected] = useState<string>('__overview__'); // Default to overview

  const current = model.concepts.find((c) => c.metadata.name === selected);
  const showOverview = selected === '__overview__';

  return (
    <div
      style={{
        display: 'flex',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <ConceptList model={model} onSelect={setSelected} />
      <div style={{ flex: 1 }}>
        {showOverview ? (
          <ProjectOverviewPanel overview={model.projectOverview} />
        ) : (
          <ConceptDetails concept={current} />
        )}
      </div>
    </div>
  );
}

export default App;
