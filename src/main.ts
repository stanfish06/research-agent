import { createAgent, tool } from "langchain";
import * as z from "zod";
import fs from "fs"

const SYS_PRMPT = `You are a data assistant

## Capabilities

- \'read_file\': read file content on a local path
`;

const readFile = tool(
    async ({ path }) => fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
            return `Failed to read ${path}`
        } else {
            return data
        }
    }),
    {
        name: "read_file",
        description: "read file content on a local path.",
        schema: z.object({ path: z.string() })
    }
)

const agent = createAgent({
  model: "gpt-5.4-mini",
  tools: [readFile],
});

console.log(
  await agent.invoke({
    messages: [{ role: "user", content: "Whats in ./package.json" }],
  })
);
