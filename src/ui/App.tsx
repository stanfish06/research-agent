import { useEffect, useState } from "react";
import { Box, render, Text, Static, useInput, useStdout } from "ink";

let messageId = 0;

function App() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<
        Array<{
            id: number;
            text: string;
        }>
    >([]);
    const { stdout, write } = useStdout();
    useInput((inputChar, key) => {
        if (key.ctrl && inputChar === "c") {
            write("C-c again to exit");
        }
        if (key.return) {
            if (input) {
                setMessages(previousMessages => [
                    ...previousMessages,
                    {
                        id: messageId++,
                        text: `${input}`,
                    },
                ]);
                setInput("");
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

// render(<App />, { exitOnCtrlC: false });
render(<App />);
