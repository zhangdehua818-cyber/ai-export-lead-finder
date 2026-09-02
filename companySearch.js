import { webSearch } from "./modules/searchAPI.js";

/*
 * AI外贸客户开发助手 V3.5
 * 真实买家质量引擎
 *
 * 核心原则：
 * 1. 官网能打开 ≠ 客户
 * 2. 搜索结果标题 ≠ 公司名称
 * 3. Supplier / Manufacturer / Factory 优先排除
 * 4. Buyer / Distributor / Wholesaler / Retailer 保留
 * 5. Directory / Buyer List / Article / Guide / Logistics 排除
 * 6. 最终只输出高质量候选客户
 */

const BLOCKED_DOMAINS = [
  "alibaba.com",
  "aliexpress.com",
  "made-in-china.com",
  "globalsources.com",
  "indiamart.com",
  "dhgate.com",
  "ec21.com",
  "tradeindia.com",
  "tradewheel.com",
  "exporthub.com",
  "globalimporter.net",
  "europages.com",
  "kompass.com",
  "thomasnet.com",
  "yellowpages.com",
  "yelp.com",
  "weaccessory.com"
];

const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "pinterest.com"
];

const LOGISTICS_DOMAINS = [
  "dhl.com",
  "fedex.com",
  "ups.com",
  "usps.com",
  "freightos.com",
  "flexport.com",
  "bookairfreight.com",
  "shipstation.com",
  "shippo.com"
];

const BUYER_WORDS = [
  "buyer",
  "buyers",
  "buying",
  "purchase",
  "purchasing",
  "procurement",
  "procure",
  "sourcing",
  "source products",
  "import",
  "importer",
  "imports",
  "distributor",
  "distribution",
  "wholesaler",
  "wholesale",
  "retailer",
  "retail",
  "reseller",
  "resale",
  "brand",
  "bulk order",
  "bulk orders",
  "b2b",
  "trade",
  "commercial"
];

const STRONG_BUYER_WORDS = [
  "wholesale",
  "wholesaler",
  "distributor",
  "distribution",
  "retailer",
  "reseller",
  "importer",
  "purchasing",
  "procurement",
  "sourcing",
  "bulk orders",
  "bulk order"
];

const SUPPLIER_WORDS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "supplier",
  "suppliers",
  "factory direct",
  "oem manufacturer",
  "manufacturer and supplier",
  "made in china",
  "production facility",
  "custom manufacturing",
  "contract manufacturer",
  "manufacturing service",
  "machining service",
  "cnc machining",
  "wholesale supplier"
];

const ARTICLE_WORDS = [
  "complete guide",
  "ultimate guide",
  "guide to",
  "how to",
  "what is",
  "blog",
  "article",
  "news",
  "case study",
  "tips",
  "tutorial",
  "comparison",
  "review",
  "lab testing",
  "testing requirements",
  "compliance guide"
];

const DIRECTORY_WORDS = [
  "buyer list",
  "buyers list",
  "importer list",
  "importers list",
  "supplier directory",
  "buyer directory",
  "b2b directory",
  "company directory",
  "buying leads",
  "buying lead",
  "trade leads",
  "rfq list",
  "request for quotation list",
  "potential buyers",
  "potential buyer list"
];

const LOGISTICS_WORDS = [
  "freight",
  "freight forwarding",
  "freight forwarder",
  "shipping",
  "shipping company",
  "logistics",
  "customs clearance",
  "cargo",
  "air freight",
  "ocean freight",
  "warehouse logistics",
  "fulfillment"
];

const COUNTRY_MAP = {
  "美国": "United States",
  "美国市场": "United States",
  "英国": "United Kingdom",
  "加拿大": "Canada",
  "澳大利亚": "Australia",
  "德国": "Germany",
  "法国": "France",
  "意大利": "Italy",
  "西班牙": "Spain",
  "日本": "Japan",
  "韩国": "South Korea",
  "新加坡": "Singapore",
  "印度": "India",
  "巴西": "Brazil",
  "墨西哥": "Mexico"
};

