import axios from 'axios';

const BING_API_KEY = process.env.BING_API_KEY!;

export async function webSearch(query: string) {
    const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        params: { q: query },
        headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY }
    });
    return response.data.webPages?.value || [];
}