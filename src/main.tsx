import { createMainAgent } from "./agent.js"
import { render } from "ink";
import { App } from './ui/App.js'

async function main() {
    const mainAgent = await createMainAgent();
    render(<App mainAgent={mainAgent} />);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
})
