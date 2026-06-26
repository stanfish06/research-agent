import { Worker } from "node:worker_threads";
import type { PDFData, PDFRequest } from "./pdf_parser.js";

export const parsePDF = async (path: string, renderPages?: number[]): Promise<PDFData> => {
    return new Promise((resolve) => {
        const worker = new Worker(new URL("./pdf_parser.ts", import.meta.url));
        worker.once("message", (data: PDFData) => {
            worker.terminate();
            resolve(data);
        });
        worker.once("error", (err) => {
            worker.terminate();
            resolve({ error: String(err) });
        });
        const req: PDFRequest = renderPages ? { path, renderPages } : { path };
        worker.postMessage(req);
    });
}
