import assert from "node:assert/strict";
import { parseDhruProducts, requestDhruProducts } from "./dhru";

const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<RESPONSE>
  <STATUS>4</STATUS>
  <MESSAGE>SUCCESS</MESSAGE>
  <PRODUCTS>
    <PRODUCT ID="101">
      <NAME>IMEI Unlock</NAME>
      <PRICE>2.5</PRICE>
      <DESCRIPTION>Standard unlock service</DESCRIPTION>
    </PRODUCT>
    <PRODUCT>
      <PRODUCT_ID>202</PRODUCT_ID>
      <PRODUCT_NAME>Server Service</PRODUCT_NAME>
      <RATE>4</RATE>
    </PRODUCT>
  </PRODUCTS>
</RESPONSE>`;

const products = parseDhruProducts(responseXml);
assert.equal(products.length, 2);
assert.equal(products[0]?.["id"], "101");
assert.equal(products[0]?.["name"], "IMEI Unlock");
assert.equal(products[0]?.["price"], 2.5);
assert.equal(products[1]?.["id"], "202");
assert.equal(products[1]?.["name"], "Server Service");
assert.equal(products[1]?.["price"], 4);

assert.throws(
  () => parseDhruProducts("<RESPONSE><STATUS>3</STATUS><MESSAGE>Denied</MESSAGE></RESPONSE>"),
  /Dhru rejected the product request/,
);
assert.throws(() => parseDhruProducts("<html>not XML</html>"), /HTML instead of XML/);

async function verifyDhruRequest() {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(responseXml, { status: 200, headers: { "Content-Type": "application/xml" } });
  };

  try {
    const result = await requestDhruProducts(
      "https://merchant.example/",
      "key with & symbol",
      "merchant user",
    );

    assert.equal(requestUrl, "https://merchant.example/api/reseller/v1/products");
    assert.equal(requestInit?.method, "POST");
    const headers = new Headers(requestInit?.headers);
    assert.equal(headers.get("content-type"), "application/x-www-form-urlencoded");
    assert.equal(headers.get("authorization"), null);
    assert.deepEqual(
      Object.fromEntries(new URLSearchParams(String(requestInit?.body))),
      { key: "key with & symbol", username: "merchant user", action: "product" },
    );
    assert.equal(result.products.length, 2);
    assert.equal(result.httpStatus, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void verifyDhruRequest().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});