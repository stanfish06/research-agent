import { createAgent, initChatModel } from "langchain";
import { pdfImageMiddleware } from "./pdf_middleware.js";
import { readFileTool, readPDFTool, renderPDFPagesTool, fetchPDFTool, fetchListsHNTool, fetchItemHNTool, searchQueryArxivTool } from "./tools.js";
import { promises as readline } from "node:readline";
import { stdin, stdout } from "node:process";

const SYS_PRMPT = `You are a research focused agent dedicated to find useful information from academic papers, news, blogs, and forums.
## Capabilities
- 'read_text_file': read text-based file content on a local path.
- 'read_pdf_file': parse a local PDF file and return its text as HTML plus the total page count (need to provide the local path to the PDF).
- 'render_pdf_pages': render specific pages of a local PDF to screenshots so you can see figures/tables/equations that text extraction misses (provide the local path and a list of 0-based page numbers).
- \'fetch_pdf_file\': download the pdf from the url and save it at the local path (need to provide the pdf url and the local path where the pdf will be stored).
- \'fetch_hackernews_lists\': fetch lists of story ids from the Hacker News site (e.g. top, new, best, and show stories).
- \`fetch_hackernews_story\': fetch one story item from the Hacker News site (need to provide the storyId).
- \`search_query_arxiv\': search papers on Arxiv (need to provide query term).

## PDF workflow
First call 'read_pdf_file' to get the text (HTML) and 'pageCount'. Many arXiv papers store figures as vector graphics that do NOT appear in the extracted text. When you need to SEE a figure, table, plot, or equation, call 'render_pdf_pages' with only the specific page numbers you need (0-based, from 0 to pageCount-1) — do not request every page.
`;

const model = await initChatModel("openai:gpt-5.4", {})

async function launch(agent: any) {
    const cli = readline.createInterface({
        input: stdin,
        output: stdout,
        prompt: "> "
    });
    console.log("Hello! (exit with <C-c>)\n");
    cli.prompt();

    cli.on("line", async (line: string) => {
        const input = line.trim();
        if (!input) {
            cli.prompt();
            return;
        }
        try {
            const result = await agent.invoke({
                messages: [{ role: "user", content: input }],
            });
            const content = result?.messages?.at(-1)?.content ?? result;
            console.log(`\n${typeof content === "string" ? content : JSON.stringify(content)}\n`);
        } catch (err) {
            console.error(`\nError: ${(err as Error).message}\n`);
        }
        cli.prompt();
    });
}

async function main() {
    const agent = createAgent({
        model: model,
        tools: [readFileTool, readPDFTool, renderPDFPagesTool, fetchPDFTool, fetchListsHNTool, fetchItemHNTool, searchQueryArxivTool],
        middleware: [pdfImageMiddleware],
        systemPrompt: SYS_PRMPT
    });
    launch(agent);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
})
