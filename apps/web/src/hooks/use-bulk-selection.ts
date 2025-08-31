/**
 * Hook for managing bulk selection in tables
 * Extracted from CRM example and adapted for our use
 */

import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string | number;
}

export function useBulkSelection<T>({ items, getItemId }: UseBulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const isSelected = useCallback(
    (item: T) => selectedIds.has(getItemId(item)),
    [selectedIds, getItemId]
  );

  const toggleSelection = useCallback(
    (item: T) => {
      const id = getItemId(item);
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [getItemId]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getItemId)));
  }, [items, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectRange = useCallback(
    (startItem: T, endItem: T) => {
      const startIndex = items.findIndex(item => getItemId(item) === getItemId(startItem));
      const endIndex = items.findIndex(item => getItemId(item) === getItemId(endItem));
      
      if (startIndex === -1 || endIndex === -1) return;
      
      const [from, to] = startIndex < endIndex 
        ? [startIndex, endIndex] 
        : [endIndex, startIndex];
      
      const rangeIds = items
        .slice(from, to + 1)
        .map(getItemId);
      
      setSelectedIds(prev => new Set([...prev, ...rangeIds]));
    },
    [items, getItemId]
  );

  return {
    selectedIds: Array.from(selectedIds),
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size,
    isAllSelected: selectedIds.size === items.length && items.length > 0,
    isPartiallySelected: selectedIds.size > 0 && selectedIds.size < items.length,
  };
}