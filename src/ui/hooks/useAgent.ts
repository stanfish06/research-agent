import { useState } from "react";

export type ChatMessage = {
    id: number;
    role: "user" | "agent";
    text: string;
};

let messageId = 0;

export const useAgent = (agent: any) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendToAgent = async (text: string) => {
        setMessages(previousMessages => [
            ...previousMessages,
            { id: messageId++, role: "user", text },
        ]);
        setIsLoading(true);
        let response = "";
        try {
            const result = await agent.invoke({
                messages: [{ role: "user", content: text }],
            });
            const content = result?.messages?.at(-1)?.content ?? result;
            response = typeof content === "string" ? content : JSON.stringify(content);
        } catch (err) {
            response = `Error: ${(err as Error).message}`;
        } finally {
            setIsLoading(false);
        }
        setMessages(prev => [...prev, { id: messageId++, role: "agent", text: response }]);
    };

    return { messages, sendToAgent, isLoading };
};
