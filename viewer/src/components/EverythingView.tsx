import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import * as d3 from 'd3';
import { ArrowLeft, Layers } from 'lucide-react';

import type {
    Concept,
    ConceptProject,
} from '../../../conceptual/src/types/model';

interface Props {
    project: ConceptProject;
    onBack: () => void;
}

interface Node extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    category?: string;
    description?: string;
    modelId: string;
    modelName: string;
    originalConcept: Concept;
}

interface Link extends d3.SimulationLinkDatum<Node> {
    phrase?: string;
    source: Node;
    target: Node;
}

interface ModelInfo {
    id: string;
    name: string;
    color: string;
}

// Generate distinct colors for different models
function generateModelColors(modelCount: number): string[] {
    const colors = [
        '#dbeafe', // blue-100
        '#dcfce7', // green-100
        '#f3e8ff', // purple-100
        '#fef3c7', // yellow-100
        '#fed7aa', // orange-100
        '#fce7f3', // pink-100
        '#cffafe', // cyan-100
        '#fef08a', // amber-100
        '#bfdbfe', // blue-200
        '#bbf7d0', // green-200
        '#e9d5ff', // purple-200
        '#fde68a', // yellow-200
        '#fecaca', // red-100
        '#d1fae5', // emerald-100
    ];

    // If we have more models than predefined colors, we'll cycle through
    return colors.slice(0, Math.min(modelCount, colors.length));
}

