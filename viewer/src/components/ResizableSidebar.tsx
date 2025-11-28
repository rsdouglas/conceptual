import { useState, useEffect, useRef } from 'react';

interface Props {
    children: React.ReactNode;
    initialWidth?: number;
    minWidth?: number;
    maxWidth?: number;
    className?: string;
}

export function ResizableSidebar({
    children,
    initialWidth = 400,
    minWidth = 300,
    maxWidth = 800,
    className = ""
}: Props) {
    const [width, setWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            // Calculate new width based on window width - mouse x
            // We assume this is a right-side sidebar
            const newWidth = document.body.clientWidth - e.clientX;

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [minWidth, maxWidth]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <div
            className={`flex flex-col border-l border-slate-200 shadow-xl bg-white relative ${className}`}
            style={{ width }}
        >
            {/* Drag Handle */}
            {/* Drag Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-50 group flex items-center justify-center"
                onMouseDown={startResizing}
            >
                {/* Visual indicator on hover */}
                <div className="w-1 h-8 bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {children}
        </div>
    );
}
