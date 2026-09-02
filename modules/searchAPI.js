import { SEARCH_CONFIG } from "./apiConfig.js";

export async function webSearch(keyword) {
  if (
    SEARCH_CONFIG.provider === "bing" &&
    SEARCH_CONFIG.bingKey
  ) {
    try {
      const results = await bingSearch(keyword);

      if (results.length > 0) {
        return results;
      }

      return [];
    } catch (error) {
      console.error("Bing Search Error:", error.message);
      return [];
    }
  }

  return [];
}

async function bingSearch(keyword) {
  const url =
    "https://api.bing.microsoft.com/v7.0/search?q=" +
    encodeURIComponent(keyword) +
    "&count=10&textDecorations=false&textFormat=Raw";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Ocp-Apim-Subscription-Key":
        SEARCH_CONFIG.bingKey
    }
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Bing API ${response.status}: ${text}`
    );
  }

  const data = await response.json();

  if (!data.webPages || !data.webPages.value) {
    return [];
  }

  return data.webPages.value.map(item => ({
    title: item.name || "",
    url: item.url || "",
    snippet: item.snippet || "",
    source: "bing"
  }));
}
