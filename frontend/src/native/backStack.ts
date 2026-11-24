import { useEffect } from 'react';

/** Android back button: modals/sheets register here and are closed first, newest first. */
const stack: (() => void)[] = [];
export function pushBack(fn: () => void) { stack.push(fn); return () => { const i = stack.lastIndexOf(fn); if (i >= 0) stack.splice(i, 1); }; }
export function popBack(): boolean { const fn = stack.pop(); if (!fn) return false; fn(); return true; }
/** Register while `open` is true. */
export function useBackClose(open: boolean, onClose: () => void) {
  useEffect(() => (open ? pushBack(onClose) : undefined), [open, onClose]);
}
