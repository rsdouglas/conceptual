
import type { ProjectOverview } from '../../../conceptual/src/types/model';
import { LayoutGrid, Users, Database, Globe, Server, Layers } from 'lucide-react';

interface Props {
    overview: ProjectOverview;
    projectName: string;
}

export function ProjectOverviewHero({ overview, projectName }: Props) {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{projectName}</h1>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    {overview.summary}
                </p>
            </div>

            {/* System Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* External Systems */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-slate-500 uppercase text-xs font-bold tracking-wider">
                        <Globe className="w-4 h-4" />
                        External Systems
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {overview.systemContext.externalSystems.length > 0 ? (
                            overview.systemContext.externalSystems.map((sys, i) => (
                                <div key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium border border-blue-100">
                                    {sys.name}
                                    {sys.direction && <span className="ml-1 opacity-60 text-xs">({sys.direction})</span>}
                                </div>
                            ))
                        ) : (
                            <span className="text-slate-400 italic text-sm">None identified</span>
                        )}
                    </div>
                </div>

                {/* User Roles */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-slate-500 uppercase text-xs font-bold tracking-wider">
                        <Users className="w-4 h-4" />
                        User Roles
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {overview.systemContext.userRoles.length > 0 ? (
                            overview.systemContext.userRoles.map((role, i) => (
                                <div key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md text-sm font-medium border border-emerald-100">
                                    {role.name}
                                </div>
                            ))
                        ) : (
                            <span className="text-slate-400 italic text-sm">None identified</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Architecture & Containers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Services */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold text-sm">
                        <Server className="w-4 h-4" />
                        Services
                    </div>
                    <ul className="space-y-1">
                        {overview.containers.services.map((s, i) => (
                            <li key={i} className="text-slate-600 text-sm">• {s}</li>
                        ))}
                        {overview.containers.services.length === 0 && <li className="text-slate-400 italic text-sm">None</li>}
                    </ul>
                </div>

                {/* Data Stores */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold text-sm">
                        <Database className="w-4 h-4" />
                        Data Stores
                    </div>
                    <ul className="space-y-1">
                        {overview.containers.dataStores.map((s, i) => (
                            <li key={i} className="text-slate-600 text-sm">• {s}</li>
                        ))}
                        {overview.containers.dataStores.length === 0 && <li className="text-slate-400 italic text-sm">None</li>}
                    </ul>
                </div>

                {/* Modules */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold text-sm">
                        <LayoutGrid className="w-4 h-4" />
                        Modules
                    </div>
                    <ul className="space-y-1">
                        {overview.modules.boundaries.map((s, i) => (
                            <li key={i} className="text-slate-600 text-sm">• {s}</li>
                        ))}
                        {overview.modules.boundaries.length === 0 && <li className="text-slate-400 italic text-sm">None</li>}
                    </ul>
                </div>
            </div>

            {/* Domain Focus Footer */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 flex items-start gap-4">
                <Layers className="w-6 h-6 text-indigo-600 mt-1 shrink-0" />
                <div>
                    <h3 className="text-indigo-900 font-semibold mb-1">Domain Focus</h3>
                    <p className="text-indigo-700 text-sm leading-relaxed">
                        {overview.modules.domainFocus}
                    </p>
                </div>
            </div>
        </div>
    );
}
