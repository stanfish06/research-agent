import { useEffect } from "react";
import { Box, render, Text, useInput } from "ink";

function App() {
    return (
        <Box flexDirection="column">
            <Text color="green">Hello!</Text>
            <Text dimColor>Exit with C-c.</Text>
        </Box>
    )
}

render(<App />);
