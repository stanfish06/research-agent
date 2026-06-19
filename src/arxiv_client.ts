import { fetchWithTimeout, asArray, DEFAULT_TIMEOUT } from "./utils.js"
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
    const response = await fetchWithTimeout(searchUrl, timeoutMS).then(
        (response) => {
            if (!response.ok) {
                throw new Error(`${response.status}`);
            }
            return response.text();
        }
    );
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const feed = parser.parse(response).feed;
    const papers = asArray(feed?.entry).map((entry: any): ArxivPaper => {
        const pdfLink = asArray(entry.link).find(
            (link: any) => link?.["@_title"] === "pdf"
        );
        return {
            id: entry.id,
            title: entry.title,
            abstract: entry.summary,
            authors: asArray(entry.author).map(
                (author: any) => author.name
            ),
            published: entry.published,
            updated: entry.updated,
            pdfUrl: pdfLink?.["@_href"]
        }
    })
    return { query: query, papers: papers };
}
