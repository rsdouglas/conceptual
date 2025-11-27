import { Handle, Position } from '@xyflow/react';

interface ConceptNodeData {
    label: string;
    category?: string;
    description?: string;
}

export function ConceptNode({ data }: { data: ConceptNodeData }) {
    const { label, category, description } = data;
    const style = getCategoryStyle(category || 'other');

    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 shadow-sm min-w-[180px] max-w-[200px] ${style.bg} ${style.border}`}
        >
            <Handle type="target" position={Position.Top} className="!bg-slate-400" />

            <div className="space-y-1">
                <div className={`font-bold text-sm ${style.text}`}>{label}</div>
                {description && (
                    <div className="text-xs text-slate-600 line-clamp-2">{description}</div>
                )}
                {category && (
                    <div className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">
                        {category}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
        </div>
    );
}

function getCategoryStyle(category: string) {
    switch (category) {
        case 'thing':
            return {
                bg: 'bg-blue-50',
                border: 'border-blue-300',
                text: 'text-blue-900'
            };
        case 'activity':
            return {
                bg: 'bg-green-50',
                border: 'border-green-300',
                text: 'text-green-900'
            };
        case 'role':
            return {
                bg: 'bg-purple-50',
                border: 'border-purple-300',
                text: 'text-purple-900'
            };
        case 'state':
            return {
                bg: 'bg-yellow-50',
                border: 'border-yellow-300',
                text: 'text-yellow-900'
            };
        case 'event':
            return {
                bg: 'bg-orange-50',
                border: 'border-orange-300',
                text: 'text-orange-900'
            };
        case 'place':
            return {
                bg: 'bg-pink-50',
                border: 'border-pink-300',
                text: 'text-pink-900'
            };
        case 'time':
            return {
                bg: 'bg-cyan-50',
                border: 'border-cyan-300',
                text: 'text-cyan-900'
            };
        default:
            return {
                bg: 'bg-slate-50',
                border: 'border-slate-300',
                text: 'text-slate-900'
            };
    }
}