const PRODUCT_MAP = {
  "手机壳": "phone case",
  "手机保护壳": "phone case",
  "手机壳子": "phone case",
  "手机配件": "phone accessories",
  "手机配件产品": "mobile phone accessories",
  "充电宝": "power bank",
  "移动电源": "power bank",
  "蓝牙耳机": "bluetooth earbuds",
  "耳机": "earbuds",
  "数据线": "charging cable",
  "充电线": "charging cable",
  "钢化膜": "tempered glass screen protector",
  "保护膜": "screen protector",
  "背包": "backpack",
  "运动服": "sportswear",
  "服装": "clothing",
  "鞋": "shoes",
  "玩具": "toys"
};

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.value) return String(value.value);
    return "";
  }

  return String(value).trim();
}

function normalizeCountry(country) {
  const text = normalizeText(country);
  return COUNTRY_MAP[text] || text;
}

function normalizeProduct(product) {
  const text = normalizeText(product);

  if (PRODUCT_MAP[text]) {
    return PRODUCT_MAP[text];
  }

  return text;
}

function cleanUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

function getOrigin(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

function getHostname(url) {
  try {
    return new URL(url).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getPath(url) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return "";
  }
}

function isBlockedDomain(url) {
  const host = getHostname(url);

  if (!host) return true;

  if (
    BLOCKED_DOMAINS.some(
      domain => host === domain || host.endsWith("." + domain)
    )
  ) {
    return true;
  }

  if (
    SOCIAL_DOMAINS.some(
      domain => host === domain || host.endsWith("." + domain)
    )
  ) {
    return true;
  }

  if (
    LOGISTICS_DOMAINS.some(
      domain => host === domain || host.endsWith("." + domain)
    )
  ) {
    return true;
  }

  return false;
}

function containsAny(text, words) {
  const lower = normalizeText(text).toLowerCase();

  return words.some(word => lower.includes(word));
}

function countWords(text, words) {
  const lower = normalizeText(text).toLowerCase();

  let count = 0;

  for (const word of words) {
    if (lower.includes(word)) {
      count++;
    }
  }

  return count;
}

function looksLikeDirectory(text) {
  return containsAny(text, DIRECTORY_WORDS);
}

function looksLikeArticle(text) {
  return containsAny(text, ARTICLE_WORDS);
}

function looksLikeLogistics(text) {
  return countWords(text, LOGISTICS_WORDS) >= 2;
}

function looksLikeSupplier(text) {
  return countWords(text, SUPPLIER_WORDS) >= 2;
}

function looksLikeBadPath(url) {
  const path = getPath(url);

  const badPathWords = [
    "/blog/",
    "/article/",
    "/articles/",
    "/news/",
    "/guide/",
    "/guides/",
    "/category/",
    "/categories/",
    "/tag/",
    "/tags/",
    "/search/",
    "/buyer-list",
    "/buyers-list",
    "/importer-list",
    "/importers-list",
    "/supplier-list",
    "/supplier-directory",
    "/directory/",
    "/buying-leads",
    "/rfq/",
    "/rfqs/",
    "/product-category/",
    "/collections/"
  ];

  return badPathWords.some(word => path.includes(word));
}

async function fetchWebsite(url) {
  const origin = getOrigin(url);

  if (!origin) {
    return {
      verified: false,
      finalUrl: "",
      html: "",
      text: ""
    };
  }

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 7000);

  try {
    const response = await fetch(origin, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AI-Export-Lead-Finder/3.5)"
      }
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        verified: false,
        finalUrl: origin,
        html: "",
        text: ""
      };
    }

    const html = await response.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();

    return {
      verified: true,
      finalUrl: response.url || origin,
      html,
      text: text.slice(0, 50000)
    };
  } catch {
    clearTimeout(timer);

    return {
      verified: false,
      finalUrl: origin,
      html: "",
      text: ""
    };
  }
}

