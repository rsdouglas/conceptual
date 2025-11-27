interface GroupNodeData {
    title?: string;
}

export function GroupNode({ data }: { data: GroupNodeData }) {
    return (
        <div
            className="bg-slate-50/50 border border-slate-300/70 rounded-xl"
            style={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
            }}
        >
            {data.title && (
                <div className="px-4 py-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {data.title}
                </div>
            )}
        </div>
    );
}
