// server.js
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Allow CORS for local testing
const cors = require('cors');
app.use(cors());

// Serve static files from the current directory (if needed)
app.use(express.static('public'));

// Proxy route to fetch Gumroad products
app.get('/fetch-products', async (req, res) => {
    try {
        // Replace this URL with the correct endpoint from Gumroad
        const gumroadUrl = 'https://oscaudio.gumroad.com/';
        const response = await axios.get(gumroadUrl);
        
        // Return the fetched data (you might need to parse or filter this response based on your needs)
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching Gumroad data:', error);
        res.status(500).json({ message: 'Error fetching data from Gumroad' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
