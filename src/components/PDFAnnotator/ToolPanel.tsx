import { DrawingTool } from './types';

interface ToolPanelProps {
  currentTool: DrawingTool;
  onToolChange: (tool: Partial<DrawingTool>) => void;
}

const COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#0000FF', // Blue
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#A52A2A', // Brown
];

const PEN_WIDTHS = [1, 2, 3, 5, 8, 12];

export default function ToolPanel({ currentTool, onToolChange }: ToolPanelProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 flex items-center gap-4 z-50">
      {/* Tool Selection */}
      <div className="flex gap-2 border-r pr-4">
        <button
          onClick={() => onToolChange({ type: 'pen' })}
          className={`p-3 rounded-lg transition-colors ${
            currentTool.type === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title="펜"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button
          onClick={() => onToolChange({ type: 'highlighter' })}
          className={`p-3 rounded-lg transition-colors ${
            currentTool.type === 'highlighter' ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title="형광펜"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96c.39-.39.39-1.02 0-1.41L18.37.29c-.39-.39-1.02-.39-1.41 0L15 2.25 18.75 6l1.96-1.96z"/>
            <path fillOpacity=".36" d="M0 20h24v4H0z"/>
          </svg>
        </button>
        <button
          onClick={() => onToolChange({ type: 'eraser' })}
          className={`p-3 rounded-lg transition-colors ${
            currentTool.type === 'eraser' ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title="지우개"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83L5.03 20h7.66l8.72-8.72c.78-.78.78-2.05 0-2.83l-4.85-4.85c-.39-.39-.9-.59-1.41-.59zM6 18.5l6-6L13.5 14l-6 6H6v-1.5z"/>
          </svg>
        </button>
        <button
          onClick={() => onToolChange({ type: 'select' })}
          className={`p-3 rounded-lg transition-colors ${
            currentTool.type === 'select' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title="선택"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z"/>
          </svg>
        </button>
      </div>

      {/* Color Selection */}
      {(currentTool.type === 'pen' || currentTool.type === 'highlighter') && (
        <div className="flex gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onToolChange({ color })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                currentTool.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Width Selection */}
      {currentTool.type !== 'select' && (
        <div className="flex gap-2 border-l pl-4">
          {PEN_WIDTHS.map((width) => (
            <button
              key={width}
              onClick={() => onToolChange({ width })}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                currentTool.width === width ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div
                className="rounded-full bg-black"
                style={{
                  width: `${Math.min(width * 2, 16)}px`,
                  height: `${Math.min(width * 2, 16)}px`,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}