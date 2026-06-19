export const DEFAULT_TIMEOUT = 30000;
export const asArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
};
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error;
}
export const fetchWithTimeout = async (url: string, ms = DEFAULT_TIMEOUT): Promise<Response> => {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(ms)
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    };
    return response;
}
