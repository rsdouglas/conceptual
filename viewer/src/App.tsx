import { useEffect, useState } from 'react';
import type { ConceptModel, ProjectRegistry } from '../../conceptual/src/types/model';
import { ProjectOverviewHero } from './components/ProjectOverviewHero';
import { DomainMap } from './components/DomainMap';
import { ConceptDetailSpec } from './components/ConceptDetailSpec';
import { Layers } from 'lucide-react';

import { StructureView } from './components/StructureView';

function App() {
  const [registry, setRegistry] = useState<ProjectRegistry | null>(null);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [model, setModel] = useState<ConceptModel | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'map' | 'structure'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Sync state to URL (only after initial load to avoid overwriting URL params)
  useEffect(() => {
    if (!initialLoadComplete) return;

    const params = new URLSearchParams();
    if (currentProject) params.set('project', currentProject);
    if (viewMode !== 'overview') params.set('view', viewMode);
    if (selectedConcept) params.set('concept', selectedConcept);

    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    window.history.replaceState({}, '', newUrl);
  }, [currentProject, viewMode, selectedConcept, initialLoadComplete]);

  // Load registry on mount and initialize from URL
  useEffect(() => {
    fetch('/models/registry.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load project registry');
        return res.json();
      })
      .then((data: ProjectRegistry) => {
        setRegistry(data);

        // Read from URL params
        const params = new URLSearchParams(window.location.search);
        const urlProject = params.get('project');
        const urlView = params.get('view') as 'overview' | 'map' | 'structure' | null;
        const urlConcept = params.get('concept');

        // Set initial project from URL or default to first
        if (urlProject && data.projects.some(p => p.id === urlProject)) {
          setCurrentProject(urlProject);
        } else if (data.projects.length > 0) {
          setCurrentProject(data.projects[0].id);
        } else {
          setLoading(false);
        }

        // Set initial view from URL
        if (urlView === 'map' || urlView === 'structure') {
          setViewMode(urlView);
        }

        // Set initial concept from URL (will be applied after model loads)
        if (urlConcept) {
          setSelectedConcept(urlConcept);
        }

        // Mark initial load as complete
        setInitialLoadComplete(true);
      })
      .catch(err => {
        console.error(err);
        setError('Could not load projects. Have you analyzed any repos yet?');
        setLoading(false);
      });
  }, []);

  // Load model when project changes
  useEffect(() => {
    if (!currentProject || !registry) return;

    const project = registry.projects.find(p => p.id === currentProject);
    if (!project) return;

    setLoading(true);
    fetch(`/${project.path}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load model for ${project.name}`);
        return res.json();
      })
      .then((data: ConceptModel) => {
        setModel(data);
        // Don't reset selectedConcept here - let URL params control it
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(`Failed to load project: ${project.name}`);
        setLoading(false);
      });
  }, [currentProject, registry]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading conceptual model...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md text-center">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return <div className="p-8 text-center text-slate-500">No projects found. Run "conceptgen analyze" first.</div>;
  }

  const currentConceptData = selectedConcept ? model.concepts.find(c => c.metadata.name === selectedConcept) : null;
  const projectInfo = registry?.projects.find(p => p.id === currentProject);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Conceptual Viewer</span>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => { setViewMode('overview'); setSelectedConcept(null); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'overview' && !selectedConcept ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => { setViewMode('structure'); setSelectedConcept(null); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'structure' && !selectedConcept ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Contexts
            </button>
          </div>
        </div>

        {/* Project Selector */}
        {registry && registry.projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</span>
            <select
              value={currentProject || ''}
              onChange={(e) => setCurrentProject(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {registry.projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 ${viewMode === 'structure' && !selectedConcept ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}>
        {selectedConcept && currentConceptData ? (
          // Level 3 & 4: Detail View
          <ConceptDetailSpec
            concept={currentConceptData}
            onBack={() => setSelectedConcept(null)}
          />
        ) : viewMode === 'structure' ? (
          // Structure View
          <StructureView concepts={model.concepts} onSelect={setSelectedConcept} />
        ) : (
          // Level 1 & 2: Overview & Domain Map
          <div className="pb-20">
            {/* Level 1: Helicopter View */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
              {model.projectOverview ? (
                <ProjectOverviewHero overview={model.projectOverview} projectName={projectInfo?.name || 'Unknown Project'} />
              ) : (
                <div className="p-8 text-center text-slate-500 italic">Project overview not available</div>
              )}
            </div>

            {/* Level 2: Domain Map */}
            <div className="mt-8">
              <DomainMap concepts={model.concepts} onSelect={setSelectedConcept} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
