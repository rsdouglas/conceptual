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
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

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
import { EverythingView } from './components/EverythingView';
import { ResizableSidebar } from './components/ResizableSidebar';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load registry
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}models/registry.json`)
      .then(res => res.json())
      .then((data: ProjectRegistry) => {
        const registryWithDemo: ProjectRegistry = {
          projects: [DEMO_PROJECT, ...data.projects]
        };
        setRegistry(registryWithDemo);
        // Default to demo if no project selected
        if (!currentProjectId) {
          setCurrentProjectId(DEMO_PROJECT.id);
        }
      })
      .catch(err => {
        console.error(err);
        const demoOnlyRegistry: ProjectRegistry = {
          projects: [DEMO_PROJECT]
        };
        setRegistry(demoOnlyRegistry);
        if (!currentProjectId) {
          setCurrentProjectId(DEMO_PROJECT.id);
        }
      });
  }, []);

  // Load project
  useEffect(() => {
    if (!currentProjectId || !registry) return;
    const entry = registry.projects.find(p => p.id === currentProjectId);
    if (!entry) return;

    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}${entry.path}`)
      .then(res => res.json())
      .then((data: ConceptProject) => {
        setProject(data);
        setLoading(false);
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar
        project={project}
        registry={registry}
        currentProjectId={currentProjectId}
        setCurrentProjectId={setCurrentProjectId}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-y-auto relative">
        <Routes>
          <Route path="/" element={<ProjectDashboard project={project} />} />
          <Route path="/everything" element={<EverythingView project={project} onBack={() => navigate('/')} />} />
          <Route path="/model/:modelId" element={<ModelRoute project={project} />} />
          <Route path="/model/:modelId/view/:viewId" element={<DiagramRoute project={project} />} />
          <Route path="/model/:modelId/story/:storyId" element={<StoryRoute project={project} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// --- Route Components ---

function ModelRoute({ project }: { project: ConceptProject }) {
  const { modelId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const model = project.models.find(m => m.id === modelId);
  const conceptId = searchParams.get('concept');

  if (!model) return <Navigate to="/" replace />;

  const selectedConcept = conceptId ? model.concepts.find(c => c.id === conceptId) : null;

  if (selectedConcept) {
    return (
      <ConceptDetailSpec
        concept={selectedConcept}
        model={model}
        onBack={() => setSearchParams({})}
      />
    );
  }

  return (
    <ModelView
      model={model}
      onSelectConcept={(id) => setSearchParams({ concept: id })}
    />
  );
}

function DiagramRoute({ project }: { project: ConceptProject }) {
  const { modelId, viewId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const model = project.models.find(m => m.id === modelId);
  const view = model?.views?.find(v => v.id === viewId);
  const conceptId = searchParams.get('concept');

  if (!model || !view) return <Navigate to={`/model/${modelId}`} replace />;

  // We need to adapt DiagramView to handle URL-based selection if we want deep linking to nodes
  // For now, let's just render it. The DiagramView manages its own selection state currently.
  // Ideally, we'd lift that state up to the URL.

  return (
    <DiagramView
      view={view}
      model={model}
      onBack={() => navigate(`/model/${modelId}`)}
      selectedConceptId={conceptId}
      onSelectConcept={(id) => setSearchParams(id ? { concept: id } : {})}
    />
  );
}

function StoryRoute({ project }: { project: ConceptProject }) {
  const { modelId, storyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const model = project.models.find(m => m.id === modelId);
  const storyView = model?.storyViews?.find(s => s.id === storyId);
  const conceptId = searchParams.get('concept');

  if (!model || !storyView) return <Navigate to={`/model/${modelId}`} replace />;

  const selectedConcept = conceptId ? model.concepts.find(c => c.id === conceptId) : null;

  return (
    <div className="h-full relative flex">
      <div className={`flex-1 overflow-y-auto ${selectedConcept ? 'hidden md:block' : ''}`}>
        <StoryViewComponent
          storyView={storyView}
          model={model}
          onBack={() => navigate(`/model/${modelId}`)}
          onSelectConcept={(id) => setSearchParams({ concept: id })}
        />
      </div>

      {selectedConcept && (
        <ResizableSidebar className="absolute inset-0 z-20 md:relative md:z-auto md:h-full">
          {/* We reuse ConceptDetailSpec but maybe wrapped in a sidebar container */}
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center md:hidden">
              <button onClick={() => setSearchParams({})} className="text-slate-500">Close</button>
            </div>
            <ConceptDetailSpec
              concept={selectedConcept}
              model={model}
              onBack={() => setSearchParams({})}
            />
          </div>
        </ResizableSidebar>
      )}
    </div>
  );
}

// --- Sidebar Component ---

function Sidebar({ project, registry, currentProjectId, setCurrentProjectId }: any) {
  const navigate = useNavigate();

  // We need to get params from the current route, but Sidebar is outside Routes.
  // We can use useMatch or just parse location.pathname
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const currentModelId = pathParts[1] === 'model' ? pathParts[2] : null;
  const currentViewType = pathParts[3]; // 'view' or 'story'
  const currentViewId = pathParts[4];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold">
          <Layers className="w-5 h-5" />
          <span>Concept Explorer</span>
        </div>
        <div className="relative">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Project</label>
          <select
            value={currentProjectId || ''}
            onChange={e => setCurrentProjectId(e.target.value)}
            className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {registry?.projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Models (Contexts)
        </div>
        <button
          onClick={() => navigate('/')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
            ${location.pathname === '/' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
          `}
        >
          <LayoutGrid className="w-4 h-4" />
          Project Overview
        </button>
        <button
          onClick={() => navigate('/everything')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
            ${location.pathname === '/everything' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
          `}
        >
          <Network className="w-4 h-4" />
          Everything
        </button>

        {project?.models.map((model: any) => (
          <div key={model.id}>
            <button
              onClick={() => navigate(`/model/${model.id}`)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                ${currentModelId === model.id && !currentViewId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
              `}
            >
              <Box className="w-4 h-4" />
              <span className="truncate">{model.title}</span>
            </button>

            {currentModelId === model.id && model.views && model.views.length > 0 && (
              <div className="ml-4 mt-1">
                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Model Views
                </div>
                <div className="space-y-0.5 pb-2">
                  {model.views.map((view: any) => (
                    <button
                      key={view.id}
                      onClick={() => navigate(`/model/${model.id}/view/${view.id}`)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2
                        ${currentViewType === 'view' && currentViewId === view.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                      `}
                    >
                      <Network className="w-3.5 h-3.5" />
                      <span className="truncate">{view.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentModelId === model.id && model.storyViews && model.storyViews.length > 0 && (
              <div className="ml-4 mt-1">
                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Story Views
                </div>
                <div className="space-y-0.5 pb-2">
                  {model.storyViews.map((storyView: any) => (
                    <button
                      key={storyView.id}
                      onClick={() => navigate(`/model/${model.id}/story/${storyView.id}`)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2
                        ${currentViewType === 'story' && currentViewId === storyView.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
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
  );
}

// --- Existing Components (ProjectDashboard, ModelView, StoryViewComponent) ---
// Kept mostly as is, but updated to use navigate where appropriate

function ProjectDashboard({ project }: { project: ConceptProject }) {
  const navigate = useNavigate();
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
            onClick={() => navigate(`/model/${model.id}`)}
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

function StoryViewComponent({ storyView, model, onBack, onSelectConcept }: {
  storyView: StoryView,
  model: ConceptModel,
  onBack: () => void,
  onSelectConcept: (id: string) => void
}) {
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
                      <button
                        key={conceptId}
                        onClick={() => onSelectConcept(conceptId)}
                        className="px-2 py-1 text-xs rounded-md transition-all hover:shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
                      >
                        {concept.label}
                      </button>
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
