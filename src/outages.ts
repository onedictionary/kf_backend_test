import { retryAsync } from "ts-retry";

// Types
interface Outage {
  id: string;
  begin: string;
  end: string;
}

interface EnhancedOutage extends Outage {
  name: string;
}

interface SiteInfo {
  id: string;
  name: string;
  devices: Device[];
}

interface Device {
  id: string;
  name: string;
}

// Environment Variables
const BASE_PATH = process.env.BASE_PATH;
const API_KEY = process.env.API_KEY;

if (API_KEY === undefined) {
  throw new Error("API_KEY environment variable is undefined");
}
if (BASE_PATH === undefined) {
  throw new Error("BASE_PATH environment variable is undefined");
}

// API calls
export const getAllOutages = async (): Promise<Outage[]> => {
  const res = await fetch(`${BASE_PATH}outages`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (res.status === 200) {
    return await res.json();
  } else if (res.status === 403) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\nCheck if API_KEY is correct`
    );
  } else if (res.status === 429) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\nAPI key limit exceeded`
    );
  } else {
    throw new Error(
      `HTTP status error! Status: ${res.status} ${res.statusText}`
    );
  }
};

export const getSiteInfo = async (siteId: string): Promise<SiteInfo> => {
  const res = await fetch(`${BASE_PATH}site-info/${siteId}`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (res.status === 200) {
    return await res.json();
  } else if (res.status === 403) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\nCheck if API_KEY is correct`
    );
  } else if (res.status === 404) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\n${siteId} does not exist`
    );
  } else if (res.status === 429) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\nAPI key limit exceeded`
    );
  } else {
    throw new Error(
      `HTTP status error! Status: ${res.status} ${res.statusText}`
    );
  }
};

export const sendEnhancedOutages = async (
  siteId: string,
  outages: EnhancedOutage[]
): Promise<void> => {
  const res = await fetch(`${BASE_PATH}site-outages/${siteId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(outages),
  });

  if (res.status === 403) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\nCheck if API_KEY is correct`
    );
  } else if (res.status === 404) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\n${siteId} does not exist`
    );
  } else if (res.status === 429) {
    throw new Error(
      `HTTP error! Status: ${res.status} ${res.statusText}\nAPI key limit exceeded`
    );
  } else if (!res.ok) {
    throw new Error(
      `HTTP status error! Status: ${res.status} ${res.statusText}`
    );
  }
};

// Other functions
export const enhanceOutages = (
  outages: Outage[],
  siteInfo: SiteInfo,
  outageFilterAfter: number
): EnhancedOutage[] => {
  const siteDeviceIdAndNames = new Map(
    siteInfo.devices.map((device) => [device.id, device.name])
  );

  const enhancedOutages = outages
    .filter(
      (outage) =>
        Date.parse(outage.begin) >= outageFilterAfter &&
        siteDeviceIdAndNames.has(outage.id)
    )
    .map((outage) => {
      return { ...outage, name: siteDeviceIdAndNames.get(outage.id)! };
    });
  return enhancedOutages;
};

export const main = async (
  siteId: string,
  outageFilterAfter: number
): Promise<void> => {
  // const outages = await getAllOutages();
  const outages = await retryAsync(getAllOutages, { maxTry: 5 });
  console.log("Got all outages");

  // const siteInfo = await getSiteInfo(siteId);
  const siteInfo = await retryAsync(async () => await getSiteInfo(siteId), {
    maxTry: 5,
  });
  console.log("Got site info");

  const enhancedOutages = enhanceOutages(outages, siteInfo, outageFilterAfter);
  console.log(JSON.stringify(enhancedOutages, null, 4));
  console.log("Filtered and enhance outages");

  // await sendEnhancedOutages(siteId, enhancedOutages);
  await retryAsync(
    async () => {
      await sendEnhancedOutages(siteId, enhancedOutages);
    },
    {
      maxTry: 5,
    }
  );
  console.log("Sent enhanced outages");
  console.log("Done");
};
