import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import * as d3 from 'd3';
import { ArrowLeft } from 'lucide-react';

import type {
    ConceptModel,
    ModelView,
} from '../../../conceptual/src/types/model';
import { buildDiagramGraph } from '../utils/diagramLayout';
import { NodeDetailPanel } from './NodeDetailPanel';

interface Props {
    view: ModelView;
    model: ConceptModel;
    onBack: () => void;
    selectedConceptId?: string | null;
    onSelectConcept?: (id: string | null) => void;
    visibleConceptIds?: string[];
    visibleRelationshipIds?: string[];
    showHeader?: boolean;
}

interface Node extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    category?: string;
    description?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
    phrase?: string;
    source: Node;
    target: Node;
}

export function DiagramView({ view, model, onBack, selectedConceptId, onSelectConcept, visibleConceptIds, visibleRelationshipIds, showHeader = true }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    // Use internal state if no external state is provided (backward compatibility)
    const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null);

    const selectedNodeId = selectedConceptId !== undefined ? selectedConceptId : internalSelectedNodeId;

    const handleNodeSelect = (node: Node | null) => {
        if (onSelectConcept) {
            onSelectConcept(node ? node.id : null);
        } else {
            setInternalSelectedNodeId(node ? node.id : null);
        }
    };

    // Maintain a stable cache of Node objects to preserve D3's object constancy
    const nodeCache = useRef<Map<string, Node>>(new Map());

    const { nodes, links } = useMemo(() => {
        const { nodes: graphNodes, edges } = buildDiagramGraph(view, model);

        // Reuse existing Node objects or create new ones
        const d3Nodes: Node[] = graphNodes.map((n) => {
            let node = nodeCache.current.get(n.id);
            if (!node) {
                // Create new node only if it doesn't exist
                node = {
                    id: n.id,
                    x: 0,
                    y: 0,
                    label: n.data.label,
                    category: n.data.category,
                    description: n.data.description,
                };
                nodeCache.current.set(n.id, node);
            }
            return node;
        });

        // Filter nodes if visibleConceptIds is provided
        let filteredNodes = d3Nodes;
        if (visibleConceptIds) {
            const visibleSet = new Set(visibleConceptIds);
            filteredNodes = d3Nodes.filter(n => visibleSet.has(n.id));
        }

        const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));

        // Filter out edges where source or target nodes don't exist in filtered set
        let d3Links: Link[] = edges
            .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
            .map(e => ({
                source: nodeMap.get(e.source)!,
                target: nodeMap.get(e.target)!,
                phrase: e.data.phrase,
            }));

        // Further filter links if visibleRelationshipIds is provided
        if (visibleRelationshipIds) {
            const visibleRelSet = new Set(visibleRelationshipIds);
            // Build a map from source+target to relationship ID
            const relMap = new Map<string, string>();
            model.relationships.forEach(rel => {
                const key = `${rel.from}-${rel.to}`;
                relMap.set(key, rel.id);
            });

            d3Links = d3Links.filter(link => {
                const key = `${(link.source as any).id || link.source}-${(link.target as any).id || link.target}`;
                const relId = relMap.get(key);
                return relId && visibleRelSet.has(relId);
            });
        }

        return { nodes: filteredNodes, links: d3Links };
    }, [view, model, visibleConceptIds, visibleRelationshipIds]);

    const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const rect = svgRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Initialize or update simulation
        if (!simulationRef.current) {
            simulationRef.current = d3.forceSimulation<Node, Link>(nodes)
                .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(400).strength(0.7))
                .force('charge', d3.forceManyBody().strength(-1200))
                .force('center', d3.forceCenter(width / 2, height / 2).strength(0.2))
                .force('collision', d3.forceCollide().radius(65))
                .alphaDecay(0.02); // Slower cooling for smoother animations
        } else {
            // Update existing simulation with new nodes/links
            simulationRef.current.nodes(nodes);
            const linkForce = simulationRef.current.force<d3.ForceLink<Node, Link>>('link');
            if (linkForce) {
                linkForce.links(links);
            }
            // Gentle reheat - only warm up a bit for new nodes
            simulationRef.current.alpha(0.3).restart();
        }

        const simulation = simulationRef.current;

        // Position new nodes near the center or near connected nodes
        nodes.forEach((node) => {
            if (!node.x || !node.y || node.x === 0 || node.y === 0) {
                // Find connected nodes for this new node
                const connectedNodes = links
                    .filter(l => {
                        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                        return sourceId === node.id || targetId === node.id;
                    })
                    .map(l => {
                        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                        const source = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === sourceId);
                        const target = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === targetId);
                        return source?.id === node.id ? target : source;
                    })
                    .filter(n => n && n.x && n.y);

                if (connectedNodes.length > 0) {
                    // Start near connected nodes
                    const avgX = connectedNodes.reduce((sum, n) => sum + (n!.x || 0), 0) / connectedNodes.length;
                    const avgY = connectedNodes.reduce((sum, n) => sum + (n!.y || 0), 0) / connectedNodes.length;
                    node.x = avgX + (Math.random() - 0.5) * 100;
                    node.y = avgY + (Math.random() - 0.5) * 100;
                } else {
                    // Start at center with slight randomness
                    node.x = width / 2 + (Math.random() - 0.5) * 200;
                    node.y = height / 2 + (Math.random() - 0.5) * 200;
                }
            }
        });

        // Define arrow marker (only once)
        const defs = svg.selectAll('defs').data([null]);
        const defsEnter = defs.enter().append('defs');
        defsEnter.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 47)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#64748b');

        // Update links using join pattern
        const linkGroup = svg.selectAll<SVGGElement, unknown>('g.links').data([null]);
        const linkGroupEnter = linkGroup.enter().append('g').attr('class', 'links');
        const linkGroupMerged = linkGroupEnter.merge(linkGroup);

        const link = linkGroupMerged
            .selectAll<SVGLineElement, Link>('line')
            .data(links, (d: Link) => `${(d.source as any).id || d.source}-${(d.target as any).id || d.target}`)
            .join(
                enter => enter.append('line')
                    .attr('stroke', '#64748b')
                    .attr('stroke-width', 2)
                    .attr('marker-end', 'url(#arrowhead)')
                    .attr('opacity', 0)
                    .call(enter => enter.transition().duration(500).attr('opacity', 1)),
                update => update,
                exit => exit.transition().duration(300).attr('opacity', 0).remove()
            );

        // Update link labels using join pattern
        const linkLabelGroup = svg.selectAll<SVGGElement, unknown>('g.link-labels').data([null]);
        const linkLabelGroupEnter = linkLabelGroup.enter().append('g').attr('class', 'link-labels');
        const linkLabelGroupMerged = linkLabelGroupEnter.merge(linkLabelGroup);

        const linkLabels = linkLabelGroupMerged
            .selectAll<SVGTextElement, Link>('text')
            .data(links, (d: Link) => `${(d.source as any).id || d.source}-${(d.target as any).id || d.target}`)
            .join(
                enter => enter.append('text')
                    .text(d => d.phrase || '')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('font-size', '12px')
                    .attr('fill', '#475569')
                    .attr('font-weight', '500')
                    .attr('pointer-events', 'none')
                    .style('user-select', 'none')
                    .style('text-shadow', '0 0 2px rgba(255,255,255,0.8)')
                    .attr('opacity', 0)
                    .call(enter => enter.transition().duration(500).attr('opacity', 1)),
                update => update,
                exit => exit.transition().duration(300).attr('opacity', 0).remove()
            );

        // Update nodes using join pattern
        const nodeGroup = svg.selectAll<SVGGElement, unknown>('g.nodes').data([null]);
        const nodeGroupEnter = nodeGroup.enter().append('g').attr('class', 'nodes');
        const nodeGroupMerged = nodeGroupEnter.merge(nodeGroup);

        const node = nodeGroupMerged
            .selectAll<SVGCircleElement, Node>('circle')
            .data(nodes, (d: Node) => d.id)
            .join(
                enter => enter.append('circle')
                    .attr('r', 45)
                    .attr('fill', d => getCategoryColor(d.category))
                    .attr('stroke', d => selectedNodeId === d.id ? '#3b82f6' : '#fff')
                    .attr('stroke-width', d => selectedNodeId === d.id ? 4 : 2)
                    .attr('opacity', 0)
                    .attr('transform', 'scale(0.3)')
                    .call(enter => enter.transition().duration(500)
                        .attr('opacity', 1)
                        .attr('transform', 'scale(1)'))
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
                        handleNodeSelect(d);
                    }),
                update => update
                    .attr('stroke', d => selectedNodeId === d.id ? '#3b82f6' : '#fff')
                    .attr('stroke-width', d => selectedNodeId === d.id ? 4 : 2),
                exit => exit.transition().duration(300)
                    .attr('opacity', 0)
                    .attr('transform', 'scale(0.3)')
                    .remove()
            );

        // Update labels using join pattern
        const labelGroup = svg.selectAll<SVGGElement, unknown>('g.labels').data([null]);
        const labelGroupEnter = labelGroup.enter().append('g').attr('class', 'labels');
        const labelGroupMerged = labelGroupEnter.merge(labelGroup);

        const labels = labelGroupMerged
            .selectAll<SVGTextElement, Node>('text')
            .data(nodes, (d: Node) => d.id)
            .join(
                enter => enter.append('text')
                    .text(d => d.label)
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('font-size', '14px')
                    .attr('fill', '#333')
                    .attr('font-weight', '500')
                    .attr('pointer-events', 'none')
                    .attr('opacity', 0)
                    .call(enter => enter.transition().duration(500).attr('opacity', 1)),
                update => update,
                exit => exit.transition().duration(300).attr('opacity', 0).remove()
            );

        // Update positions on simulation tick
        simulation.on('tick', () => {
            // Clamp node positions to container bounds
            const padding = 60;
            nodes.forEach(d => {
                d.x = Math.max(padding, Math.min(width - padding, d.x!));
                d.y = Math.max(padding, Math.min(height - padding, d.y!));
            });

            link
                .attr('x1', d => (d.source as Node).x!)
                .attr('y1', d => (d.source as Node).y!)
                .attr('x2', d => (d.target as Node).x!)
                .attr('y2', d => (d.target as Node).y!);

            node
                .attr('cx', d => d.x!)
                .attr('cy', d => d.y!);

            labels
                .attr('x', d => d.x!)
                .attr('y', d => d.y!);

            linkLabels
                .attr('x', d => ((d.source as Node).x! + (d.target as Node).x!) / 2)
                .attr('y', d => ((d.source as Node).y! + (d.target as Node).y!) / 2);
        });

        return () => {
            // Don't stop simulation on cleanup - keep it running for smooth updates
            // simulation.stop();
        };
    }, [nodes, links, selectedNodeId]);

    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

    return (
        <div className="h-full flex bg-white">
            {/* Main Content */}
            <div className={`flex flex-col ${selectedNode ? 'flex-1' : 'w-full'}`}>
                {/* Header */}
                {showHeader && (
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
                                {nodes.length} concepts • {links.length} relationships
                            </div>
                        </div>
                    </div>
                )}

                {/* Diagram */}
                <div
                    className="flex-1 bg-slate-50"
                    onClick={() => handleNodeSelect(null)}
                >
                    <svg ref={svgRef} className="w-full h-full border border-slate-200"></svg>
                </div>
            </div>

            {/* Detail Panel */}
            {selectedNode && (
                <NodeDetailPanel
                    selectedNode={selectedNode}
                    nodes={nodes}
                    links={links}
                    model={model}
                    view={view}
                    onClose={() => handleNodeSelect(null)}
                />
            )}
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
