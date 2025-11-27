// HoverSmoothStepEdge.tsx
import { useState } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export function HoverEdge(props: EdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        markerEnd,
        data,
    } = props;

    const [hovered, setHovered] = useState(false);

    // This gives us the SAME shape as `type: 'smoothstep'`
    // plus label coordinates.
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                onMouseEnter={() => { setHovered(true); console.log('hovered', hovered) }}
                onMouseLeave={() => { setHovered(false); console.log('hovered', hovered) }}
            />

            {hovered && data && (data as any).phrase && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="px-1.5 py-0.5 bg-white/95 border border-slate-300 rounded text-xs text-slate-600 shadow-sm"
                    >
                        {(data as any).phrase}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
