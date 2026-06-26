import { tool } from "langchain";
import * as z from "zod";
import { readFile } from "node:fs/promises"
import { isNodeError, downloadPDF } from "./utils.js"
import { listHN, itemHN } from "./firebase.js"
import { searchQuery } from "./arxiv_client.js"
import { parsePDF } from "./pdf.js"

/* ===========
    Read file
   =========== */
type ReadFileResult = {
    path: string,
    content: string,
    error: string
}

const InputSchemaPath = z.object({
    path: z.string()
});
const toolFuncPath = z.function({
    input: z.tuple([InputSchemaPath], z.unknown()),
    output: z.unknown()
});

const readTextFile = toolFuncPath.implementAsync(
    async ({ path }, ..._extraArgs): Promise<ReadFileResult> => {
        try {
            const content = await readFile(path, 'utf8');
            return { path: path, content: content, error: "" }
        } catch (error) {
            const errorMsg = isNodeError(error) ? error.message : "Unknown error"
            return { path: path, content: "", error: errorMsg }
        }
    }
)

export const readFileTool = tool(
    readTextFile,
    {
        name: "read_text_file",
        description: "read text-based file content on a local path.",
        schema: InputSchemaPath
    }
)

const readPDFFile = toolFuncPath.implementAsync(
    async ({ path }, ..._extraArgs): Promise<ReadFileResult> => {
        const data = await parsePDF(path);
        if (data.error) return { path, content: "", error: data.error };
        const images = (data.images ?? []).map((buf: Uint8Array) =>
            `data:image/png;base64,${Buffer.from(buf).toString("base64")}`
        );
        const content = JSON.stringify({
            html: data.text ?? "",
            images,
            pageCount: data.pageCount ?? 0,
        });
        return { path, content, error: "" };
    }
)
export const readPDFTool = tool(
    readPDFFile,
    {
        name: "read_pdf_file",
        description: "Parse a local PDF and return its text as HTML plus the total page count (`pageCount`). Vector figures/tables/equations are often NOT captured in the text — to actually see them, follow up with `render_pdf_pages` for the relevant page numbers. Provide the local path to the PDF.",
        schema: InputSchemaPath
    }
)

const InputSchemaRenderPDF = z.object({
    path: z.string(),
    pages: z.array(z.number())
})
const toolFuncRenderPDF = z.function({
    input: z.tuple([InputSchemaRenderPDF], z.unknown()),
    output: z.unknown()
});

const renderPDFPages = toolFuncRenderPDF.implementAsync(
    async ({ path, pages }, ..._extraArgs): Promise<ReadFileResult> => {
        const data = await parsePDF(path, pages);
        if (data.error) return { path, content: "", error: data.error };
        const rendered = (data.pages ?? []).map((p) => ({
            index: p.index,
            url: `data:image/png;base64,${Buffer.from(p.png).toString("base64")}`,
        }));
        if (rendered.length === 0) {
            const count = data.pageCount ?? 0;
            return {
                path,
                content: "",
                error: `No pages rendered. Document has ${count} page(s); valid 0-based page numbers are 0..${Math.max(count - 1, 0)}.`,
            };
        }
        const content = JSON.stringify({ pages: rendered, pageCount: data.pageCount ?? 0 });
        return { path, content, error: "" };
    }
)
export const renderPDFPagesTool = tool(
    renderPDFPages,
    {
        name: "render_pdf_pages",
        description: "Render specific pages of a local PDF to full-page screenshots so you can SEE figures, tables, equations, or vector graphics that text extraction misses. Provide the local `path` and `pages`: a list of 0-based page numbers (0 to pageCount-1, where pageCount comes from read_pdf_file). Request only the pages you actually need.",
        schema: InputSchemaRenderPDF
    }
)

/* ===========
    Web fetch
   =========== */
type FetchUrlResult = {
    url: string,
    content: any,
    error: string
};

const InputSchemaFetchPDF = z.object({
    url: z.url(),
    path: z.string(),
    fetchTimeoutMillisecond: z.number()
});
const toolFuncFetchPDF = z.function({
    input: z.tuple([InputSchemaFetchPDF], z.unknown()),
    output: z.unknown()
});

