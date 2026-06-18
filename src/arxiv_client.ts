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

export const searchQuery = async (query: string, maxItems = 5): Promise<SearchQueryResult> => {

}
