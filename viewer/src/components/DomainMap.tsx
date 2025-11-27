
import type { ConceptSheet } from '../../../conceptual/src/types/model';
import { Box, Zap, Database, Activity, Code, Layers } from 'lucide-react';

interface Props {
    concepts: ConceptSheet[];
    onSelect: (name: string) => void;
}

export function DomainMap({ concepts, onSelect }: Props) {
    // Group by criticality
    const grouped = {
        core: concepts.filter(c => c.metadata.criticality === 'core'),
        supporting: concepts.filter(c => c.metadata.criticality === 'supporting'),
        experimental: concepts.filter(c => c.metadata.criticality === 'experimental'),
        // Fallback for older models without criticality
        undefined: concepts.filter(c => !c.metadata.criticality),
    };

    // Merge undefined into supporting for now, or keep separate?
    // Let's put them in supporting if they exist
    if (grouped.undefined.length > 0) {
        grouped.supporting = [...grouped.supporting, ...grouped.undefined];
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Domain Map</h2>

            {/* Core Concepts */}
            {grouped.core.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-px flex-1 bg-indigo-200"></div>
                        <span className="text-indigo-600 font-bold tracking-wider text-sm uppercase px-2">Core Concepts</span>
                        <div className="h-px flex-1 bg-indigo-200"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {grouped.core.map(c => <ConceptCard key={c.metadata.name} concept={c} onSelect={onSelect} variant="core" />)}
                    </div>
                </div>
            )}

            {/* Supporting Concepts */}
            {grouped.supporting.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <span className="text-slate-500 font-bold tracking-wider text-sm uppercase px-2">Supporting Concepts</span>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {grouped.supporting.map(c => <ConceptCard key={c.metadata.name} concept={c} onSelect={onSelect} variant="supporting" />)}
                    </div>
                </div>
            )}

            {/* Experimental Concepts */}
            {grouped.experimental.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-px flex-1 bg-amber-200"></div>
                        <span className="text-amber-600 font-bold tracking-wider text-sm uppercase px-2">Experimental</span>
                        <div className="h-px flex-1 bg-amber-200"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {grouped.experimental.map(c => <ConceptCard key={c.metadata.name} concept={c} onSelect={onSelect} variant="experimental" />)}
                    </div>
                </div>
            )}
        </div>
    );
}

function ConceptCard({ concept, onSelect, variant }: { concept: ConceptSheet, onSelect: (name: string) => void, variant: 'core' | 'supporting' | 'experimental' }) {
    const isCore = variant === 'core';

    const typeIcon = {
        entity: <Database className="w-4 h-4" />,
        value_object: <Box className="w-4 h-4" />,
        aggregate_root: <Layers className="w-4 h-4" />,
        domain_service: <Zap className="w-4 h-4" />,
        application_service: <Activity className="w-4 h-4" />,
        event: <Activity className="w-4 h-4" />,
        other: <Code className="w-4 h-4" />,
    }[concept.metadata.type as string] || <Code className="w-4 h-4" />;

    const typeColor = {
        entity: 'text-blue-600 bg-blue-50 border-blue-100',
        value_object: 'text-slate-600 bg-slate-50 border-slate-100',
        aggregate_root: 'text-purple-600 bg-purple-50 border-purple-100',
        domain_service: 'text-amber-600 bg-amber-50 border-amber-100',
        application_service: 'text-cyan-600 bg-cyan-50 border-cyan-100',
        event: 'text-rose-600 bg-rose-50 border-rose-100',
        other: 'text-slate-600 bg-slate-50 border-slate-100',
    }[concept.metadata.type as string] || 'text-slate-600 bg-slate-50 border-slate-100';

    return (
        <button
            onClick={() => onSelect(concept.metadata.name)}
            className={`
        text-left group relative p-5 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md
        ${isCore
                    ? 'bg-white border-indigo-100 shadow-sm hover:border-indigo-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'}
      `}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${typeColor}`}>
                    {typeIcon}
                    <span className="capitalize">{concept.metadata.type.replace('_', ' ')}</span>
                </div>
                {concept.metadata.aggregateRoot && (
                    <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                        Root
                    </span>
                )}
            </div>

            <h3 className={`font-bold mb-2 ${isCore ? 'text-lg text-slate-900' : 'text-base text-slate-800'}`}>
                {concept.metadata.name}
            </h3>

            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                {concept.definition.shortDescription}
            </p>

            {/* Mini metrics */}
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                {concept.structure.fields.length > 0 && <span>{concept.structure.fields.length} fields</span>}
                {concept.structure.relationships.length > 0 && <span>{concept.structure.relationships.length} rels</span>}
            </div>
        </button>
    );
}
