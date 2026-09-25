import assert from "node:assert/strict";
import { slugifyServiceName, uniqueServiceSlug } from "./slug";

assert.equal(slugifyServiceName("Octopus LG 3 Months", "294"), "octopus-lg-3-months");
assert.equal(slugifyServiceName("Mina A12+ Bypass", "21"), "mina-a12-bypass");
assert.equal(slugifyServiceName("小米", "service-21"), "product-service-21");

assert.equal(
  uniqueServiceSlug("Octopus LG 3 Months", "294", new Set()),
  "octopus-lg-3-months",
);
assert.equal(
  uniqueServiceSlug("Octopus LG 3 Months", "294", new Set(["octopus-lg-3-months"])),
  "octopus-lg-3-months-294",
);
assert.equal(
  uniqueServiceSlug(
    "Octopus LG 3 Months",
    "294",
    new Set(["octopus-lg-3-months", "octopus-lg-3-months-294"]),
  ),
  "octopus-lg-3-months-2",
);