import type { ModelView, ConceptModel } from '../../../conceptual/src/types/model';

interface Node {
    id: string;
    label: string;
    category?: string;
    description?: string;
}

interface Link {
    source: Node;
    target: Node;
    phrase?: string;
}

interface NodeDetailPanelProps {
    selectedNode: Node | null;
    nodes: Node[];
    links: Link[];
    model: ConceptModel;
    view: ModelView;
    onClose: () => void;
}

export function NodeDetailPanel({ selectedNode, nodes, links, model, view: _view, onClose }: NodeDetailPanelProps) {
    if (!selectedNode) return null;

    // Get the full concept from the model
    const concept = model.concepts.find(c => c.id === selectedNode.id);

    // Get relationships
    const outgoingLinks = links.filter(link => link.source.id === selectedNode.id);
    const incomingLinks = links.filter(link => link.target.id === selectedNode.id);

    // Get connected concepts
    const connectedConceptIds = new Set([
        ...outgoingLinks.map(link => link.target.id),
        ...incomingLinks.map(link => link.source.id)
    ]);

    const connectedConcepts = nodes.filter(node => connectedConceptIds.has(node.id) && node.id !== selectedNode.id);

    return (
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Concept Details</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Concept Info */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getCategoryColor(selectedNode.category) }}
                        />
                        <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                            {selectedNode.category || 'unknown'}
                        </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{selectedNode.label}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        {selectedNode.description || 'No description available.'}
                    </p>
                    <div className="mt-2 text-xs text-slate-500 font-mono">
                        ID: {selectedNode.id}
                    </div>
                    {concept?.aliases && concept.aliases.length > 0 && (
                        <div className="mt-1 text-xs text-slate-500">
                            aka: {concept.aliases.join(', ')}
                        </div>
                    )}
                </div>

                {/* Outgoing Relationships */}
                {outgoingLinks.length > 0 && (
                    <div>
                        <h5 className="font-medium text-slate-900 mb-3">Outgoing Relationships</h5>
                        <div className="space-y-2">
                            {outgoingLinks.map((link, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-600">→</span>
                                    <span className="font-medium text-slate-900">"{link.phrase}"</span>
                                    <span className="text-slate-600">→</span>
                                    <span className="text-slate-800">{link.target.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Incoming Relationships */}
                {incomingLinks.length > 0 && (
                    <div>
                        <h5 className="font-medium text-slate-900 mb-3">Incoming Relationships</h5>
                        <div className="space-y-2">
                            {incomingLinks.map((link, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-800">{link.source.label}</span>
                                    <span className="text-slate-600">→</span>
                                    <span className="font-medium text-slate-900">"{link.phrase}"</span>
                                    <span className="text-slate-600">→</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Connected Concepts */}
                {connectedConcepts.length > 0 && (
                    <div>
                        <h5 className="font-medium text-slate-900 mb-3">Connected Concepts</h5>
                        <div className="space-y-1">
                            {connectedConcepts.map((node) => (
                                <div key={node.id} className="text-sm text-slate-700">
                                    • {node.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {concept?.notes && (
                    <div>
                        <h5 className="font-medium text-slate-900 mb-2">Notes</h5>
                        <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded">
                            {concept.notes}
                        </div>
                    </div>
                )}

                {/* Raw Data */}
                {concept && (
                    <details className="group">
                        <summary className="cursor-pointer font-medium text-slate-900 mb-2 group-hover:text-slate-700">
                            Raw Concept Data
                        </summary>
                        <pre className="text-xs bg-slate-100 p-3 rounded overflow-x-auto">
                            {JSON.stringify(concept, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}

function getCategoryColor(category?: string): string {
    switch (category) {
        case 'thing': return '#dbeafe'; // blue-100
        case 'activity': return '#dcfce7'; // green-100
        case 'role': return '#f3e8ff'; // purple-100
        case 'state': return '#fef3c7'; // yellow-100
        case 'event': return '#fed7aa'; // orange-100
        case 'place': return '#fce7f3'; // pink-100
        case 'time': return '#cffafe'; // cyan-100
        default: return '#f1f5f9'; // slate-100
    }
}
