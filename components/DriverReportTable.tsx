import React, { useReducer, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface CellPos {
  row: number;
  col: number;
}

interface TableState {
  cells: string[][];
  active: CellPos;
  editing: CellPos | null;
  selection: { start: CellPos; end: CellPos } | null;
}

const COL_WIDTH = 120;
const ROW_HEIGHT = 28;

function colLetter(idx: number) {
  let s = '';
  do {
    s = String.fromCharCode(65 + (idx % 26)) + s;
    idx = Math.floor(idx / 26) - 1;
  } while (idx >= 0);
  return s;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function DriverReportTable() {
  const initialCells = React.useMemo(() =>
    Array.from({ length: 20 }, () => Array.from({ length: 10 }, () => '')),
    []
  );

  function reducer(state: TableState, action: any): TableState {
    switch (action.type) {
      case 'SET_ACTIVE':
        return { ...state, active: action.pos, selection: null };
      case 'START_EDIT':
        return { ...state, editing: action.pos };
      case 'STOP_EDIT': {
        const { row, col, value } = action;
        const cells = state.cells.map((r) => [...r]);
        if (cells[row]) {
          cells[row][col] = value;
          if (row === cells.length - 1 && value !== '') {
            cells.push(Array.from({ length: cells[0].length }, () => ''));
          }
        }
        return { ...state, cells, editing: null };
      }
      case 'CANCEL_EDIT':
        return { ...state, editing: null };
      case 'ADD_ROW': {
        const cells = state.cells.concat([
          Array.from({ length: state.cells[0].length }, () => ''),
        ]);
        return { ...state, cells };
      }
      case 'ADD_COL': {
        const cells = state.cells.map((r) => [...r, '']);
        return { ...state, cells };
      }
      case 'DEL_ROW': {
        if (state.cells.length <= 1) return state;
        const cells = state.cells.filter((_, i) => i !== action.row);
        const active = state.active.row >= cells.length ? { row: cells.length - 1, col: state.active.col } : state.active;
        return { ...state, cells, active };
      }
      case 'DEL_COL': {
        if (state.cells[0].length <= 1) return state;
        const cells = state.cells.map((r) => r.filter((_, i) => i !== action.col));
        const active = state.active.col >= cells[0].length ? { row: state.active.row, col: cells[0].length - 1 } : state.active;
        return { ...state, cells, active };
      }
      case 'SET_SELECTION':
        return { ...state, selection: action.sel };
      case 'REPLACE':
        return { ...state, cells: action.cells };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, {
    cells: initialCells,
    active: { row: 0, col: 0 },
    editing: null,
    selection: null,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtual = useVirtualizer({
    count: state.cells.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
  });

  const startEdit = (pos: CellPos) => dispatch({ type: 'START_EDIT', pos });

  const stopEdit = (value: string) => {
    if (!state.editing) return;
    dispatch({ type: 'STOP_EDIT', row: state.editing.row, col: state.editing.col, value });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (state.editing) return;
    const { row, col } = state.active;
    if (e.key === 'ArrowUp') {
      dispatch({ type: 'SET_ACTIVE', pos: { row: clamp(row - 1, 0, state.cells.length - 1), col } });
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      dispatch({ type: 'SET_ACTIVE', pos: { row: clamp(row + 1, 0, state.cells.length - 1), col } });
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      dispatch({ type: 'SET_ACTIVE', pos: { row, col: clamp(col - 1, 0, state.cells[0].length - 1) } });
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      dispatch({ type: 'SET_ACTIVE', pos: { row, col: clamp(col + 1, 0, state.cells[0].length - 1) } });
      e.preventDefault();
    } else if (e.key === 'Enter') {
      startEdit(state.active);
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      if (state.selection) {
        const { start, end } = state.selection;
        const rows = [] as string[];
        for (let r = start.row; r <= end.row; r++) {
          const cols = [] as string[];
          for (let c = start.col; c <= end.col; c++) cols.push(state.cells[r][c]);
          rows.push(cols.join('\t'));
        }
        navigator.clipboard.writeText(rows.join('\n'));
      } else {
        navigator.clipboard.writeText(state.cells[row][col]);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      navigator.clipboard.readText().then((text) => {
        const lines = text.split(/\r?\n/);
        const cells = state.cells.map((r) => [...r]);
        lines.forEach((line, i) => {
          const vals = line.split('\t');
          vals.forEach((val, j) => {
            const r = row + i;
            const c = col + j;
            if (!cells[r]) cells[r] = Array.from({ length: cells[0].length }, () => '');
            if (c >= cells[r].length) cells[r].push('');
            cells[r][c] = val;
          });
        });
        dispatch({ type: 'REPLACE', cells });
      });
    }
  };

  // Drag to select
  const dragStart = useRef<CellPos | null>(null);
  const handleMouseDown = (r: number, c: number) => {
    dragStart.current = { row: r, col: c };
    dispatch({ type: 'SET_ACTIVE', pos: { row: r, col: c } });
    dispatch({ type: 'SET_SELECTION', sel: { start: { row: r, col: c }, end: { row: r, col: c } } });
  };
  const handleMouseOver = (r: number, c: number) => {
    if (!dragStart.current) return;
    const start = dragStart.current;
    dispatch({
      type: 'SET_SELECTION',
      sel: {
        start: { row: Math.min(start.row, r), col: Math.min(start.col, c) },
        end: { row: Math.max(start.row, r), col: Math.max(start.col, c) },
      },
    });
  };
  const handleMouseUp = () => {
    dragStart.current = null;
  };

  useEffect(() => {
    const el = parentRef.current;
    el?.addEventListener('mouseup', handleMouseUp);
    return () => el?.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button className="btn btn-xs" onClick={() => dispatch({ type: 'ADD_ROW' })}>Add Row</button>
        <button className="btn btn-xs" onClick={() => dispatch({ type: 'ADD_COL' })}>Add Col</button>
      </div>
      <div
        ref={parentRef}
        tabIndex={0}
        onKeyDown={handleKey}
        className="overflow-auto border border-gray-300 dark:border-gray-600 max-h-96 outline-none"
        style={{ width: COL_WIDTH * state.cells[0].length + 40 }}
      >
        <div className="grid" style={{ gridTemplateColumns: `40px repeat(${state.cells[0].length}, ${COL_WIDTH}px)` }}>
          <div className="sticky top-0 left-0 z-10 bg-gray-50 dark:bg-gray-700 border-r border-b border-gray-300 dark:border-gray-600"></div>
          {state.cells[0].map((_, c) => (
            <div
              key={c}
              className="sticky top-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-300 dark:border-gray-600 text-xs font-semibold"
            >
              {colLetter(c)}
              <button className="ml-1 text-red-500" onClick={() => dispatch({ type: 'DEL_COL', col: c })}>×</button>
            </div>
          ))}
        </div>
        <div style={{ height: rowVirtual.getTotalSize(), position: 'relative' }}>
          {rowVirtual.getVirtualItems().map((vr) => (
            <div
              key={vr.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: vr.size,
                transform: `translateY(${vr.start}px)`,
                display: 'grid',
                gridTemplateColumns: `40px repeat(${state.cells[0].length}, ${COL_WIDTH}px)`,
              }}
            >
              <div className="sticky left-0 bg-gray-50 dark:bg-gray-700 border-r border-b border-gray-300 dark:border-gray-600 text-center text-xs font-semibold">
                {vr.index + 1}
                <button className="ml-1 text-red-500" onClick={() => dispatch({ type: 'DEL_ROW', row: vr.index })}>×</button>
              </div>
              {state.cells[vr.index].map((val, c) => {
                const active = state.active.row === vr.index && state.active.col === c;
                const selected = state.selection &&
                  vr.index >= state.selection.start.row &&
                  vr.index <= state.selection.end.row &&
                  c >= state.selection.start.col &&
                  c <= state.selection.end.col;
                return (
                  <div
                    key={c}
                    className={`border-r border-b border-gray-300 dark:border-gray-600 px-1 text-sm flex items-center ${active ? 'border-blue-500' : ''} ${selected ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                    onDoubleClick={() => startEdit({ row: vr.index, col: c })}
                    onMouseDown={() => handleMouseDown(vr.index, c)}
                    onMouseOver={() => handleMouseOver(vr.index, c)}
                  >
                    {state.editing && state.editing.row === vr.index && state.editing.col === c ? (
                      <input
                        autoFocus
                        className="w-full bg-transparent focus:outline-none"
                        defaultValue={val}
                        onBlur={(e) => stopEdit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') stopEdit((e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') dispatch({ type: 'CANCEL_EDIT' });
                        }}
                      />
                    ) : (
                      val
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