export function EverythingView({ project, onBack }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Aggregate all concepts and relationships across models
    const { nodes, links, modelInfos } = useMemo(() => {
        const modelColors = generateModelColors(project.models.length);
        const modelInfoMap = new Map<string, ModelInfo>();

        project.models.forEach((model, index) => {
            modelInfoMap.set(model.id, {
                id: model.id,
                name: model.title,
                color: modelColors[index % modelColors.length],
            });
        });

        const allNodes: Node[] = [];
        const nodeMap = new Map<string, Node>();

        // Collect all concepts from all models
        project.models.forEach((model) => {
            const modelInfo = modelInfoMap.get(model.id)!;

            model.concepts.forEach((concept) => {
                // Create unique ID by prefixing with model ID to avoid collisions
                const uniqueId = `${model.id}::${concept.id}`;

                const node: Node = {
                    id: uniqueId,
                    x: 0,
                    y: 0,
                    label: concept.label,
                    category: concept.category,
                    description: concept.description,
                    modelId: model.id,
                    modelName: modelInfo.name,
                    originalConcept: concept,
                };

                allNodes.push(node);
                nodeMap.set(uniqueId, node);
            });
        });

        // Collect all relationships
        const allLinks: Link[] = [];
        project.models.forEach((model) => {
            model.relationships.forEach((relationship) => {
                const sourceId = `${model.id}::${relationship.from}`;
                const targetId = `${model.id}::${relationship.to}`;

                const sourceNode = nodeMap.get(sourceId);
                const targetNode = nodeMap.get(targetId);

                if (sourceNode && targetNode) {
                    allLinks.push({
                        source: sourceNode,
                        target: targetNode,
                        phrase: relationship.phrase,
                    });
                }
            });
        });

        return {
            nodes: allNodes,
            links: allLinks,
            modelInfos: Array.from(modelInfoMap.values()),
        };
    }, [project]);

    useEffect(() => {
        if (!svgRef.current || !nodes.length) return;

        const svg = d3.select(svgRef.current);
        const rect = svgRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Set initial positions if not already set
        nodes.forEach((node) => {
            if (node.x === 0 && node.y === 0) {
                node.x = Math.random() * width;
                node.y = Math.random() * height;
            }
        });

        // Clear previous elements
        svg.selectAll('*').remove();

        // Define arrow marker
        const defs = svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead-everything')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 47)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#64748b');

        // Create force simulation
        let simulation: d3.Simulation<Node, Link>;
        try {
            simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links).id(d => (d as Node).id).distance(250))
                .force('charge', d3.forceManyBody().strength(-600))
                .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
                .force('collision', d3.forceCollide().radius(55));
        } catch (error) {
            console.error('Failed to initialize d3-force simulation:', error);
            return;
        }

        // Create links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.4)
            .attr('marker-end', 'url(#arrowhead-everything)');

        // Create link labels
        const linkLabels = svg.append('g')
            .selectAll('text')
            .data(links)
            .enter().append('text')
            .text(d => d.phrase || '')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('font-size', '10px')
            .attr('fill', '#64748b')
            .attr('font-weight', '500')
            .attr('pointer-events', 'none')
            .attr('opacity', 0.5)
            .style('user-select', 'none')
            .style('text-shadow', '0 0 2px rgba(255,255,255,0.8)');

        // Create nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', 45)
            .attr('fill', d => {
                const modelInfo = modelInfos.find(m => m.id === d.modelId);
                return modelInfo?.color || '#f1f5f9';
            })
            .attr('stroke', d => selectedNodeId === d.id ? '#3b82f6' : '#fff')
            .attr('stroke-width', d => selectedNodeId === d.id ? 4 : 2)
            .call(d3.drag<SVGCircleElement, Node>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                })
            )
            .on('click', (event, d) => {
                event.stopPropagation();
                setSelectedNodeId(d.id);
            });

        // Add labels
        const labels = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .text(d => d.label)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('font-size', '12px')
            .attr('fill', '#333')
            .attr('font-weight', '600')
            .attr('pointer-events', 'none')
            .style('user-select', 'none');

        // Update positions on simulation tick
        simulation.on('tick', () => {
            const padding = 60;
            nodes.forEach(d => {
                d.x = Math.max(padding, Math.min(width - padding, d.x!));
                d.y = Math.max(padding, Math.min(height - padding, d.y!));
            });

            link
                .attr('x1', d => d.source.x!)
                .attr('y1', d => d.source.y!)
                .attr('x2', d => d.target.x!)
                .attr('y2', d => d.target.y!);

            node
                .attr('cx', d => d.x!)
                .attr('cy', d => d.y!);

            labels
                .attr('x', d => d.x!)
                .attr('y', d => d.y!);

            linkLabels
                .attr('x', d => (d.source.x! + d.target.x!) / 2)
                .attr('y', d => (d.source.y! + d.target.y!) / 2);
        });

        return () => {
            simulation.stop();
        };
    }, [nodes, links, selectedNodeId, modelInfos]);

    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

    return (
        <div className="h-full flex bg-white">
            {/* Main Content */}
            <div className={`flex flex-col ${selectedNode ? 'flex-1' : 'w-full'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 mb-3 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Project
                    </button>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Layers className="w-6 h-6 text-indigo-600" />
                                <h2 className="text-2xl font-bold text-slate-900">Everything</h2>
                            </div>
                            <p className="text-slate-600 mt-1 max-w-2xl">
                                All concepts and relationships across all models in this project
                            </p>
                        </div>
                        <div className="text-sm text-slate-500">
                            {nodes.length} concepts • {links.length} relationships • {modelInfos.length} models
                        </div>
                    </div>

                    {/* Model Legend */}
                    <div className="mt-4 flex flex-wrap gap-3">
                        {modelInfos.map((modelInfo) => (
                            <div key={modelInfo.id} className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: modelInfo.color }}
                                />
                                <span className="text-xs font-medium text-slate-600">{modelInfo.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diagram */}
                <div
                    className="flex-1 bg-slate-50"
                    onClick={() => setSelectedNodeId(null)}
                >
                    <svg ref={svgRef} className="w-full h-full border border-slate-200"></svg>
                </div>
            </div>

            {/* Detail Panel */}
            {selectedNode && (
                <div className="w-96 border-l border-slate-200 bg-white overflow-y-auto shrink-0">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: modelInfos.find(m => m.id === selectedNode.modelId)?.color || '#f1f5f9'
                                    }}
                                />
                                <span className="text-xs font-medium text-slate-500">
                                    {selectedNode.modelName}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedNodeId(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedNode.label}</h3>

                        {selectedNode.category && (
                            <div className="mb-3">
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                                    {selectedNode.category}
                                </span>
                            </div>
                        )}

                        {selectedNode.description && (
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                {selectedNode.description}
                            </p>
                        )}

                        {selectedNode.originalConcept.aliases && selectedNode.originalConcept.aliases.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Aliases
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedNode.originalConcept.aliases.map((alias, idx) => (
                                        <span key={idx} className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded">
                                            {alias}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedNode.originalConcept.notes && (
                            <div className="mt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Notes
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {selectedNode.originalConcept.notes}
                                </p>
                            </div>
                        )}

                        {/* Show relationships */}
                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Relationships
                            </h4>
                            <div className="space-y-2">
                                {links.filter(l =>
                                    (l.source as Node).id === selectedNode.id ||
                                    (l.target as Node).id === selectedNode.id
                                ).map((link, idx) => {
                                    const isOutgoing = (link.source as Node).id === selectedNode.id;
                                    const otherNode = isOutgoing ? link.target as Node : link.source as Node;
                                    return (
                                        <div key={idx} className="text-xs">
                                            <span className="text-slate-500">
                                                {isOutgoing ? '→' : '←'} {link.phrase}
                                            </span>
                                            {' '}
                                            <button
                                                onClick={() => setSelectedNodeId(otherNode.id)}
                                                className="text-indigo-600 hover:underline font-medium"
                                            >
                                                {otherNode.label}
                                            </button>
                                            <span className="text-slate-400 ml-1">
                                                ({otherNode.modelName})
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
