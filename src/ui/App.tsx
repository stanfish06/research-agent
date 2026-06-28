import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useAgent, type ChatMessage } from "./hooks/useAgent.js";

export function App({ mainAgent }: { mainAgent: any }) {
    const [input, setInput] = useState("");
    const { messages, sendToAgent, isLoading } = useAgent(mainAgent);

    useInput((inputChar, key) => {
        if (key.return) {
            const value = input.trim();
            if (value && !isLoading) {
                setInput("");
                void sendToAgent(value);
            }
            return;
        }
        if (key.backspace || key.delete) {
            setInput(prev => prev.slice(0, -1));
            return;
        }
        if (key.ctrl || key.meta || !inputChar) {
            return;
        }
        setInput(prev => prev + inputChar);
    });

    return (
        <Box flexDirection="column" padding={1}>
            <Box flexDirection="column" marginBottom={1}>
                <Text bold color="green">🔬 Research Agent</Text>
                <Text dimColor>
                    Ask me to fetch &amp; summarize news, articles, or papers · Exit with Ctrl+C
                </Text>
            </Box>

            <Box flexDirection="column">
                {messages.map(message => (
                    <MessageView key={message.id} message={message} />
                ))}
                {isLoading && (
                    <Box marginTop={1}>
                        <Text color="yellow">⏺ thinking…</Text>
                    </Box>
                )}
            </Box>

            <Box
                marginTop={1}
                borderStyle="round"
                borderColor={isLoading ? "gray" : "cyan"}
                paddingX={1}
            >
                <Text color="cyan">❯ </Text>
                <Text>{input}</Text>
                <Text inverse> </Text>
            </Box>
        </Box>
    );
}

function MessageView({ message }: { message: ChatMessage }) {
    if (message.role === "user") {
        return (
            <Box marginTop={1}>
                <Box backgroundColor="blue" paddingX={1}>
                    <Text color="white" bold>You </Text>
                    <Text color="white">{message.text}</Text>
                </Box>
            </Box>
        );
    }
    return (
        <Box marginTop={1}>
            <Text color="green">⏺ </Text>
            <Text>{message.text}</Text>
        </Box>
    );
}
