import { createAgent } from "langchain";
import { readTextFile, readFileTool } from "./tools.js";

const SYS_PRMPT = `You are a coding agent
## Capabilities
- \'read_text_file\': read text-based file content on a local path.
`;

const agent = createAgent({
  model: "gpt-5.4-mini",
  tools: [readFileTool],
  systemPrompt: SYS_PRMPT
});

console.log(
    await readTextFile({ path: "./test.txt" })
);

console.log(
  await agent.invoke({
    messages: [{ role: "user", content: "Use read_text_file to read test.txt and report its content" }],
  })
);

console.log(
  await agent.invoke({
    messages: [{ role: "user", content: "Use read_text_file to read test_test.txt and report its content" }],
  })
);
