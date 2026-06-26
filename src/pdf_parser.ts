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
        let images: Uint8Array[] = [];
        for (let i = 0; i < doc.countPages(); i++) {
            const page = doc.loadPage(i);
            const stext = page.toStructuredText("preserve-whitespace");
            html += stext.asHTML(i);
            stext.walk({
                onImageBlock(_b, _t, image) {
                    const pixelMap = image.toPixmap();
                    images.push(pixelMap.asPNG());
                    pixelMap.destroy();
                }
            });
            page.destroy();
        }
        doc.destroy();
        msg = { text: html, images };
    } catch (err) {
        msg = { error: String(err) };
    }
    parentPort!.postMessage(msg);
})
