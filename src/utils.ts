import { writeFile } from "node:fs/promises";

export const DEFAULT_TIMEOUT = 30000;
export const asArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
};
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error;
}
export const fetchWithTimeout = async (url: string, ms = DEFAULT_TIMEOUT, fetchOpts = {}): Promise<Response> => {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(ms),
        ...fetchOpts,
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    };
    return response;
}
export const downloadPDF = async (url: string, outPath: string, ms = DEFAULT_TIMEOUT) => {
    const res = await fetchWithTimeout(url, ms, {
        headers: { Accept: "application/pdf" },
    });
    const bytes = new Uint8Array(await res.arrayBuffer());
    await writeFile(outPath, bytes);
}
