import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from 'firebase/database';
import type { DataSnapshot, Query } from 'firebase/database';

const appHN = initializeApp({ databaseURL: 'https://hacker-news.firebaseio.com' });
const dbHN = getDatabase(appHN);
const DEFAULT_TIMEOUT = 30000;
const handler = (snap: DataSnapshot) => snap.val();
const error_handler = () => "fetch timeout (try increase timeout)";

type ListData = number[] | string;
type HackerNewsLists = {
    topStories: ListData,
    newStories: ListData,
    bestStories: ListData,
    showStories: ListData
};

function getWithTimeout(r: Query, ms = DEFAULT_TIMEOUT): Promise<DataSnapshot> {
    return Promise.race([
        get(r),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
}

export const listHN = async (timeoutMS = DEFAULT_TIMEOUT): Promise<HackerNewsLists> => {
    const topStories = await getWithTimeout(ref(dbHN, 'v0/topstories'), timeoutMS).then(handler).catch(error_handler);
    const newStories = await getWithTimeout(ref(dbHN, 'v0/newstories'), timeoutMS).then(handler).catch(error_handler);
    const bestStories = await getWithTimeout(ref(dbHN, 'v0/beststories'), timeoutMS).then(handler).catch(error_handler);
    const showStories = await getWithTimeout(ref(dbHN, 'v0/showstories'), timeoutMS).then(handler).catch(error_handler);
    return { topStories: topStories, newStories: newStories, bestStories: bestStories, showStories: showStories };
}

export const itemHN = async (storyId: number, timeoutMS = DEFAULT_TIMEOUT): Promise<any> => {
    const res = await getWithTimeout(ref(dbHN, `v0/item/${storyId}`), timeoutMS).then(handler).catch(error_handler);
    return res;
}
