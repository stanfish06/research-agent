import { parentPort } from "node:worker_threads";
import * as mupdf from "mupdf";

export interface PDFPage {
    index: number;       // 0-based page number
    png: Uint8Array;     // full-page screenshot
}

export interface PDFData {
    text?: string;
    images?: Uint8Array[];
    pages?: PDFPage[];
    pageCount?: number;
    error?: string;
}

export interface PDFRequest {
    path: string;
    // 0-based page indices to render to full-page screenshots.
    renderPages?: number[];
}

// increase if needed
const RENDER_DPI = 50;

parentPort!.on("message", (req: PDFRequest) => {
    let msg: PDFData = {};
    try {
        const doc = mupdf.Document.openDocument(req.path);
        const pageCount = doc.countPages();

        const renderSet = new Set(
            (req.renderPages ?? []).filter(
                (i) => Number.isInteger(i) && i >= 0 && i < pageCount
            )
        );

        if (renderSet.size > 0) {
            const scale = mupdf.Matrix.scale(RENDER_DPI / 72, RENDER_DPI / 72);
            const colorSpace = mupdf.ColorSpace.DeviceRGB;
            const pages: PDFPage[] = [];
            for (const i of [...renderSet].sort((a, b) => a - b)) {
                const page = doc.loadPage(i);
                const pixmap = page.toPixmap(scale, colorSpace);
                pages.push({ index: i, png: pixmap.asPNG() });
                pixmap.destroy();
                page.destroy();
            }
            doc.destroy();
            msg = { pages, pageCount };
        } else {
            let html = "";
            const images: Uint8Array[] = [];
            for (let i = 0; i < pageCount; i++) {
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
            msg = { text: html, images, pageCount };
        }
    } catch (err) {
        msg = { error: String(err) };
    }
    parentPort!.postMessage(msg);
})
