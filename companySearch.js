import { webSearch } from "./modules/searchAPI.js";

export async function searchCompanies(product, country) {

  if (!product || !country) {
    return [];
  }

  console.log("=================================");
  console.log("开始AI联网寻找真实海外买家");
  console.log("产品:", product);
  console.log("国家:", country);
  console.log("=================================");

  try {

    const results = await webSearch(product, country);

    if (!Array.isArray(results)) {
      return [];
    }

    const cleaned = [];

    const seen = new Set();

    for (const item of results) {

      if (!item) {
        continue;
      }

      const company = String(item.company || "").trim();
      const website = String(item.website || "").trim();

      if (!company) {
        continue;
      }

      if (!website) {
        continue;
      }

      const key = company.toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      const score = Number(item.match_score || 0);

      if (score < 60) {
        continue;
      }

      cleaned.push({
        company,
        country: item.country || country,
        website,
        industry: item.industry || "",
        buyer_type: item.buyer_type || "",
        score: score,
        description: item.why_fit || "",
        evidence: item.evidence || "",
        contact_hint: item.contact_hint || "",
        source: "AI Web Search"
      });
    }

    cleaned.sort((a, b) => b.score - a.score);

    console.log(`AI联网找到 ${cleaned.length} 个潜在买家`);

    return cleaned.slice(0, 10);

  } catch (error) {

    console.error("客户搜索失败:", error.message);

    return [];
  }
}
