import { useState } from "react";
let messageId = 0;
export const useAgent = (agent: any) => {
    const [messages, setMessages] = useState<
        Array<{
            id: number;
            text: string;
        }>
    >([]);
    const sendToAgent = async (text: string) => {
        setMessages(previousMessages => [
            ...previousMessages,
            {
                id: messageId++,
                text: text,
            },
        ]);
        let response = "";
        try {
            const result = await agent.invoke({
                messages: [{ role: "user", content: text }],
            });
            const content = result?.messages?.at(-1)?.content ?? result;
            response = `${typeof content === "string" ? content : JSON.stringify(content)}\n`;
        } catch (err) {
            response = `Error: ${(err as Error).message}\n`;
        }
        setMessages(prev => [...prev, { id: messageId++, text: `\n⏺ ` + response }]);
    }
    return { messages, sendToAgent };
}

