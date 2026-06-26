import { tool } from "langchain";
import * as z from "zod";
import { readFile } from "node:fs/promises"
import { isNodeError, downloadPDF } from "./utils.js"
import { listHN, itemHN } from "./firebase.js"
import { searchQuery } from "./arxiv_client.js"
import { parsePDF } from "./pdf.js"

const InputSchema = z.object({
    // local related input
    path: z.string(),
    // web related inputs
    url: z.url(),
    fetchTimeoutMillisecond: z.number()
});

const toolFunc = z.function({
    input: z.tuple([InputSchema], z.unknown()),
    output: z.unknown()
});

/* ===========
    Read file 
   =========== */
type ReadFileResult = {
    path: string,
    content: string,
    error: string
}

const readTextFile = toolFunc.implementAsync(
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
        schema: InputSchema
    }
)

const readPDFFile = toolFunc.implementAsync(
    async ({ path }, ..._extraArgs): Promise<ReadFileResult> => {
        const data = await parsePDF(path);
        if (data.error) return { path, content: "", error: data.error };
        const images = (data.images ?? []).map((buf: Uint8Array) =>
            `data:image/png;base64,${Buffer.from(buf).toString("base64")}`
        );
        const content = JSON.stringify({ html: data.text ?? "", images });
        return { path, content, error: "" };
    }
)
export const readPDFTool = tool(
    readPDFFile,
    {
        name: "read_pdf_file",
        description: "parse a local PDF file and return its text as HTML (need to provide the local path to the PDF)",
        schema: InputSchema
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

const fetchPDF = toolFunc.implementAsync(
    async ({ path, url, fetchTimeoutMillisecond }, ..._extraArgs): Promise<FetchUrlResult> => {
        downloadPDF(url, path, fetchTimeoutMillisecond);
        return { url: url, content: "", error: "" };
    }
)
export const fetchPDFTool = tool(
    fetchPDF,
    {
        name: "fetch_pdf",
        description: "download the pdf from the url and save it at the local path (need to provide the pdf url and the local path where the pdf will be stored)",
        schema: InputSchema
    }
)

/* ==================
    Fetch HackerNews 
   ================== */

// HN specific input schema and toolFunc
const InputSchemaHN = InputSchema.extend({
    storyId: z.number()
})
const toolFuncHN = z.function({
    input: z.tuple([InputSchemaHN], z.unknown()),
    output: z.unknown()
});

const fetchListsHN = toolFuncHN.implementAsync(
    async ({ fetchTimeoutMillisecond }, ..._extraArgs): Promise<FetchUrlResult> => {
        const HackerNewsLists = await listHN(fetchTimeoutMillisecond);
        return { url: "https://news.ycombinator.com/", content: HackerNewsLists, error: "" };
    }
)

const fetchItemHN = toolFuncHN.implementAsync(
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
        schema: InputSchemaHN
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
        schema: InputSchemaHN
    }
)

/* =============
    Fetch Arxiv
   ============= */
const InputSchemaArxiv = InputSchema.extend({
    query: z.string(),
    maxQueryItems: z.number()
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

