interface GroupNodeData {
    title?: string;
}

export function GroupNode({ data }: { data: GroupNodeData }) {
    return (
        <div
            className="w-full h-full box-border rounded-xl bg-transparent"
            style={{ pointerEvents: 'none' }}
        // ^ important so the wrapper captures drag/selection as intended
        >
            {data.title && (
                <div className="px-4 py-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {data.title}
                </div>
            )}
        </div>
    );
}
