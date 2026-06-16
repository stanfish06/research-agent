import { tool } from "langchain";
import * as z from "zod";
import { readFile } from "node:fs/promises"

const InputSchema = z.object({
    path: z.string()
});

type ReadFileResult = {
    path: string,
    content: string,
    error: string
}

const toolFunc = z.function({
    input: z.tuple([InputSchema], z.unknown()),
    output: z.unknown()
});

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

export const readTextFile = toolFunc.implementAsync(
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
