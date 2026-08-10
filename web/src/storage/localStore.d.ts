/** Thin JSON localStorage helper. Swappable later for a real backend/sync layer. */
export declare function readJson<T>(key: string, fallback: T): T;
export declare function writeJson<T>(key: string, value: T): void;
