export const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";

export const TAVILY_API_URL = "https://api.tavily.com/search";

export function checkApiConfig() {
  return {
    tavily: !!TAVILY_API_KEY
  };
}
