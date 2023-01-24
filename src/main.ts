import "../setup-env.js";
import { main } from "./outages.js";

const SITE_ID = "norwich-pear-tree";
const OUTAGE_FILTER_AFTER = Date.parse("2022-01-01T00:00:00.000Z");

await main(SITE_ID, OUTAGE_FILTER_AFTER);
