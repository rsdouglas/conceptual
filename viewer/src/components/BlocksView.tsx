
import { useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, Position, Handle, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { ConceptSheet } from '../../../conceptual/src/types/model';
import { Box, Layers, Zap, Activity, Database, Code } from 'lucide-react';

interface Props {
    concepts: ConceptSheet[];
    onSelect: (name: string) => void;
}

// Custom Node Component for Bounded Context
const ContextNode = ({ data }: { data: { label: string; concepts: ConceptSheet[]; onSelect: (name: string) => void } }) => {
    return (
        <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm min-w-[250px] overflow-hidden">
            <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-3 !h-3" />

            {/* Header */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    {data.label}
                </h3>
            </div>

            {/* Concept List */}
            <div className="p-2 space-y-1">
                {data.concepts.map(c => {
                    const isCore = c.metadata.criticality === 'core';
                    const Icon = {
                        entity: Database,
                        value_object: Box,
                        aggregate_root: Layers,
                        domain_service: Zap,
                        application_service: Activity,
                        event: Activity,
                        other: Code
                    }[c.metadata.type as string] || Code;

                    return (
                        <button
                            key={c.metadata.name}
                            onClick={(e) => { e.stopPropagation(); data.onSelect(c.metadata.name); }}
                            className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors
                ${isCore ? 'bg-indigo-50/50 text-indigo-900 font-medium hover:bg-indigo-100' : 'text-slate-600 hover:bg-slate-50'}
              `}
                        >
                            <Icon className={`w-3 h-3 ${isCore ? 'text-indigo-500' : 'text-slate-400'}`} />
                            <span className="truncate">{c.metadata.name}</span>
                            {c.metadata.aggregateRoot && <span className="ml-auto text-[10px] text-purple-600 font-bold">ROOT</span>}
                        </button>
                    );
                })}
            </div>

            <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-3 !h-3" />
        </div>
    );
};

const nodeTypes = {
    context: ContextNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 280;
    const nodeHeight = 300; // Approximate, maybe dynamic?

    dagreGraph.setGraph({ rankdir: 'LR' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export function BlocksView({ concepts, onSelect }: Props) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        // 1. Group concepts by Bounded Context
        const contexts: Record<string, ConceptSheet[]> = {};
        const unassigned: ConceptSheet[] = [];

        concepts.forEach(c => {
            const ctx = c.metadata.boundedContext || 'Shared Kernel'; // Default context
            if (!contexts[ctx]) contexts[ctx] = [];
            contexts[ctx].push(c);
        });

        // 2. Create Nodes
        const nodes: Node[] = Object.keys(contexts).map(ctx => ({
            id: ctx,
            type: 'context',
            data: { label: ctx, concepts: contexts[ctx], onSelect },
            position: { x: 0, y: 0 }, // Layout will fix this
        }));

        // 3. Create Edges based on relationships
        // If Concept A (in Context X) relates to Concept B (in Context Y), draw edge X -> Y
        const edges: Edge[] = [];
        const edgeSet = new Set<string>();

        concepts.forEach(sourceConcept => {
            const sourceCtx = sourceConcept.metadata.boundedContext || 'Shared Kernel';

            // Check relationships
            // Note: This is tricky because relationships are text descriptions currently.
            // Ideally, we'd have structured references.
            // For now, let's look at `implementation` or try to infer from text?
            // Or maybe we just rely on the user to have better data in the future?

            // Let's try to match concept names in relationship descriptions?
            // "Produces Summary" -> find concept named "Summary"

            sourceConcept.structure.relationships.forEach(rel => {
                // Simple heuristic: check if any other concept name is in the description
                concepts.forEach(targetConcept => {
                    if (sourceConcept === targetConcept) return;
                    const targetCtx = targetConcept.metadata.boundedContext || 'Shared Kernel';

                    if (sourceCtx === targetCtx) return; // Ignore internal edges for now

                    if (rel.description.includes(targetConcept.metadata.name)) {
                        const edgeId = `${sourceCtx}-${targetCtx}`;
                        if (!edgeSet.has(edgeId)) {
                            edges.push({
                                id: edgeId,
                                source: sourceCtx,
                                target: targetCtx,
                                type: 'smoothstep',
                                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                                style: { stroke: '#94a3b8', strokeWidth: 2 },
                                animated: true,
                            });
                            edgeSet.add(edgeId);
                        }
                    }
                });
            });
        });

        return getLayoutedElements(nodes, edges);
    }, [concepts, onSelect]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="flex-1 w-full bg-slate-50 relative">
            <div className="absolute inset-0">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}
