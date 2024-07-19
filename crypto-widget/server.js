const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Replace with your Etherscan API key
const ETHERSCAN_API_KEY = 'BD7S98PQSMISNY4N281QS7PAC6V5NRF8PS';

app.use(express.static('public'));

app.get('/api/calculate-fee', async (req, res) => {
    const { crypto, amount } = req.query;

    if (!crypto || !amount) {
        return res.status(400).json({ error: 'Crypto and amount are required' });
    }

    try {
        let feeRate;
        if (crypto === 'bitcoin') {
            const response = await axios.get('https://api.blockchain.info/mempool/fees');
            feeRate = response.data.fastestFee;
        } else if (crypto === 'ethereum') {
            const response = await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`);
            feeRate = response.data.result.FastGasPrice / 10; // Convert Gwei to Ether
        }

        if (feeRate == null) {
            return res.status(500).json({ error: 'Failed to fetch fee rate' });
        }

        const fee = (crypto === 'bitcoin') ? (amount * feeRate) / 1000 : amount * feeRate; // Simplified calculation
        res.json({ fee });
    } catch (error) {
        console.error('Error fetching fee:', error);
        res.status(500).json({ error: 'Error fetching fee' });
    }
});

app.get('/api/tx-status', async (req, res) => {
    const { crypto, txID } = req.query;

    if (!crypto || !txID) {
        return res.status(400).json({ error: 'Crypto and txID are required' });
    }

    try {
        let response, status;
        if (crypto === 'bitcoin') {
            response = await axios.get(`https://api.blockcypher.com/v1/btc/main/txs/${txID}`);
            status = response.data.confirmations > 0 ? 'Confirmed' : 'Pending';
        } else if (crypto === 'ethereum') {
            response = await axios.get(`https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=${txID}&apikey=${ETHERSCAN_API_KEY}`);
            status = response.data.result.isError === '0' ? 'Confirmed' : 'Pending';
        }

        if (!response || !status) {
            return res.status(500).json({ error: 'Failed to fetch transaction status' });
        }

        res.json({ status });
    } catch (error) {
        console.error('Error fetching transaction status:', error);
        res.status(500).json({ error: 'Error fetching transaction status' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
