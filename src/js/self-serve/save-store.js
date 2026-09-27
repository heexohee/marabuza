// Where the self-serve save lives: the desktop app's save file when the app provides one (`marabuzaSave`,
// desktop/preload.cjs — a folder Steam Auto-Cloud syncs), else the browser's localStorage. Same interface.

/**
 * @returns {{ getItem(key: string): string | null, setItem(key: string, value: string): unknown, removeItem(key: string): unknown }}
 */
export const saveStore = () => globalThis.marabuzaSave ?? globalThis.localStorage
