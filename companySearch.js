import { webSearch } from "./modules/searchAPI.js";

const SUPPLIER_DOMAINS = [
  "alibaba.com",
  "aliexpress.com",
  "made-in-china.com",
  "globalsources.com",
  "indiamart.com",
  "dhgate.com",
  "1688.com",
  "taobao.com",
  "temu.com",
  "amazon.com",
  "ebay.com",
  "ec21.com",
  "tradeindia.com",
  "go4worldbusiness.com"
];

const SUPPLIER_WORDS = [
  "supplier",
  "suppliers",
  "manufacturer",
  "manufacturers",
  "factory",
  "factories",
  "wholesaler",
  "wholesale supplier",
  "cnc machining service",
  "machining service",
  "oem manufacturer",
  "contract manufacturer"
];

const BUYER_WORDS = [
  "buyer",
  "buyers",
  "purchasing",
  "procurement",
  "purchase",
  "sourcing",
  "distributor",
  "distributors",
  "importer",
  "importers",
  "wholesale",
  "dealer",
  "retailer",
  "brand",
  "components",
  "parts",
  "equipment",
  "systems"
];

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return url || "";
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function isBadDomain(url) {
  const domain = getDomain(url);

  return SUPPLIER_DOMAINS.some(item =>
    domain === item || domain.endsWith("." + item)
  );
}

function scoreResult(item, product) {

  const text = `${item.title} ${item.snippet} ${item.url}`.toLowerCase();

  let score = 50;

  for (const word of BUYER_WORDS) {
    if (text.includes(word)) {
      score += 5;
    }
  }

  for (const word of SUPPLIER_WORDS) {
    if (text.includes(word)) {
      score -= 10;
    }
  }

  if (text.includes(product.toLowerCase())) {
    score += 10;
  }

  if (
    text.includes("contact") ||
    text.includes("about us") ||
    text.includes("company")
  ) {
    score += 3;
  }

  return Math.max(0, Math.min(100, score));
}

function companyNameFromTitle(title) {

  if (!title) return "Unknown Company";

  return title
    .replace(/\s*[-|–]\s*.*$/, "")
    .trim();
}

export async function searchCompanies(product, country) {

  if (!product || !country) {
    throw new Error("产品和目标国家不能为空");
  }

  const queries = [
    `${product} buyer ${country}`,
    `${product} importer ${country}`,
    `${product} distributor ${country}`,
    `${product} purchasing procurement ${country}`,
    `${product} wholesale buyer ${country}`
  ];

  const allResults = [];

  for (const query of queries) {

    try {

      const results = await webSearch(query);

      for (const item of results) {

        if (!item.url) continue;

        if (isBadDomain(item.url)) {
          continue;
        }

        const domain = getDomain(item.url);

        if (!domain) continue;

        const score = scoreResult(item, product);

        allResults.push({
          company: companyNameFromTitle(item.title),
          country,
          type: "Potential Buyer",
          website: normalizeUrl(item.url),
          email: "",
          description: item.snippet || "",
          source: item.source || "Tavily",
          keyword: query,
          score
        });
      }

    } catch (error) {

      console.error(
        `搜索失败 [${query}]:`,
        error.message
      );

    }
  }

  // 去重：同一个网站只保留一次
  const unique = new Map();

  for (const item of allResults) {

    const domain = getDomain(item.website);

    if (!domain) continue;

    const old = unique.get(domain);

    if (!old || item.score > old.score) {
      unique.set(domain, item);
    }
  }

  let companies = Array.from(unique.values());

  // 排序
  companies.sort((a, b) => b.score - a.score);

  // 最多返回 30 个
  companies = companies.slice(0, 30);

  return companies;
}
