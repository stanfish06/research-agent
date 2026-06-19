import { fetchWithTimeout, DEFAULT_TIMEOUT } from "./utils.js"
import { XMLParser } from "fast-xml-parser";

const ARXIV_API = "https://export.arxiv.org/api/"

type ArxivPaper = {
    id: string;
    title: string;
    abstract: string;
    authors: string[];
    published: string;
    updated: string;
    pdfUrl?: string;
}

type SearchQueryResult = {
    query: string,
    papers: ArxivPaper[] | string
}

export const searchQuery = async (query: string, maxItems = 5, timeoutMS = DEFAULT_TIMEOUT): Promise<SearchQueryResult> => {
    const params = new URLSearchParams({
        search_query: `all:${query}`,
        start: "0",
        max_results: String(maxItems),
        sortBy: "relevance",
        sortOrder: "descending"
    });
    const searchUrl = ARXIV_API + "query?" + params.toString();
    const response = await fetchWithTimeout(searchUrl, timeoutMS);
    // todo: xml parsing
    return { query: "", papers: "" };
}
