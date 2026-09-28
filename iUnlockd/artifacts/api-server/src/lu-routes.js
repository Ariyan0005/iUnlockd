const express = require('express');
const lu = require('./legitunlocks');
const router = express.Router();
let cache = null, cacheTime = null;
const TTL = 10 * 60 * 1000;
router.get('/services', async (req, res) => {
  try {
    if (cache && cacheTime && Date.now() - cacheTime < TTL) return res.json({ source: 'cache', data: cache });
    cache = await lu.getServices(); cacheTime = Date.now();
    res.json({ source: 'live', data: cache });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
router.get('/balance', async (req, res) => {
  try { res.json({ data: await lu.getBalance() }); }
  catch (e) { res.status(502).json({ error: e.message }); }
});
router.post('/order', async (req, res) => {
  const { service, link, quantity } = req.body;
  if (!service || !link) return res.status(400).json({ error: 'service এবং link আবশ্যক' });
  try { res.json({ data: await lu.placeOrder({ service, link, quantity }) }); }
  catch (e) { res.status(502).json({ error: e.message }); }
});
router.get('/order/:id', async (req, res) => {
  try { res.json({ data: await lu.getOrderStatus(req.params.id) }); }
  catch (e) { res.status(502).json({ error: e.message }); }
});
router.post('/sync', async (req, res) => {
  try {
    cache = null; cacheTime = null;
    cache = await lu.getServices(); cacheTime = Date.now();
    const count = Array.isArray(cache) ? cache.length : Object.keys(cache).length;
    res.json({ message: count + ' টি service sync হয়েছে', data: cache });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
module.exports = router;
