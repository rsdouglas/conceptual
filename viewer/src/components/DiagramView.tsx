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

export function DiagramView({ view, model, onBack }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const { nodes, links } = useMemo(() => {
        const { nodes: graphNodes, edges } = buildDiagramGraph(view, model);

        // Convert to d3-force format (positions will be set in useEffect)
        const d3Nodes: Node[] = graphNodes.map((n) => ({
            id: n.id,
            x: 0,
            y: 0,
            label: n.data.label,
            category: n.data.category,
            description: n.data.description,
        }));

        const nodeMap = new Map(d3Nodes.map(n => [n.id, n]));

        // Filter out edges where source or target nodes don't exist
        const d3Links: Link[] = edges
            .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
            .map(e => ({
                source: nodeMap.get(e.source)!,
                target: nodeMap.get(e.target)!,
                phrase: e.data.phrase,
            }));

        return { nodes: d3Nodes, links: d3Links };
    }, [view, model]);

    useEffect(() => {
        if (!svgRef.current || !nodes.length) return;

        // Additional safety check - ensure all links have valid source/target
        const invalidLinks = links.filter(link =>
            !link.source || !link.target ||
            typeof link.source !== 'object' ||
            typeof link.target !== 'object'
        );
        if (invalidLinks.length > 0) {
            console.warn('Found invalid links, filtering them out:', invalidLinks);
            // Filter out invalid links in place
            links.splice(0, links.length, ...links.filter(link =>
                link.source && link.target &&
                typeof link.source === 'object' &&
                typeof link.target === 'object'
            ));
        }

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
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 13)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#94a3b8');

        // Create force simulation (only if we have valid nodes)
        if (!nodes.length) return;

        let simulation: d3.Simulation<Node, Link>;
        try {
            simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links).id(d => (d as Node).id).distance(350))
                .force('charge', d3.forceManyBody().strength(-800))
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
            .attr('marker-end', 'url(#arrowhead)');

        // Create link labels
        const linkLabels = svg.append('g')
            .selectAll('text')
            .data(links)
            .enter().append('text')
            .text(d => d.phrase || '')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('font-size', '12px')
            .attr('fill', '#475569')
            .attr('font-weight', '500')
            .attr('pointer-events', 'none')
            .style('user-select', 'none')
            .style('text-shadow', '0 0 2px rgba(255,255,255,0.8)');

        // Create nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', 45)
            .attr('fill', d => getCategoryColor(d.category))
            .attr('stroke', d => selectedNode?.id === d.id ? '#3b82f6' : '#fff')
            .attr('stroke-width', d => selectedNode?.id === d.id ? 4 : 2)
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
                setSelectedNode(d);
            });

        // Add labels
        const labels = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .text(d => d.label)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('font-size', '14px')
            .attr('fill', '#333')
            .attr('font-weight', '500');

        // Update positions on simulation tick
        simulation.on('tick', () => {
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
    }, [nodes, links, selectedNode]);

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

                {/* Diagram */}
                <div
                    className="flex-1 bg-slate-50"
                    onClick={() => setSelectedNode(null)}
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
                    onClose={() => setSelectedNode(null)}
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
