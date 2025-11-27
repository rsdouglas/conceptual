import type { Concept, ConceptModel } from '../../../conceptual/src/types/model';
import { ArrowLeft, GitCommit, ShieldAlert, Repeat, Tag, ExternalLink } from 'lucide-react';

interface Props {
    concept: Concept;
    model: ConceptModel; // Needed to look up relationships, rules, lifecycles
    onBack: () => void;
}

export function ConceptDetailSpec({ concept, model, onBack }: Props) {
    // 1. Find Relationships
    const relationships = model.relationships.filter(r => r.from === concept.id || r.to === concept.id);

    // 2. Find Rules
    const rules = model.rules?.filter(r => r.conceptIds?.includes(concept.id)) || [];

    // 3. Find Lifecycles
    const lifecycle = model.lifecycles?.find(l => l.subjectConceptId === concept.id);

    // Helper to resolve concept name from ID
    const getConceptLabel = (id: string) => {
        const c = model.concepts.find(c => c.id === id);
        return c ? c.label : id;
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-slate-200 px-8 py-6 bg-slate-50/50">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Model
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">{concept.label}</h1>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 uppercase tracking-wide">
                                {concept.category?.replace('_', ' ') || 'Concept'}
                            </span>
                        </div>
                        <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                            {concept.description}
                        </p>

                        {/* Aliases */}
                        {concept.aliases && concept.aliases.length > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                                <Tag className="w-4 h-4" />
                                <span className="italic">Also known as: {concept.aliases.join(', ')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">

                    {/* Relationships Section */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <GitCommit className="w-4 h-4" /> Relationships
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {relationships.map((rel) => {
                                const isSource = rel.from === concept.id;
                                const otherId = isSource ? rel.to : rel.from;
                                const otherLabel = getConceptLabel(otherId);

                                return (
                                    <div key={rel.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className={`text-sm font-bold ${isSource ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                {isSource ? 'This' : otherLabel}
                                            </div>
                                            <div className="flex flex-col items-center px-4">
                                                <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">{rel.category?.replace('_', ' ') || 'relates to'}</span>
                                                <div className="h-px w-24 bg-slate-300 relative">
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                                </div>
                                                {rel.phrase && <span className="text-xs text-slate-600 mt-1 italic">"{rel.phrase}"</span>}
                                            </div>
                                            <div className={`text-sm font-bold ${!isSource ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                {!isSource ? 'This' : otherLabel}
                                            </div>
                                        </div>
                                        {rel.description && (
                                            <div className="text-sm text-slate-500 border-l border-slate-100 pl-4 ml-4 max-w-xs">
                                                {rel.description}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {relationships.length === 0 && <p className="text-slate-400 italic text-sm">No relationships defined</p>}
                        </div>
                    </section>

                    {/* Rules Section */}
                    {rules.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Rules & Constraints
                            </h3>
                            <ul className="space-y-3">
                                {rules.map((rule) => (
                                    <li key={rule.id} className="flex items-start gap-3 text-slate-700 text-sm bg-amber-50/50 p-4 rounded border border-amber-100/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                        <div>
                                            <strong className="block text-amber-900 mb-1">{rule.title}</strong>
                                            <p className="text-slate-700">{rule.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Lifecycle Section */}
                    {lifecycle && (
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Repeat className="w-4 h-4" /> Lifecycle
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <div className="flex flex-wrap gap-4 items-center justify-center">
                                    {lifecycle.stateConceptIds.map((stateId, i) => {
                                        const isInitial = stateId === lifecycle.initialStateId;
                                        const isTerminal = lifecycle.terminalStateIds?.includes(stateId);

                                        return (
                                            <div key={stateId} className="flex items-center">
                                                {i > 0 && <div className="w-8 h-px bg-slate-300 mx-2" />}
                                                <div className={`
                                                    px-4 py-2 rounded-lg text-sm font-medium border
                                                    ${isInitial ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        isTerminal ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                            'bg-white text-slate-700 border-slate-200 shadow-sm'}
                                                `}>
                                                    {getConceptLabel(stateId)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {lifecycle.notes && (
                                    <p className="mt-6 text-sm text-slate-500 italic text-center border-t border-slate-200 pt-4">
                                        {lifecycle.notes}
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* External References */}
                    {concept.externalRefs && concept.externalRefs.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" /> External References
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {concept.externalRefs.map((ref, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium text-slate-700">
                                                Linked to <span className="text-indigo-600">{ref.conceptId}</span> in <span className="font-bold">{ref.modelId}</span>
                                            </div>
                                        </div>
                                        {ref.note && <span className="text-xs text-slate-500 italic">{ref.note}</span>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
}
