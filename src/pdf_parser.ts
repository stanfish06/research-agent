import { parentPort } from "node:worker_threads";
import * as mupdf from "mupdf";

export interface PDFData {
    text?: string;
    images?: any[];
    error?: string;
}

parentPort!.on("message", (pathPDF: string) => {
    let msg: PDFData = {};
    try {
        const doc = mupdf.Document.openDocument(pathPDF);
        let html = "";
        for (let i = 0; i < doc.countPages(); i++) {
            const page = doc.loadPage(i);
            const stext = page.toStructuredText("preserve-whitespace");
            html += stext.asHTML(i);
            page.destroy();
        }
        doc.destroy();
        msg = { text: html };
    } catch (err) {
        msg = { error: String(err) };
    }
    parentPort!.postMessage(msg);
})
