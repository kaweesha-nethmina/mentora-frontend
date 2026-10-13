'use client';

import { useRef, useState } from 'react';
import {
  Circle,
  Eraser,
  Minus,
  MousePointer2,
  Pencil,
  RectangleHorizontal,
  RotateCcw,
  Send,
} from 'lucide-react';

export type DrawTool = 'cursor' | 'pen' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'text' | 'eraser';

export interface RemoteCursor {
  id: string;
  name: string;
  role: string;
  color: string;
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  type: Exclude<DrawTool, 'cursor' | 'eraser'>;
  color: string;
  width?: number;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
}

interface CollaborativeOverlayProps {
  drawMode: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  onClear: () => void;
  cursors: RemoteCursor[];
  elements: WhiteboardElement[];
  onDraw: (element: WhiteboardElement) => void;
  onErase: (elementId: string) => void;
  onCursorMove: (point: { x: number; y: number }) => void;
}

const toolItems: { id: DrawTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: 'cursor', label: 'Cursor', icon: MousePointer2 },
  { id: 'pen', label: 'Pen', icon: Pencil },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'arrow', label: 'Arrow', icon: Send },
  { id: 'rectangle', label: 'Rectangle', icon: RectangleHorizontal },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'text', label: 'Text', icon: Pencil },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
];

const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  };
};

export default function CollaborativeOverlay({
  drawMode,
  onToolChange,
  onClear,
  cursors,
  elements,
  onDraw,
  onErase,
  onCursorMove,
}: CollaborativeOverlayProps) {
  const drawingRef = useRef<{ type: DrawTool; points: { x: number; y: number }[] } | null>(null);
  const [localPreview, setLocalPreview] = useState<{ type: DrawTool; points: { x: number; y: number }[] } | null>(null);

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (drawMode === 'cursor') return;
    const point = pointFromEvent(event);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (drawMode === 'text') {
      const text = window.prompt('Enter whiteboard text');
      if (text?.trim()) {
        onDraw({ id: crypto.randomUUID(), type: 'text', color: '#38bdf8', start: point, text: text.trim() });
      }
      return;
    }

    if (drawMode === 'eraser') {
      const hit = [...elements].reverse().find((element) => {
        const points = element.points || [element.start, element.end].filter(Boolean) as { x: number; y: number }[];
        return points.some((candidate) => Math.hypot(candidate.x - point.x, candidate.y - point.y) < 0.04);
      });
      if (hit) onErase(hit.id);
      return;
    }

    drawingRef.current = { type: drawMode, points: [point] };
    setLocalPreview(drawingRef.current);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event);
    onCursorMove(point);
    if (!drawingRef.current) return;
    drawingRef.current.points.push(point);
    setLocalPreview({ type: drawingRef.current.type, points: [...drawingRef.current.points] });
  };

  const finishDrawing = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;
    const drawing = drawingRef.current;
    const points = drawing.points;
    const start = points[0];
    const end = points[points.length - 1];
    const type = drawing.type as Exclude<DrawTool, 'cursor' | 'eraser'>;
    onDraw({
      id: crypto.randomUUID(),
      type,
      color: '#38bdf8',
      width: 0.003,
      points: type === 'pen' ? points : undefined,
      start,
      end,
    });
    drawingRef.current = null;
    setLocalPreview(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const renderElement = (element: WhiteboardElement, preview = false) => {
    const stroke = element.color;
    const width = element.width || 0.003;
    const points = element.points || [];
    const start = element.start || points[0];
    const end = element.end || points[points.length - 1];
    if (!start) return null;
    const common = { stroke, strokeWidth: width, fill: 'none', vectorEffect: 'non-scaling-stroke' as const, opacity: preview ? 0.55 : 1 };

    if (element.type === 'pen' && points.length > 1) {
      return <polyline key={element.id} points={points.map((point) => `${point.x * 100}%,${point.y * 100}%`).join(' ')} {...common} strokeLinecap="round" strokeLinejoin="round" />;
    }
    if ((element.type === 'line' || element.type === 'arrow') && end) {
      return <line key={element.id} x1={`${start.x * 100}%`} y1={`${start.y * 100}%`} x2={`${end.x * 100}%`} y2={`${end.y * 100}%`} {...common} markerEnd={element.type === 'arrow' ? 'url(#arrowhead)' : undefined} />;
    }
    if (element.type === 'rectangle' && end) {
      return <rect key={element.id} x={`${Math.min(start.x, end.x) * 100}%`} y={`${Math.min(start.y, end.y) * 100}%`} width={`${Math.abs(end.x - start.x) * 100}%`} height={`${Math.abs(end.y - start.y) * 100}%`} {...common} />;
    }
    if (element.type === 'circle' && end) {
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      return <circle key={element.id} cx={`${start.x * 100}%`} cy={`${start.y * 100}%`} r={`${radius * 100}%`} {...common} />;
    }
    if (element.type === 'text') {
      return <text key={element.id} x={`${start.x * 100}%`} y={`${start.y * 100}%`} fill={stroke} fontSize="16" fontWeight="600" opacity={preview ? 0.55 : 1}>{element.text}</text>;
    }
    return null;
  };

  const previewElement = localPreview && localPreview.points.length > 0 ? {
    id: 'preview',
    type: localPreview.type as Exclude<DrawTool, 'cursor' | 'eraser'>,
    color: '#38bdf8',
    points: localPreview.type === 'pen' ? localPreview.points : undefined,
    start: localPreview.points[0],
    end: localPreview.points[localPreview.points.length - 1],
  } : null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background/95 p-1.5 shadow-raised pointer-events-auto">
        {toolItems.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" title={label} onClick={() => onToolChange(id)} className={`p-2 rounded-lg transition-colors ${drawMode === id ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300' : 'text-muted-foreground hover:bg-surface-3 hover:text-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <button type="button" title="Clear board" onClick={onClear} className="p-2 rounded-lg text-red-700 dark:text-red-300/70 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <svg
        className={`absolute inset-0 w-full h-full ${drawMode === 'cursor' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      >
        <defs>
          <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#38bdf8" />
          </marker>
        </defs>
        {elements.map((element) => renderElement(element))}
        {previewElement && renderElement(previewElement, true)}
        {cursors.map((cursor) => (
          <g key={cursor.id} transform={`translate(${cursor.x * 100}%, ${cursor.y * 100}%)`} className="pointer-events-none">
            <path d="M0 0 L0 17 L5 12 L10 22 L14 20 L9 10 L17 10 Z" fill={cursor.color} stroke="var(--background)" strokeWidth="1" />
            <text x="19" y="8" fill={cursor.color} fontSize="12" fontWeight="700" stroke="var(--background)" strokeWidth="3" paintOrder="stroke">{cursor.name} • {cursor.role}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
