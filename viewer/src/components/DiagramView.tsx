import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ModelView, ConceptModel } from '../../../conceptual/src/types/model';
import { buildDiagramGraph } from '../utils/diagramLayout';
import { ConceptNode } from './ConceptNode';
import { GroupNode } from './GroupNode';
import '@xyflow/react/dist/style.css';

interface Props {
    view: ModelView;
    model: ConceptModel;
    onBack: () => void;
}

const nodeTypes = {
    concept: ConceptNode,
    group: GroupNode,
};

export function DiagramView({ view, model, onBack }: Props) {
    const { nodes, edges } = useMemo(() =>
        buildDiagramGraph(view, model),
        [view, model]
    );

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 mb-3 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Model
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span>{model.title}</span>
                            <span>•</span>
                            <span>View</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{view.name}</h2>
                        {view.description && (
                            <p className="text-slate-600 mt-1 max-w-2xl">{view.description}</p>
                        )}
                    </div>
                    <div className="text-sm text-slate-500">
                        {nodes.length} concepts • {edges.length} relationships
                    </div>
                </div>
            </div>

            {/* Diagram */}
            <div className="flex-1 bg-slate-50">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    className="bg-slate-50"
                    minZoom={0.1}
                    maxZoom={2}
                >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls className="!shadow-lg !border-slate-200" />
                    <MiniMap
                        className="!bg-white !border-slate-200"
                        nodeColor={(node) => {
                            const category = node.data.category || 'other';
                            switch (category) {
                                case 'thing': return '#dbeafe';
                                case 'activity': return '#dcfce7';
                                case 'role': return '#f3e8ff';
                                case 'state': return '#fef3c7';
                                case 'event': return '#ffedd5';
                                case 'place': return '#fce7f3';
                                case 'time': return '#cffafe';
                                default: return '#f1f5f9';
                            }
                        }}
                    />
                </ReactFlow>
            </div>
        </div>
    );
}
