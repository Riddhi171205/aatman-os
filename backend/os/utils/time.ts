import axios from 'axios';
import express from 'express';

const app = express();
app.use(express.json());

// Fetch IST from an API (accurate, independent of server clock)
export async function fetchIndianTimeFromAPI(): Promise<string> {
    const res = await axios.get('https://worldtimeapi.org/api/timezone/Asia/Kolkata');
    return res.data.datetime; // ISO string in IST
}

// Get IST using server clock (make sure your server time is correct)
export function getIndianTimeString(): string {
    return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

// Example usage:
// fetchIndianTimeFromAPI().then(console.log);
// console.log(getIndianTimeString()); // e.g., "17/5/2026, 10:45:12 pm"

app.post('/api/voice', async (req, res) => {
    try {
        const { text } = req.body;

        // Here you would add the code to process the voice request
        // For now, let's just return the text back as a response
        res.json({ receivedText: text, time: await fetchIndianTimeFromAPI() });
    } catch (error) {
        console.error('Error handling /api/voice:', error);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});