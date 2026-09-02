import { TAVILY_API_KEY, TAVILY_API_URL } from "./apiConfig.js";

export async function webSearch(query) {

  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY 未配置");
  }

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TAVILY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      topic: "general",
      max_results: 8,
      include_answer: false,
      include_raw_content: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily 搜索失败: ${response.status} ${text}`);
  }

  const data = await response.json();

  return (data.results || []).map(item => ({
    title: item.title || "",
    url: item.url || "",
    snippet: item.content || "",
    source: "Tavily"
  }));
}
