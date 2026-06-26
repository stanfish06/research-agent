import { createMiddleware } from "langchain";
import { Command } from "@langchain/langgraph";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";

type RenderedPage = { index: number; url: string };
type ParsedPDF = {
    html?: string;
    images?: string[];
    pages?: RenderedPage[];
    pageCount?: number;
};

const parseToolContent = (raw: unknown): ParsedPDF | null => {
    if (typeof raw !== "string") return null;
    try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object") return obj as ParsedPDF;
    } catch { /* not JSON — plain text tool result */ }
    return null;
};

type ImageBlock =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

const PDF_TOOLS = new Set(["read_pdf_file", "render_pdf_pages"]);

/**
 * ToolMessage content is text-only for OpenAI/Claude, so image data URLs returned
 * by the PDF tools can't be seen by the model directly. This middleware strips the
 * image payloads out of the ToolMessage and re-injects them as a follow-up
 * HumanMessage with image_url blocks the model can actually look at.
 *
 *   - read_pdf_file    -> embedded raster images (figures stored as bitmaps)
 *   - render_pdf_pages -> full-page screenshots the agent explicitly requested
 *                         (the fallback for vector figures), each labeled w/ page no.
 */
export const pdfImageMiddleware = createMiddleware({
    name: "PDFImageMiddleware",
    wrapToolCall: async (request, handler) => {
        const result = await handler(request);
        const toolName = request.toolCall.name;
        if (!(result instanceof ToolMessage) || !PDF_TOOLS.has(toolName)) {
            return result;
        }

        const parsed = parseToolContent(result.content);
        if (!parsed) return result;

        const blocks: ImageBlock[] = [];

        if (toolName === "read_pdf_file" && parsed.images?.length) {
            blocks.push({ type: "text", text: "Embedded images extracted from the PDF:" });
            for (const url of parsed.images) {
                blocks.push({ type: "image_url", image_url: { url } });
            }
        }

        if (toolName === "render_pdf_pages" && parsed.pages?.length) {
            for (const page of parsed.pages) {
                blocks.push({ type: "text", text: `PDF page ${page.index}:` });
                blocks.push({ type: "image_url", image_url: { url: page.url } });
            }
        }

        if (blocks.length === 0) return result;

        // Replace the image-bearing tool content with a slim text-only ToolMessage
        // (keeps the message history light) and append the images as a HumanMessage.
        const slim: Record<string, unknown> = {};
        if (parsed.html !== undefined) slim.html = parsed.html;
        if (parsed.pageCount !== undefined) slim.pageCount = parsed.pageCount;

        const textMsg = new ToolMessage({
            content: JSON.stringify(slim),
            tool_call_id: result.tool_call_id,
            ...(result.name ? { name: result.name } : {}),
        });
        const imageMsg = new HumanMessage({ content: blocks });
        return new Command({ update: { messages: [textMsg, imageMsg] } });
    },
});
