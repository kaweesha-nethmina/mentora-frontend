'use client';

import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, Wifi, WifiOff, Copy, Check, Pencil, Eraser } from 'lucide-react';
import * as fabric from 'fabric';
import io, { Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  connected: boolean;
  activeUsers: number;
  questionText?: string;
  roomId?: string;
  username?: string;
}

export default function CodeEditor({
  value,
  onChange,
  connected,
  activeUsers,
  questionText,
  roomId = 'java-room-1',
  username = 'Peer Learner',
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ef4444');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ---------------------------------------------------------------------------
  // FABRIC.JS CANVAS & SOCKET REALTIME SYNC SETUP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      path: '/socket.io',
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_room', { room_id: roomId, username });

    const container = document.getElementById('editor-workspace-container');
    if (canvasRef.current && container) {
      // Fabric v6+ Canvas setup
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: container.clientWidth,
        height: container.clientHeight,
        isDrawingMode: false,
      });
      fabricCanvasRef.current = fabricCanvas;

      // Setup Initial Brush
      const pencilBrush = new fabric.PencilBrush(fabricCanvas);
      pencilBrush.color = brushColor;
      pencilBrush.width = 3;
      fabricCanvas.freeDrawingBrush = pencilBrush;

      // Broadcast Local Drawings via Socket
      fabricCanvas.on('path:created', (e: any) => {
        const pathObj = e.path;
        if (!pathObj) return;

        const pathData = pathObj.toObject();

        socket.emit('draw_line', {
          room_id: roomId,
          path_data: pathData,
          color: brushColor,
        });
      });

      // Receive Remote Line Drawing (Fixed Async Rendering)
      socket.on('receive_line', async ({ path_data }: { path_data: any }) => {
        try {
          const enlivenedObjects = await fabric.util.enlivenObjects([path_data]);
          enlivenedObjects.forEach((obj: any) => {
            if (obj) {
              obj.set({
                selectable: false,
                evented: false,
              });
              fabricCanvas.add(obj);
            }
          });
          fabricCanvas.requestRenderAll();
        } catch (err) {
          console.error('Error rendering remote line:', err);
        }
      });

      // Clear Canvas Sync Event
      socket.on('canvas_cleared', () => {
        fabricCanvas.clear();
        fabricCanvas.requestRenderAll();
      });

      // Handle Resize
      const handleResize = () => {
        if (fabricCanvas && container) {
          fabricCanvas.setDimensions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
          fabricCanvas.requestRenderAll();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        socket.disconnect();
        fabricCanvas.dispose();
      };
    }
  }, [roomId, username]);

  // Handle Drawing Mode Toggle
  const toggleDrawingMode = () => {
    const nextState = !isDrawingMode;
    setIsDrawingMode(nextState);

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = nextState;

      if (nextState) {
        const pencil = new fabric.PencilBrush(fabricCanvasRef.current);
        pencil.color = brushColor;
        pencil.width = 3;
        fabricCanvasRef.current.freeDrawingBrush = pencil;
      }
    }
  };

  // Change Brush Color
  const changeColor = (color: string) => {
    setBrushColor(color);
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.requestRenderAll();
      if (socketRef.current) {
        socketRef.current.emit('clear_canvas', { room_id: roomId });
      }
    }
  };

  // Copy Code to Clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-background overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span className="text-xs font-bold text-foreground">Main.java</span>
          </div>
          {questionText && (
            <span className="text-[10px] text-subtle-foreground max-w-[200px] truncate hidden md:block">
              {questionText}
            </span>
          )}
        </div>

        {/* Action Controls & Toolbar */}
        <div className="flex items-center gap-3">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg border border-border">
            <button
              onClick={toggleDrawingMode}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                isDrawingMode ? 'bg-rose-500 text-white font-semibold' : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isDrawingMode ? 'Drawing On' : 'Pencil'}</span>
            </button>

            {isDrawingMode && (
              <>
                <div className="flex items-center gap-1 ml-1 border-l border-border pl-2">
                  {['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      onClick={() => changeColor(c)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        brushColor === c ? 'scale-125 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleClearCanvas}
                  className="p-1 text-subtle-foreground hover:text-rose-700 dark:hover:text-rose-400 transition-colors ml-1"
                  title="Clear Drawings"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Connection Indicator */}
          <div className="flex items-center gap-1.5 text-[10px]">
            {connected ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Live</span>
                <span className="text-subtle-foreground ml-1">
                  {activeUsers} user{activeUsers !== 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-subtle-foreground" />
                <span className="text-subtle-foreground">Offline</span>
              </>
            )}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-muted text-subtle-foreground hover:text-foreground/80 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Workspace Area: Editor & Canvas Overlay */}
      <div id="editor-workspace-container" className="relative flex-1 min-h-0">
        {/* Layer 1: Monaco Code Editor */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
          }}
        >
          <Editor
            height="100%"
            defaultLanguage="java"
            theme="vs-dark"
            value={value}
            onChange={(v) => onChange(v || '')}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              automaticLayout: true,
              tabSize: 4,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Layer 2: Drawing Canvas Layer (Top Overlay) */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 10,
            pointerEvents: isDrawingMode ? 'auto' : 'none',
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}