const fetchPDF = toolFuncFetchPDF.implementAsync(
    async ({ path, url, fetchTimeoutMillisecond }, ..._extraArgs): Promise<FetchUrlResult> => {
        try {
            await downloadPDF(url, path, fetchTimeoutMillisecond);
            return { url, content: `Saved PDF to ${path}`, error: "" };
        } catch (err) {
            return { url, content: "", error: String(err) };
        }
    }
)
export const fetchPDFTool = tool(
    fetchPDF,
    {
        name: "fetch_pdf",
        description: "download the pdf from the url and save it at the local path (need to provide the pdf url and the local path where the pdf will be stored)",
        schema: InputSchemaFetchPDF
    }
)

/* ==================
    Fetch HackerNews
   ================== */

const InputSchemaHNList = z.object({
    fetchTimeoutMillisecond: z.number()
})
const toolFuncHNList = z.function({
    input: z.tuple([InputSchemaHNList], z.unknown()),
    output: z.unknown()
});

const InputSchemaHNStory = z.object({
    storyId: z.number(),
    fetchTimeoutMillisecond: z.number()
})
const toolFuncHNStory = z.function({
    input: z.tuple([InputSchemaHNStory], z.unknown()),
    output: z.unknown()
});

const fetchListsHN = toolFuncHNList.implementAsync(
    async ({ fetchTimeoutMillisecond }, ..._extraArgs): Promise<FetchUrlResult> => {
        const HackerNewsLists = await listHN(fetchTimeoutMillisecond);
        return { url: "https://news.ycombinator.com/", content: HackerNewsLists, error: "" };
    }
)

const fetchItemHN = toolFuncHNStory.implementAsync(
    async ({ storyId, fetchTimeoutMillisecond }, ..._extraArgs): Promise<FetchUrlResult> => {
        const HackerNewsStory = await itemHN(storyId, fetchTimeoutMillisecond);
        return { url: "https://news.ycombinator.com/", content: HackerNewsStory, error: "" };
    }
)

export const fetchListsHNTool = tool(
    fetchListsHN,
    {
        name: "fetch_hackernews_lists",
        description: "fetch lists of story ids from the Hacker News site (e.g. top, new, best, and show stories)",
        schema: InputSchemaHNList
    }
)

export const fetchItemHNTool = tool(
    fetchItemHN,
    {
        name: "fetch_hackernews_story",
        description: `fetch one story item from the Hacker News site (need to provide the storyId)
 All items have some of the following properties:
 Field | Description
 ------|------------
 id | The item's unique id.
 deleted | true if the item is deleted.
 type | The type of item. One of "job", "story", "comment", "poll", or "pollopt".
 by | The username of the item's author.
 time | Creation date of the item, in [Unix Time](http://en.wikipedia.org/wiki/Unix_time).
 text | The comment, story or poll text. HTML.
 dead | true if the item is dead.
 parent | The comment's parent: either another comment or the relevant story.
 poll | The pollopt's associated poll.
 kids | The ids of the item's comments, in ranked display order.
 url | The URL of the story.
 score | The story's score, or the votes for a pollopt.
 title | The title of the story, poll or job. HTML.
 parts | A list of related pollopts, in display order.
 descendants | In the case of stories or polls, the total comment count.`,
        schema: InputSchemaHNStory
    }
)

/* =============
    Fetch Arxiv
   ============= */
const InputSchemaArxiv = z.object({
    query: z.string(),
    maxQueryItems: z.number(),
    fetchTimeoutMillisecond: z.number()
})
const toolFuncArxiv = z.function({
    input: z.tuple([InputSchemaArxiv], z.unknown()),
    output: z.unknown()
});

const searchQueryArxiv = toolFuncArxiv.implementAsync(
    async ({ query, maxQueryItems, fetchTimeoutMillisecond }, ..._extraArgs): Promise<FetchUrlResult> => {
        const result = await searchQuery(query, maxQueryItems, fetchTimeoutMillisecond);
        return { url: "https://arxiv.org/", content: result, error: "" };
    }
)
export const searchQueryArxivTool = tool(
    searchQueryArxiv,
    {
        name: "search_query_arxiv",
        description: "search papers on Arxiv (need to provide query term)",
        schema: InputSchemaArxiv
    }
)
