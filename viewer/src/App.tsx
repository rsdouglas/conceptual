import {
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  BookOpen,
  Box,
  ChevronRight,
  Code,
  Database,
  GitBranch,
  Layers,
  LayoutGrid,
  Network,
  Zap,
} from 'lucide-react';

import type {
  Concept,
  ConceptModel,
  ConceptProject,
  ProjectEntry,
  ProjectRegistry,
  StoryView,
} from '../../conceptual/src/types/model';
import { ConceptDetailSpec } from './components/ConceptDetailSpec';
import { DiagramView } from './components/DiagramView';

// Hard-coded demo project that always appears in the list
const DEMO_PROJECT: ProjectEntry = {
  id: "demo",
  name: "Demo: Data Request SlackBot",
  path: "models/demo.json",
  updatedAt: "2025-11-27T11:45:09.057Z"
};

function App() {
  const [registry, setRegistry] = useState<ProjectRegistry | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<ConceptProject | null>(null);

  // Navigation State
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [selectedStoryViewId, setSelectedStoryViewId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load registry
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}models/registry.json`)
      .then(res => res.json())
      .then((data: ProjectRegistry) => {
        // Always prepend the demo project to the registry
        const registryWithDemo: ProjectRegistry = {
          projects: [DEMO_PROJECT, ...data.projects]
        };
        setRegistry(registryWithDemo);
        setCurrentProjectId(DEMO_PROJECT.id);
      })
      .catch(err => {
        console.error(err);
        // If registry fails to load, just show the demo project
        const demoOnlyRegistry: ProjectRegistry = {
          projects: [DEMO_PROJECT]
        };
        setRegistry(demoOnlyRegistry);
        setCurrentProjectId(DEMO_PROJECT.id);
      });
  }, []);

  // Load project
  useEffect(() => {
    if (!currentProjectId || !registry) return;
    const entry = registry.projects.find(p => p.id === currentProjectId);
    if (!entry) return;

    fetch(`${import.meta.env.BASE_URL}${entry.path}`)
      .then(res => res.json())
      .then((data: ConceptProject) => {
        setProject(data);
        setLoading(false);
        // Reset selection on project change
        setSelectedModelId(null);
        setSelectedConceptId(null);
        setSelectedViewId(null);
        setSelectedStoryViewId(null);
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
  const selectedView = selectedModel?.views?.find(v => v.id === selectedViewId);
  const selectedStoryView = selectedModel?.storyViews?.find(s => s.id === selectedStoryViewId);

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
            <div key={model.id}>
              <button
                onClick={() => {
                  setSelectedModelId(model.id);
                  setSelectedConceptId(null);
                  setSelectedViewId(null);
                  setSelectedStoryViewId(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                  ${selectedModelId === model.id && !selectedViewId && !selectedStoryViewId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                <Box className="w-4 h-4" />
                <span className="truncate">{model.title}</span>
              </button>

              {/* Model Views section */}
              {selectedModelId === model.id && model.views && model.views.length > 0 && (
                <div className="ml-4 mt-1">
                  <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Model Views
                  </div>
                  <div className="space-y-0.5 pb-2">
                    {model.views.map(view => (
                      <button
                        key={view.id}
                        onClick={() => {
                          setSelectedViewId(view.id);
                          setSelectedConceptId(null);
                          setSelectedStoryViewId(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2
                          ${selectedViewId === view.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                        `}
                      >
                        <Network className="w-3.5 h-3.5" />
                        <span className="truncate">{view.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Views section */}
              {selectedModelId === model.id && model.storyViews && model.storyViews.length > 0 && (
                <div className="ml-4 mt-1">
                  <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Story Views
                  </div>
                  <div className="space-y-0.5 pb-2">
                    {model.storyViews.map(storyView => (
                      <button
                        key={storyView.id}
                        onClick={() => {
                          setSelectedStoryViewId(storyView.id);
                          setSelectedConceptId(null);
                          setSelectedViewId(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2
                          ${selectedStoryViewId === storyView.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                        `}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="truncate">{storyView.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-y-auto">
        {selectedConcept && selectedModel ? (
          <ConceptDetailSpec concept={selectedConcept} model={selectedModel} onBack={() => setSelectedConceptId(null)} />
        ) : selectedStoryView && selectedModel ? (
          <StoryViewComponent storyView={selectedStoryView} model={selectedModel} onBack={() => setSelectedStoryViewId(null)} />
        ) : selectedView && selectedModel ? (
          <DiagramView view={selectedView} model={selectedModel} onBack={() => setSelectedViewId(null)} />
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
  const grouped: Record<string, Concept[]> = {};
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

function StoryViewComponent({ storyView, model, onBack }: { storyView: StoryView, model: ConceptModel, onBack: () => void }) {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full min-h-full">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Model
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <BookOpen className="w-4 h-4" />
          <span>Story View</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">{storyView.name}</h1>
        <p className="text-slate-600 mb-4">{storyView.description}</p>

        {storyView.tags && storyView.tags.length > 0 && (
          <div className="flex gap-2 mb-8">
            {storyView.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        <div className="space-y-8">
          {storyView.steps.map((step) => (
            <div key={step.id} className="relative flex gap-6">
              {/* Timeline dot */}
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm z-10">
                {step.index + 1}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-700 leading-relaxed mb-4">{step.narrative}</p>

                {/* Concepts */}
                <div className="flex flex-wrap gap-2">
                  {step.conceptIds.map(conceptId => {
                    const concept = model.concepts.find(c => c.id === conceptId);
                    return concept ? (
                      <span key={conceptId} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">
                        {concept.label}
                      </span>
                    ) : null;
                  })}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
