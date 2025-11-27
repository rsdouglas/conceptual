import { useEffect, useState } from 'react';
import type { ConceptProject, ProjectRegistry, ConceptModel } from '../../conceptual/src/types/model';
import { ConceptDetailSpec } from './components/ConceptDetailSpec';
import { Layers, ChevronRight, Database, Box, Zap, Activity, Code, LayoutGrid, GitBranch } from 'lucide-react';

function App() {
  const [registry, setRegistry] = useState<ProjectRegistry | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<ConceptProject | null>(null);

  // Navigation State
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load registry
  useEffect(() => {
    fetch('/models/registry.json')
      .then(res => res.json())
      .then((data: ProjectRegistry) => {
        setRegistry(data);
        if (data.projects.length > 0) {
          setCurrentProjectId(data.projects[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load project registry.');
        setLoading(false);
      });
  }, []);

  // Load project
  useEffect(() => {
    if (!currentProjectId || !registry) return;
    const entry = registry.projects.find(p => p.id === currentProjectId);
    if (!entry) return;

    setLoading(true);
    fetch(`/${entry.path}`)
      .then(res => res.json())
      .then((data: ConceptProject) => {
        setProject(data);
        setLoading(false);
        // Reset selection on project change
        setSelectedModelId(null);
        setSelectedConceptId(null);
      })
      .catch(err => {
        console.error(err);
        setError(`Failed to load project: ${entry.name}`);
        setLoading(false);
      });
  }, [currentProjectId, registry]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-slate-400">No project selected</div>;

  // Derived state
  const selectedModel = project.models?.find(m => m.id === selectedModelId);
  const selectedConcept = selectedModel?.concepts?.find(c => c.id === selectedConceptId);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold">
            <Layers className="w-5 h-5" />
            <span>Concept Explorer</span>
          </div>

          {/* Project Selector */}
          <div className="relative">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Project</label>
            <select
              value={currentProjectId || ''}
              onChange={e => setCurrentProjectId(e.target.value)}
              className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {registry?.projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Model List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Models (Contexts)
          </div>
          <button
            onClick={() => { setSelectedModelId(null); setSelectedConceptId(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
              ${!selectedModelId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
            `}
          >
            <LayoutGrid className="w-4 h-4" />
            Project Overview
          </button>

          {project.models.map(model => (
            <button
              key={model.id}
              onClick={() => { setSelectedModelId(model.id); setSelectedConceptId(null); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                ${selectedModelId === model.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
              `}
            >
              <Box className="w-4 h-4" />
              <span className="truncate">{model.title}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        {selectedConcept && selectedModel ? (
          <ConceptDetailSpec concept={selectedConcept} model={selectedModel} onBack={() => setSelectedConceptId(null)} />
        ) : selectedModel ? (
          <ModelView model={selectedModel} onSelectConcept={setSelectedConceptId} />
        ) : (
          <ProjectDashboard project={project} onSelectModel={setSelectedModelId} />
        )}
      </main>
    </div>
  );
}

// --- Sub-components (Inline for now, can extract later) ---

function ProjectDashboard({ project, onSelectModel }: { project: ConceptProject, onSelectModel: (id: string) => void }) {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
        <p className="text-lg text-slate-600">{project.summary}</p>
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 text-sm text-indigo-600 hover:underline">
            <GitBranch className="w-4 h-4" />
            View Repository
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {project.models.map(model => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model.id)}
            className="text-left bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{model.title}</h3>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2">{model.description}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>{model.concepts.length} concepts</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ModelView({ model, onSelectConcept }: { model: ConceptModel, onSelectConcept: (id: string) => void }) {
  // Group concepts by category
  const grouped: Record<string, any[]> = {};
  model.concepts.forEach(c => {
    const cat = c.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  });

  const categories = Object.keys(grouped).sort();

  return (
    <div className="p-8 max-w-6xl mx-auto w-full overflow-y-auto h-full">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Box className="w-4 h-4" />
          <span>Model / Bounded Context</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{model.title}</h1>
        <p className="text-lg text-slate-600 max-w-3xl">{model.description}</p>
      </div>

      <div className="space-y-10">
        {categories.map(cat => (
          <div key={cat}>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              {getCategoryIcon(cat)}
              {cat.replace('_', ' ')}s
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[cat].map(concept => (
                <button
                  key={concept.id}
                  onClick={() => onSelectConcept(concept.id)}
                  className="text-left bg-white p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-700">{concept.label}</span>
                    {/* <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wide">{cat}</span> */}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{concept.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'thing': return <Database className="w-4 h-4" />;
    case 'activity': return <Zap className="w-4 h-4" />;
    case 'role': return <Code className="w-4 h-4" />; // User icon would be better
    case 'event': return <Activity className="w-4 h-4" />;
    default: return <Code className="w-4 h-4" />;
  }
}

export default App;
