import { useCallback, useState } from 'react';

export function useTableSelection() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [startSelectionIndex, setStartSelectionIndex] = useState<number | null>(null);

  const handleMouseDown = useCallback((index: number) => {
    setStartSelectionIndex(index);
    setSelectedRows([index]);
  }, []);

  const handleMouseOver = useCallback(
    (index: number) => {
      setSelectedRows(prev => {
        if (startSelectionIndex === null) return prev;
        const start = Math.min(startSelectionIndex, index);
        const end = Math.max(startSelectionIndex, index);
        const range: number[] = [];
        for (let i = start; i <= end; i++) range.push(i);
        return range;
      });
    },
    [startSelectionIndex]
  );

  const handleMouseUp = useCallback(() => {
    setStartSelectionIndex(null);
  }, []);

  return {
    selectedRows,
    setSelectedRows,
    handleMouseDown,
    handleMouseOver,
    handleMouseUp,
  };
}

export default useTableSelection;
