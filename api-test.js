const axios = require('axios');

async function testConnection() {
    try {
        const FULL_URL = 'https://legitunlocks.com';

        console.log("Requesting via Axios:", FULL_URL);

        const response = await axios.get(FULL_URL, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            maxRedirects: 5
        });

        console.log("HTTP Status:", response.status);
        console.log("--- Server Response ---");
        
        const dataString = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
        console.log(dataString.substring(0, 1000));
    } catch (error) {
        console.error("Script Error:", error.message);
    }
}

testConnection();
