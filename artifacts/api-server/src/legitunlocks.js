const https = require('https');
const http = require('http');
const BASE_URL = process.env.LEGITUNLOCKS_API_URL || 'https://www.legitunlocks.com/api';
const API_KEY = process.env.LEGITUNLOCKS_API_KEY;
const API_USER = process.env.LEGITUNLOCKS_API_USER;
function apiCall(params) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) return reject(new Error('API_KEY not set'));
    const payload = { key: API_KEY, ...params };
    if (API_USER) payload.username = API_USER;
    const body = new URLSearchParams(payload).toString();
    const url = new URL(BASE_URL);
    const options = {
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    };
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { const json = JSON.parse(data); if (json.error) return reject(new Error(json.error)); resolve(json); }
        catch (e) { reject(new Error('Parse error: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}
async function getServices() { return apiCall({ action: 'services' }); }
async function getBalance() { return apiCall({ action: 'balance' }); }
async function placeOrder({ service, link, quantity }) { return apiCall({ action: 'add', service, link, quantity: quantity || 1 }); }
async function getOrderStatus(id) { return apiCall({ action: 'status', order: id }); }
module.exports = { getServices, getBalance, placeOrder, getOrderStatus };
