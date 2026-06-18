import { createAgent, initChatModel } from "langchain";
import { readFileTool, fetchListsHNTool, fetchItemHNTool } from "./tools.js";

const SYS_PRMPT = `You are a research focused agent dedicated to find useful information from academic papers, news, blogs, and forums.
## Capabilities
- \'read_text_file\': read text-based file content on a local path.
- \'fetch_hackernews_lists\': fetch lists of story ids from the Hacker News site (e.g. top, new, best, and show stories).
- \`fetch_hackernews_story\': fetch one story item from the Hacker News site (need to provide the storyId).
`;

const model = await initChatModel("gpt-5.4-mini", {})

async function main() {
    const agent = createAgent({
        model: model,
        tools: [readFileTool, fetchListsHNTool, fetchItemHNTool],
        systemPrompt: SYS_PRMPT
    });

    console.log(
        await agent.invoke({
            messages: [{ role: "user", content: "Use read_text_file to read test.txt and report its content" }],
        })
    );

    console.log(
        await agent.invoke({
            messages: [{ role: "user", content: "Use fetch_hackernews_lists to get lists of store ids, pick and report some story ids from each list." }],
        })
    );

    console.log(
        await agent.invoke({
            messages: [{ role: "user", content: "fetch the content of a random top story on the Hacker News site" }],
        })
    );
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
})
