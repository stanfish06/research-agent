import { useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { useAgent } from "./hooks/useAgent.js"

export function App({ mainAgent }: { mainAgent: any }) {
    const [input, setInput] = useState("");
    const { messages, sendToAgent } = useAgent(mainAgent);
    const { stdout, write } = useStdout();
    useInput(async (inputChar, key) => {
        if (key.ctrl && inputChar === "c") {
            write("C-c again to exit");
        }
        if (key.return) {
            if (input) {
                const currentInput = input;
                setInput("");
                await sendToAgent(currentInput);
            }
        } else if (key.backspace || key.delete) {
            setInput(currentInput => currentInput.slice(0, -1));
        } else {
            setInput(currentInput => currentInput + inputChar);
        }
    })
    return (
        <>
            <Box flexDirection="column">
                <Text color="green">Hello!</Text>
                <Text dimColor>Exit with C-c</Text>
            </Box>
            <Box flexDirection="column" padding={1}>
                <Box flexDirection="column">
                    {messages.map(message => (
                        <Text key={message.id}>{message.text}</Text>
                    ))}
                </Box>

                <Box marginTop={1}>
                    <Text>❯ {input}</Text>
                </Box>
            </Box>
        </>
    )
}
