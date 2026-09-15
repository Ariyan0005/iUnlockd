import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.get("/products", async (_req: Request, res: Response) => {
  const url = process.env.MERCHANT_API_URL;
  const token = process.env.MERCHANT_API_KEY;
  if (!url || !token) {
    res.status(500).json({ error: "MERCHANT_API_URL or MERCHANT_API_KEY not set" });
    return;
  }
  const response = await fetch(`${url}/api/reseller/v1/products`, {
    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
  });
  const data = await response.json();
  res.status(response.status).json(data);
});

export default router;
