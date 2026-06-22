import { createAgent, initChatModel } from "langchain";
import { readFileTool, fetchListsHNTool, fetchItemHNTool, searchQueryArxivTool } from "./tools.js";
import { promises as readline } from "node:readline";
import { stdin, stdout } from "node:process";

const SYS_PRMPT = `You are a research focused agent dedicated to find useful information from academic papers, news, blogs, and forums.
## Capabilities
- \'read_text_file\': read text-based file content on a local path.
- \'fetch_hackernews_lists\': fetch lists of story ids from the Hacker News site (e.g. top, new, best, and show stories).
- \`fetch_hackernews_story\': fetch one story item from the Hacker News site (need to provide the storyId).
- \`search_query_arxiv\': search papers on Arxiv (need to provide query term).
`;

const model = await initChatModel("gpt-5.4-mini", {})

function printMsg(msg: string, commandInterface: readline.Interface, output: readline.Readline) {
    output.cursorTo(0);
    output.clearLine(0);
    console.log(msg);
    commandInterface.prompt();
}

function launch(agent: any) {
    const cli = readline.createInterface({
        input: stdin,
        output: stdout,
        prompt: "> "
    });
    const rl = new readline.Readline(stdout);
    printMsg("Hello! (exit with <C-c>)", cli, rl);
}

async function main() {
    const agent = createAgent({
        model: model,
        tools: [readFileTool, fetchListsHNTool, fetchItemHNTool, searchQueryArxivTool],
        systemPrompt: SYS_PRMPT
    });
    launch(agent);

    // console.log(
    //     await agent.invoke({
    //         messages: [{ role: "user", content: "Use read_text_file to read test.txt and report its content" }],
    //     })
    // );
    //
    // console.log(
    //     await agent.invoke({
    //         messages: [{ role: "user", content: "Use fetch_hackernews_lists to get lists of store ids, pick and report some story ids from each list." }],
    //     })
    // );
    //
    // console.log(
    //     await agent.invoke({
    //         messages: [{ role: "user", content: "fetch the content of a random top story on the Hacker News site" }],
    //     })
    // );
    //
    // console.log(
    //     await agent.invoke({
    //         messages: [{ role: "user", content: "fetch 3 papers on the Arxiv site related to limit cycle" }],
    //     })
    // );
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
})
