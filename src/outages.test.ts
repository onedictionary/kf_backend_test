import { enhanceOutages, getAllOutages, getSiteInfo, main } from "./outages";

// Test data
const outages = [
  {
    id: "002b28fc-283c-47ec-9af2-ea287336dc1b",
    begin: "2021-07-26T17:09:31.036Z",
    end: "2021-08-29T00:37:42.253Z",
  },
  {
    id: "002b28fc-283c-47ec-9af2-ea287336dc1b",
    begin: "2022-05-23T12:21:27.377Z",
    end: "2022-11-13T02:16:38.905Z",
  },
  {
    id: "002b28fc-283c-47ec-9af2-ea287336dc1b",
    begin: "2022-12-04T09:59:33.628Z",
    end: "2022-12-12T22:35:13.815Z",
  },
  {
    id: "04ccad00-eb8d-4045-8994-b569cb4b64c1",
    begin: "2022-07-12T16:31:47.254Z",
    end: "2022-10-13T04:05:10.044Z",
  },
  {
    id: "086b0d53-b311-4441-aaf3-935646f03d4d",
    begin: "2022-07-12T16:31:47.254Z",
    end: "2022-10-13T04:05:10.044Z",
  },
  {
    id: "27820d4a-1bc4-4fc1-a5f0-bcb3627e94a1",
    begin: "2021-07-12T16:31:47.254Z",
    end: "2022-10-13T04:05:10.044Z",
  },
];
const siteId = "kingfisher";
const siteInfo = {
  id: "kingfisher",
  name: "KingFisher",
  devices: [
    {
      id: "002b28fc-283c-47ec-9af2-ea287336dc1b",
      name: "Battery 1",
    },
    {
      id: "086b0d53-b311-4441-aaf3-935646f03d4d",
      name: "Battery 2",
    },
  ],
};
const outageFilterAfter = Date.parse("2022-01-01T00:00:00.000Z");
const enhancedOutages = [
  {
    id: "002b28fc-283c-47ec-9af2-ea287336dc1b",
    name: "Battery 1",
    begin: "2022-05-23T12:21:27.377Z",
    end: "2022-11-13T02:16:38.905Z",
  },
  {
    id: "002b28fc-283c-47ec-9af2-ea287336dc1b",
    name: "Battery 1",
    begin: "2022-12-04T09:59:33.628Z",
    end: "2022-12-12T22:35:13.815Z",
  },
  {
    id: "086b0d53-b311-4441-aaf3-935646f03d4d",
    name: "Battery 2",
    begin: "2022-07-12T16:31:47.254Z",
    end: "2022-10-13T04:05:10.044Z",
  },
];

it("time filtering and adding device id", () => {
  expect(enhanceOutages(outages, siteInfo, outageFilterAfter)).toStrictEqual(
    enhancedOutages
  );
});

it("test main", async () => {
  let postBody;
  const mockFetch = jest
    .fn()
    .mockReturnValueOnce(
      Promise.resolve({
        status: 200,
        json: async () => await Promise.resolve(outages),
      })
    )
    .mockReturnValueOnce(
      Promise.resolve({
        status: 200,
        json: async () => await Promise.resolve(siteInfo),
      })
    )
    .mockImplementationOnce(async (resource, options) => {
      postBody = JSON.parse(options.body);
      return await Promise.resolve({
        status: 200,
        ok: true,
      });
    });
  global.fetch = mockFetch;

  await expect(main(siteId, outageFilterAfter)).resolves.not.toThrow();
  expect(postBody).toStrictEqual(enhancedOutages);
});

it("test main with 500s", async () => {
  let postBody;
  const mockFetch = jest
    .fn()
    .mockReturnValueOnce(
      Promise.resolve({
        status: 500,
        statusText: "Internal Server Error",
      })
    )
    .mockReturnValueOnce(
      Promise.resolve({
        status: 200,
        json: async () => await Promise.resolve(outages),
      })
    )
    .mockReturnValueOnce(
      Promise.resolve({
        status: 500,
        statusText: "Internal Server Error",
      })
    )
    .mockReturnValueOnce(
      Promise.resolve({
        status: 200,
        json: async () => await Promise.resolve(siteInfo),
      })
    )
    .mockReturnValueOnce(
      Promise.resolve({
        status: 500,
        statusText: "Internal Server Error",
      })
    )
    .mockImplementationOnce(async (resource, options) => {
      postBody = JSON.parse(options.body);
      return await Promise.resolve({
        status: 200,
        ok: true,
      });
    });
  global.fetch = mockFetch;

  await expect(main(siteId, outageFilterAfter)).resolves.not.toThrow();
  expect(postBody).toStrictEqual(enhancedOutages);
});

it("getAllOutages success", async () => {
  const mockFetch = jest.fn().mockReturnValue(
    Promise.resolve({
      status: 200,
      json: async () => await Promise.resolve(outages),
    })
  );
  global.fetch = mockFetch;

  const fetchedOutages = await getAllOutages();
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(fetchedOutages).toStrictEqual(outages);
});

it("getAllOutages 403", async () => {
  const mockFetch = jest.fn().mockReturnValue(
    Promise.resolve({
      status: 403,
    })
  );
  global.fetch = mockFetch;

  await expect(getAllOutages()).rejects.toThrow();
});

it("getAllOutages 429", async () => {
  const mockFetch = jest.fn().mockReturnValue(
    Promise.resolve({
      status: 429,
    })
  );
  global.fetch = mockFetch;

  await expect(getAllOutages()).rejects.toThrow();
});

it("getSiteInfo success", async () => {
  const mockFetch = jest.fn().mockReturnValue(
    Promise.resolve({
      status: 200,
      json: async () => await Promise.resolve(siteInfo),
    })
  );
  global.fetch = mockFetch;

  const fetchedSiteInfo = await getSiteInfo(siteId);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(fetchedSiteInfo).toStrictEqual(siteInfo);
});