function extractTitle(html) {
  if (!html) return "";

  const titleMatch = html.match(
    /<title[^>]*>([\s\S]*?)<\/title>/i
  );

  if (!titleMatch) return "";

  return titleMatch[1]
    .replace(/\s+/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .trim();
}

function extractSiteName(html) {
  if (!html) return "";

  const patterns = [
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function cleanCompanyName(title, siteName, hostname) {
  let name = normalizeText(siteName || title);

  name = name
    .replace(/\s*\|\s*.*/g, "")
    .replace(/\s*-\s*(Official Site|Official Website).*$/i, "")
    .replace(/\s*-\s*Home.*$/i, "")
    .replace(/\s*–\s*Home.*$/i, "")
    .trim();

  const genericNames = [
    "potential buyer",
    "potential buyers",
    "complete guide",
    "ultimate guide",
    "phone case buyers",
    "phone case buyer",
    "wholesale cell phone accessories supplier cellphone cases b2b distributor usa",
    "wholesale cell phone accessories, cases, speakers in usa",
    "custom phone cases"
  ];

  if (
    genericNames.some(
      item => name.toLowerCase() === item.toLowerCase()
    )
  ) {
    name = "";
  }

  if (!name || name.length < 2 || name.length > 100) {
    const fallback = hostname
      .replace(/\.(com|net|org|co|us)$/i, "")
      .replace(/[-_]+/g, " ");

    name = fallback
      .split(" ")
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return name;
}

function determineType(text) {
  const lower = normalizeText(text).toLowerCase();

  if (
    lower.includes("distributor") ||
    lower.includes("distribution")
  ) {
    return "Distributor";
  }

  if (
    lower.includes("wholesaler") ||
    lower.includes("wholesale") ||
    lower.includes("bulk order") ||
    lower.includes("bulk orders")
  ) {
    return "Wholesaler";
  }

  if (
    lower.includes("retailer") ||
    lower.includes("retail") ||
    lower.includes("reseller")
  ) {
    return "Retailer";
  }

  if (
    lower.includes("importer") ||
    lower.includes("imports")
  ) {
    return "Importer";
  }

  if (
    lower.includes("brand")
  ) {
    return "Brand";
  }

  return "Buyer";
}

function buildBuyerEvidence(text) {
  const lower = normalizeText(text).toLowerCase();

  const evidence = [];

  const evidenceMap = [
    ["wholesale", "Wholesale business"],
    ["wholesaler", "Wholesaler"],
    ["distributor", "Distributor"],
    ["distribution", "Distribution business"],
    ["retailer", "Retailer"],
    ["retail", "Retail business"],
    ["reseller", "Reseller"],
    ["importer", "Importer"],
    ["purchasing", "Purchasing"],
    ["procurement", "Procurement"],
    ["sourcing", "Sourcing"],
    ["bulk orders", "Bulk orders"],
    ["bulk order", "Bulk orders"],
    ["b2b", "B2B business"],
    ["resale", "Resale"]
  ];

  for (const [keyword, label] of evidenceMap) {
    if (lower.includes(keyword)) {
      evidence.push(label);
    }
  }

  return [...new Set(evidence)].slice(0, 6);
}

function calculateQuality(candidate) {
  let score = 45;

  const text = [
    candidate.title,
    candidate.description,
    candidate.websiteTitle,
    candidate.siteName,
    candidate.websiteText
  ]
    .join(" ")
    .toLowerCase();

  const buyerCount = countWords(text, BUYER_WORDS);
  const strongBuyerCount = countWords(text, STRONG_BUYER_WORDS);
  const supplierCount = countWords(text, SUPPLIER_WORDS);

  const product = normalizeProduct(candidate.product).toLowerCase();

  let productRelevant = false;

  if (product && text.includes(product)) {
    productRelevant = true;
  }

  if (
    product === "phone case" &&
    (
      text.includes("phone cases") ||
      text.includes("cell phone") ||
      text.includes("mobile accessories") ||
      text.includes("phone accessories")
    )
  ) {
    productRelevant = true;
  }

  if (
    product === "phone accessories" &&
    (
      text.includes("phone case") ||
      text.includes("mobile accessories") ||
      text.includes("cell phone accessories")
    )
  ) {
    productRelevant = true;
  }

  if (candidate.verified) {
    score += 10;
  } else {
    score -= 15;
  }

  if (buyerCount >= 1) {
    score += 8;
  }

  if (strongBuyerCount >= 1) {
    score += 12;
  }

  if (strongBuyerCount >= 2) {
    score += 8;
  }

  if (productRelevant) {
    score += 12;
  } else {
    score -= 8;
  }

  if (supplierCount >= 1) {
    score -= 20;
  }

  if (supplierCount >= 2) {
    score -= 25;
  }

  if (looksLikeArticle(text)) {
    score -= 30;
  }

  if (looksLikeDirectory(text)) {
    score -= 45;
  }

  if (looksLikeLogistics(text)) {
    score -= 40;
  }

  if (candidate.pageIsBad) {
    score -= 35;
  }

  return Math.max(0, Math.min(100, score));
}

function shouldKeep(candidate) {
  const text = [
    candidate.title,
    candidate.description,
    candidate.websiteTitle,
    candidate.siteName,
    candidate.websiteText
  ]
    .join(" ")
    .toLowerCase();

  if (!candidate.website) {
    return false;
  }

  if (!candidate.verified) {
    return false;
  }

  if (isBlockedDomain(candidate.website)) {
    return false;
  }

  if (looksLikeDirectory(text)) {
    return false;
  }

  if (looksLikeArticle(text)) {
    return false;
  }

  if (looksLikeLogistics(text)) {
    return false;
  }

  /*
   * 供应商排除：
   * 只有在供应商信号明显时才剔除。
   * 避免把正常批发商网页中偶尔出现 manufacturer 一词误杀。
   */
  const supplierCount = countWords(text, SUPPLIER_WORDS);
  const strongBuyerCount = countWords(text, STRONG_BUYER_WORDS);

  if (supplierCount >= 2 && strongBuyerCount === 0) {
    return false;
  }

  if (candidate.pageIsBad) {
    return false;
  }

  const buyerCount = countWords(text, BUYER_WORDS);

  if (buyerCount === 0) {
    return false;
  }

  if (!candidate.productRelevant) {
    return false;
  }

  if (candidate.qualityScore < 50) {
    return false;
  }

  return true;
}

export async function searchCompanies(product, country) {
  const originalProduct = normalizeText(product);
  const normalizedProduct = normalizeProduct(product);
  const normalizedCountry = normalizeCountry(country);

  const searchProduct =
    originalProduct && normalizedProduct !== originalProduct
      ? `${originalProduct} ${normalizedProduct}`
      : normalizedProduct;

  /*
   * 只保留真正有客户价值的搜索方向。
   */
  const queries = [
    `"${searchProduct}" ${normalizedCountry} wholesaler distributor`,
    `"${searchProduct}" ${normalizedCountry} retailer wholesale`,
    `"${searchProduct}" ${normalizedCountry} importer distributor`,
    `"${searchProduct}" ${normalizedCountry} purchasing procurement`,
    `"${searchProduct}" ${normalizedCountry} sourcing buyer`,
    `"${searchProduct}" ${normalizedCountry} "bulk orders"`,
    `"${searchProduct}" ${normalizedCountry} B2B retailer`
  ];

  const rawResults = [];

  for (const query of queries) {
    try {
      const results = await webSearch(query);

      if (!Array.isArray(results)) {
        continue;
      }

      for (const item of results) {
        if (!item || !item.url) {
          continue;
        }

        const url = cleanUrl(item.url);

        if (!url) {
          continue;
        }

        if (isBlockedDomain(url)) {
          continue;
        }

        if (looksLikeBadPath(url)) {
          continue;
        }

        rawResults.push({
          ...item,
          url,
          query
        });
      }
    } catch (error) {
      console.error("Search query failed:", query, error.message);
    }
  }

  /*
   * 第一轮按域名去重。
   */
  const domainMap = new Map();

  for (const item of rawResults) {
    const hostname = getHostname(item.url);

    if (!hostname) {
      continue;
    }

    if (!domainMap.has(hostname)) {
      domainMap.set(hostname, item);
      continue;
    }

    const existing = domainMap.get(hostname);

    const existingText = `${existing.title || ""} ${
      existing.snippet || existing.description || ""
    }`;

    const newText = `${item.title || ""} ${
      item.snippet || item.description || ""
    }`;

    const existingBuyer = countWords(existingText, BUYER_WORDS);
    const newBuyer = countWords(newText, BUYER_WORDS);

    if (newBuyer > existingBuyer) {
      domainMap.set(hostname, item);
    }
  }

  const candidates = [];

  /*
   * 每个域名验证官网首页。
   */
  for (const item of domainMap.values()) {
    const website = getOrigin(item.url);

    if (!website) {
      continue;
    }

    if (isBlockedDomain(website)) {
      continue;
    }

    const websiteInfo = await fetchWebsite(website);

    const websiteTitle = extractTitle(websiteInfo.html);
    const siteName = extractSiteName(websiteInfo.html);

    const title = normalizeText(item.title);
    const description = normalizeText(
      item.snippet || item.description
    );

    const combinedText = [
      title,
      description,
      websiteTitle,
      siteName,
      websiteInfo.text
    ].join(" ");

    const buyerEvidence = buildBuyerEvidence(combinedText);

    const supplierCount = countWords(
      combinedText,
      SUPPLIER_WORDS
    );

    const strongBuyerCount = countWords(
      combinedText,
      STRONG_BUYER_WORDS
    );

    const article = looksLikeArticle(combinedText);
    const directory = looksLikeDirectory(combinedText);
    const logistics = looksLikeLogistics(combinedText);

    /*
     * 产品相关性。
     */
    const productLower = normalizedProduct.toLowerCase();
    const combinedLower = combinedText.toLowerCase();

    let productRelevant = false;

    if (
      productLower &&
      combinedLower.includes(productLower)
    ) {
      productRelevant = true;
    }

    if (
      productLower === "phone case" &&
      (
        combinedLower.includes("phone cases") ||
        combinedLower.includes("cell phone") ||
        combinedLower.includes("phone accessories") ||
        combinedLower.includes("mobile accessories")
      )
    ) {
      productRelevant = true;
    }

    if (
      productLower === "phone accessories" &&
      (
        combinedLower.includes("phone case") ||
        combinedLower.includes("cell phone accessories") ||
        combinedLower.includes("mobile accessories")
      )
    ) {
      productRelevant = true;
    }

    /*
     * 搜索结果页面本身如果是明显分类/文章页面，直接标记。
     */
    const pageIsBad =
      looksLikeBadPath(item.url) ||
      directory ||
      article ||
      logistics;

    const hostname = getHostname(website);

    const companyName = cleanCompanyName(
      websiteTitle || title,
      siteName,
      hostname
    );

    const candidate = {
      company: companyName,
      companyName,
      country: normalizedCountry,
      type: determineType(combinedText),
      website,
      description: description || websiteTitle,
      title,
      websiteTitle,
      siteName,
      websiteText: websiteInfo.text,
      source: "Tavily + Website Verification",
      verified: websiteInfo.verified,
      websiteVerified: websiteInfo.verified,
      buyerEvidence,
      product: normalizedProduct,
      productRelevant,
      supplierCount,
      strongBuyerCount,
      article,
      directory,
      logistics,
      pageIsBad,
      searchQuery: item.query || ""
    };

    candidate.qualityScore = calculateQuality(candidate);

    if (shouldKeep(candidate)) {
      candidates.push(candidate);
    }
  }

  /*
   * 最终再次按照域名去重。
   */
  const finalMap = new Map();

  for (const candidate of candidates) {
    const domain = getHostname(candidate.website);

    if (!domain) {
      continue;
    }

    const old = finalMap.get(domain);

    if (!old || candidate.qualityScore > old.qualityScore) {
      finalMap.set(domain, candidate);
    }
  }

  const finalResults = [...finalMap.values()]
    .sort((a, b) => {
      if (b.qualityScore !== a.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }

      if (b.strongBuyerCount !== a.strongBuyerCount) {
        return b.strongBuyerCount - a.strongBuyerCount;
      }

      return Number(b.verified) - Number(a.verified);
    })
    .slice(0, 15);

  console.log(
    `V3.5 search completed: ${finalResults.length} quality buyers`
  );

  return finalResults;
}
