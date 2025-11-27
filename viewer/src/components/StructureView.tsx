import { useState } from 'react';
import type { ConceptSheet } from '../../../conceptual/src/types/model';
import { ChevronDown, ChevronRight, Box, Zap, Database, Activity, Code, Layers, BarChart3 } from 'lucide-react';

interface Props {
    concepts: ConceptSheet[];
    onSelect: (name: string) => void;
}

export function StructureView({ concepts, onSelect }: Props) {
    const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());

    // Group by Bounded Context
    const contextGroups: Record<string, ConceptSheet[]> = {};
    concepts.forEach(c => {
        const ctx = c.metadata.boundedContext || 'Shared Kernel';
        if (!contextGroups[ctx]) contextGroups[ctx] = [];
        contextGroups[ctx].push(c);
    });

    // Stats
    const coreCount = concepts.filter(c => c.metadata.criticality === 'core').length;
    const supportingCount = concepts.filter(c => c.metadata.criticality === 'supporting').length;
    const experimentalCount = concepts.filter(c => c.metadata.criticality === 'experimental').length;
    const totalCount = concepts.length;
    const contextCount = Object.keys(contextGroups).length;

    const toggleContext = (ctx: string) => {
        const newSet = new Set(expandedContexts);
        if (newSet.has(ctx)) {
            newSet.delete(ctx);
        } else {
            newSet.add(ctx);
        }
        setExpandedContexts(newSet);
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            {/* Simple Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Bounded Contexts</h2>
                <p className="text-slate-500 text-sm mt-1">{contextCount} context{contextCount !== 1 ? 's' : ''} • {totalCount} concept{totalCount !== 1 ? 's' : ''}</p>
            </div>

            {/* Context Accordion */}
            <div className="space-y-4">
                {Object.entries(contextGroups)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([contextName, contextConcepts]) => {
                        const isExpanded = expandedContexts.has(contextName);
                        const coreInContext = contextConcepts.filter(c => c.metadata.criticality === 'core').length;

                        return (
                            <div key={contextName} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                {/* Context Header */}
                                <button
                                    onClick={() => toggleContext(contextName)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-slate-900">{contextName}</h3>
                                            <p className="text-sm text-slate-500">
                                                {contextConcepts.length} concept{contextConcepts.length !== 1 ? 's' : ''}
                                                {coreInContext > 0 && <span className="text-indigo-600 ml-2">• {coreInContext} core</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {isExpanded ? 'Collapse' : 'Expand'}
                                    </div>
                                </button>

                                {/* Context Concepts Grid */}
                                {isExpanded && (
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {contextConcepts.map(concept => (
                                                <ConceptCard key={concept.metadata.name} concept={concept} onSelect={onSelect} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

function ConceptCard({ concept, onSelect }: { concept: ConceptSheet; onSelect: (name: string) => void }) {
    const isCore = concept.metadata.criticality === 'core';
    const isExperimental = concept.metadata.criticality === 'experimental';

    const Icon = {
        entity: Database,
        value_object: Box,
        aggregate_root: Layers,
        domain_service: Zap,
        application_service: Activity,
        event: Activity,
        other: Code,
    }[concept.metadata.type as string] || Code;

    const bgColor = isCore ? 'bg-indigo-50 border-indigo-200' : isExperimental ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200';
    const textColor = isCore ? 'text-indigo-900' : isExperimental ? 'text-amber-900' : 'text-slate-900';

    return (
        <button
            onClick={() => onSelect(concept.metadata.name)}
            className={`text-left p-4 rounded-lg border transition-all hover:shadow-md hover:-translate-y-0.5 ${bgColor}`}
        >
            <div className="flex items-start gap-3 mb-2">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isCore ? 'bg-indigo-100' : isExperimental ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    <Icon className={`w-4 h-4 ${isCore ? 'text-indigo-600' : isExperimental ? 'text-amber-600' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${textColor} truncate`}>{concept.metadata.name}</h4>
                    <p className="text-xs text-slate-500 capitalize">{concept.metadata.type.replace('_', ' ')}</p>
                </div>
                {concept.metadata.aggregateRoot && (
                    <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 shrink-0">
                        Root
                    </span>
                )}
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 leading-snug">
                {concept.definition.shortDescription}
            </p>
        </button>
    );
}
