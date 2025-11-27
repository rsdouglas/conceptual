
import type { ConceptSheet } from '../../../conceptual/src/types/model';
import { ArrowLeft, Code, FileText, GitCommit, ShieldAlert, Zap } from 'lucide-react';

interface Props {
    concept: ConceptSheet;
    onBack: () => void;
}

export function ConceptDetailSpec({ concept, onBack }: Props) {
    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-slate-200 px-8 py-6 bg-slate-50/50">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Domain Map
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">{concept.metadata.name}</h1>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 uppercase tracking-wide">
                                {concept.metadata.type.replace('_', ' ')}
                            </span>
                            {concept.metadata.criticality && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border uppercase tracking-wide
                  ${concept.metadata.criticality === 'core' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                        concept.metadata.criticality === 'experimental' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-slate-50 text-slate-600 border-slate-200'}
                `}>
                                    {concept.metadata.criticality}
                                </span>
                            )}
                        </div>
                        <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                            {concept.definition.shortDescription}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">

                    {/* Structure Section */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Structure
                        </h3>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-slate-700 w-1/4">Field</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 w-1/4">Type</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {concept.structure.fields.map((field, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 font-medium text-slate-900">{field.name}</td>
                                            <td className="px-6 py-3 font-mono text-slate-500 text-xs">{field.type}</td>
                                            <td className="px-6 py-3 text-slate-600">{field.description || '-'}</td>
                                        </tr>
                                    ))}
                                    {concept.structure.fields.length === 0 && (
                                        <tr><td colSpan={3} className="px-6 py-4 text-slate-400 italic">No fields defined</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Relationships & Behavior Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Relationships */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <GitCommit className="w-4 h-4" /> Relationships
                            </h3>
                            <ul className="space-y-3">
                                {concept.structure.relationships.map((rel, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm bg-slate-50 p-3 rounded border border-slate-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                        {rel.description}
                                    </li>
                                ))}
                                {concept.structure.relationships.length === 0 && <p className="text-slate-400 italic text-sm">None defined</p>}
                            </ul>
                        </section>

                        {/* Invariants */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Invariants
                            </h3>
                            <ul className="space-y-3">
                                {concept.invariants?.map((inv, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm bg-amber-50/50 p-3 rounded border border-amber-100/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                        <span>
                                            <strong className="block text-amber-900 mb-0.5">{inv.rule}</strong>
                                            {inv.notes && <span className="text-amber-700/80 text-xs">{inv.notes}</span>}
                                        </span>
                                    </li>
                                ))}
                                {(!concept.invariants || concept.invariants.length === 0) && <p className="text-slate-400 italic text-sm">None defined</p>}
                            </ul>
                        </section>
                    </div>

                    {/* Events & Commands */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Events
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {concept.events?.map((evt, i) => (
                                    <div key={i} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-md text-sm font-medium border border-rose-100">
                                        {evt.name}
                                    </div>
                                ))}
                                {(!concept.events || concept.events.length === 0) && <p className="text-slate-400 italic text-sm">None defined</p>}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <ActivityIcon className="w-4 h-4" /> Commands
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {concept.commands?.map((cmd, i) => (
                                    <div key={i} className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-md text-sm font-medium border border-cyan-100">
                                        {cmd.name}
                                    </div>
                                ))}
                                {(!concept.commands || concept.commands.length === 0) && <p className="text-slate-400 italic text-sm">None defined</p>}
                            </div>
                        </section>
                    </div>

                    {/* Implementation Links (Level 4) */}
                    <section className="pt-8 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Code className="w-4 h-4" /> Implementation
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {concept.implementation?.map((impl, i) => (
                                <a
                                    key={i}
                                    href={`vscode://file/${impl.path}`} // Assuming absolute path or needs adjustment
                                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group bg-slate-50 hover:bg-white"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                        <div>
                                            <div className="font-medium text-slate-700 group-hover:text-indigo-700">{impl.label}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">{impl.path}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-500">Open in Editor →</span>
                                </a>
                            ))}
                            {(!concept.implementation || concept.implementation.length === 0) && <p className="text-slate-400 italic text-sm">No implementation links found</p>}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
