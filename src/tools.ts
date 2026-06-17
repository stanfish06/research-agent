import { tool } from "langchain";
import * as z from "zod";
import { readFile } from "node:fs/promises"
import { isNodeError } from "./utils.js"
import { listHN } from "./firebase.js"

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

/* ===========
    Web fetch
   =========== */
type FetchUrlResult = {
    url: string,
    content: any,
    error: string
};

/* ==================
    Fetch HackerNews 
   ================== */

const fetchListsHN = toolFunc.implementAsync(
    async ({ fetchTimeoutMillisecond }, ..._extraArgs): Promise<FetchUrlResult> => {
        const HackerNewsLists = await listHN(fetchTimeoutMillisecond);
        return { url: "https://news.ycombinator.com/", content: HackerNewsLists, error: "" };
    }
)

export const fetchListsHNTool = tool(
    fetchListsHN,
    {
        name: "fetch_hackernews_lists",
        description: "fetch lists of story ids from the Hacker News site (e.g. top, new, best, and show stories)",
        schema: InputSchema
    }
)
