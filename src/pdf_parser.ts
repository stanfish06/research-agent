import { parentPort } from "node:worker_threads";
import * as mupdf from "mupdf";

type PDFData = {
    text: string;
    images: any[];
}

const doc = mupdf.Document.openDocument(path);
