import { webSearch } from "./modules/searchAPI.js";

const BLOCKED_DOMAINS = [
  "alibaba.com",
  "aliexpress.com",
  "made-in-china.com",
  "globalsources.com",
  "indiamart.com",
  "dhgate.com",
  "ec21.com",
  "tradeindia.com",
  "europages.com",
  "kompass.com",
  "thomasnet.com",
  "yellowpages.com",
  "yelp.com",
  "tradewheel.com",
  "exporthub.com",
  "globalimporter.net",
  "go4worldbusiness.com",
  "weaccessory.com"
];

const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "tiktok.com",
  "pinterest.com"
];

const LOGISTICS_DOMAINS = [
  "dhl.com",
  "fedex.com",
  "ups.com",
  "usps.com",
  "freightos.com",
  "flexport.com",
  "bookairfreight.com"
];

const SUPPLIER_WORDS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "factory direct",
  "supplier",
  "suppliers",
  "oem manufacturer",
  "original manufacturer",
  "cnc machining",
  "machining service",
  "contract manufacturer",
  "custom manufacturing",
  "made in china",
  "wholesale supplier",
  "factory price"
];

const BUYER_WORDS = [
  "importer",
  "import",
  "distributor",
  "distribution",
  "wholesale",
  "wholesaler",
  "retailer",
  "retail",
  "buyer",
  "buyers",
  "purchasing",
  "procurement",
  "sourcing",
  "buying",
  "purchase",
  "purchase order",
  "rfq",
  "request for quotation",
  "request a quote",
  "mobile accessories",
  "phone accessories",
  "cell phone accessories"
];

const BAD_PAGE_WORDS = [
  "buyer list",
  "buyers list",
  "importer list",
  "importers list",
  "supplier directory",
  "supplier list",
  "buying leads",
  "buyer leads",
  "importer directory",
  "directory",
  "complete guide",
  "ultimate guide",
  "how to",
  "blog",
  "article",
  "news",
  "tips",
  "lab testing",
  "testing requirements",
  "compliance guide"
];

const BAD_PATH_WORDS = [
  "/blog/",
  "/blogs/",
  "/article/",
  "/articles/",
  "/news/",
  "/guide/",
  "/guides/",
  "/directory/",
  "/directories/",
  "/buyers/",
  "/buyer/",
  "/importers/",
  "/importer/",
  "/suppliers/",
  "/supplier/",
  "/buying-leads/",
  "/category/",
  "/categories/",
  "/search/",
  "/tag/",
  "/tags/"
];

const COUNTRY_MAP = {
  "美国": "United States",
  "美国市场": "United States",
  "英国": "United Kingdom",
  "德国": "Germany",
  "法国": "France",
  "加拿大": "Canada",
  "澳大利亚": "Australia",
  "日本": "Japan",
  "韩国": "South Korea",
  "阿联酋": "United Arab Emirates",
  "沙特": "Saudi Arabia",
  "新加坡": "Singapore",
  "印度": "India",
  "墨西哥": "Mexico",
  "巴西": "Brazil",
  "意大利": "Italy",
  "西班牙": "Spain"
};

const PRODUCT_MAP = {
  "手机壳": "phone case",
  "手机保护壳": "phone case",
  "手机壳子": "phone case",
  "手机配件": "mobile phone accessories",
  "手机配件产品": "mobile phone accessories",
  "数据线": "charging cable",
  "充电线": "charging cable",
  "充电器": "phone charger",
  "耳机": "earphones",
  "蓝牙耳机": "wireless earbuds",
  "移动电源": "power bank",
  "钢化膜": "tempered glass screen protector",
  "手机膜": "screen protector",
  "服装": "clothing",
  "鞋": "shoes",
  "箱包": "bags",
  "玩具": "toys",
  "家具": "furniture"
};

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.value ||
      value.text ||
      JSON.stringify(value)
    );
  }
  return String(value);
}

function normalizeProduct(product) {
  const value = normalizeText(product).trim();
  return PRODUCT_MAP[value] || value;
}

function normalizeCountry(country) {
  const value = normalizeText(country).trim();
  return COUNTRY_MAP[value] || value;
}

function getDomain(url) {
  try {
    return new URL(url).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function getOrigin(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return "";
  }
}

function isBlockedDomain(domain) {
  if (!domain) return true;

  return (
    BLOCKED_DOMAINS.some(d => domain === d || domain.endsWith("." + d)) ||
    SOCIAL_DOMAINS.some(d => domain === d || domain.endsWith("." + d)) ||
    LOGISTICS_DOMAINS.some(d => domain === d || domain.endsWith("." + d))
  );
}

function pathLooksBad(url) {
  try {
    const path = new URL(url).pathname.toLowerCase();

    return BAD_PATH_WORDS.some(word => path.includes(word));
  } catch {
    return true;
  }
}

function countSignals(text, words) {
  const lower = normalizeText(text).toLowerCase();

  let count = 0;

  for (const word of words) {
    if (lower.includes(word.toLowerCase())) {
      count++;
    }
  }

  return count;
}

function productRelevant(text, product) {
  const lower = normalizeText(text).toLowerCase();

  const p = normalizeProduct(product).toLowerCase();

  const aliases = [
    p,
    normalizeText(product).toLowerCase()
  ];

  if (p === "phone case") {
    aliases.push(
      "phone cases",
      "cell phone case",
      "cell phone cases",
      "mobile phone case",
      "mobile phone cases",
      "protective case",
      "phone accessories",
      "mobile accessories",
      "cell phone accessories"
    );
  }

  if (p === "mobile phone accessories") {
    aliases.push(
      "phone accessories",
      "mobile accessories",
      "cell phone accessories",
      "phone case",
      "screen protector"
    );
  }

  return aliases.some(x => x && lower.includes(x));
}

function hasStrongSupplierSignal(text) {
  const lower = normalizeText(text).toLowerCase();

  let hits = 0;

  for (const word of SUPPLIER_WORDS) {
    if (lower.includes(word)) hits++;
  }

  return hits >= 2;
}

function hasBuyerSignal(text) {
  const lower = normalizeText(text).toLowerCase();

  let hits = 0;

  for (const word of BUYER_WORDS) {
    if (lower.includes(word)) hits++;
  }

  return hits;
}

function looksLikeBadPage(text, url = "") {
  const lower = normalizeText(text).toLowerCase();

  if (pathLooksBad(url)) {
    return true;
  }

  let hits = 0;

  for (const word of BAD_PAGE_WORDS) {
    if (lower.includes(word)) hits++;
  }

  return hits >= 2;
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (!titleMatch) return "";

  return titleMatch[1]
    .replace(/\s+/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .trim();
}

function extractSiteName(html) {
  const patterns = [
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
    /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function htmlToText(html) {
  return normalizeText(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCompanyName(name, domain) {
  let value = normalizeText(name)
    .replace(/\s+/g, " ")
    .trim();

  if (!value) {
    return domain
      ? domain.split(".")[0]
      : "Unknown Company";
  }

  const badNames = [
    "potential buyer",
    "potential buyers",
    "complete guide",
    "guide",
    "buy hanfu online",
    "buyer list",
    "importer list",
    "wholesale smartphone accessories",
    "phone case buyer",
    "phone case buyers",
    "phone case importers",
    "phone case importer"
  ];

  const lower = value.toLowerCase();

  if (badNames.some(x => lower === x)) {
    return "";
  }

  // 从 "Entro | Mobile Accessories Wholesale"
  // "Mila Wholesale - Cell Phone Accessories"
  // 中提取公司主体
  const separators = [" | ", " – ", " — ", " - ", " :: ", " : "];

  for (const separator of separators) {
    if (value.includes(separator)) {
      const first = value.split(separator)[0].trim();

      if (
        first.length >= 2 &&
        first.length <= 80 &&
        !BAD_PAGE_WORDS.includes(first.toLowerCase())
      ) {
        value = first;
        break;
      }
    }
  }

  return value;
}

async function fetchPage(url) {
  if (!url) return null;

  try {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
    }, 8000);

    const response = await fetch(url, {
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
      return null;
    }

    const html = await response.text();

    return {
      html,
      url: response.url,
      status: response.status
    };
  } catch {
    return null;
  }
}

function calculateQuality(candidate) {
  let score = 35;

  if (candidate.verified) {
    score += 15;
  } else {
    score -= 10;
  }

  if (candidate.productRelevant) {
    score += 15;
  } else {
    score -= 35;
  }

  if (candidate.buyerSignals >= 1) {
    score += Math.min(candidate.buyerSignals * 6, 24);
  }

  if (candidate.companyIdentity) {
    score += 8;
  }

  if (candidate.email) {
    score += 10;
  }

  if (candidate.supplierSignals >= 2) {
    score -= 50;
  }

  if (candidate.badPage) {
    score -= 50;
  }

  if (candidate.logistics) {
    score -= 45;
  }

  return Math.max(0, Math.min(100, score));
}

function determineType(text) {
  const lower = normalizeText(text).toLowerCase();

  if (
    lower.includes("importer") ||
    lower.includes("imports")
  ) {
    return "Importer";
  }

  if (
    lower.includes("distributor") ||
    lower.includes("distribution")
  ) {
    return "Distributor";
  }

  if (
    lower.includes("wholesaler") ||
    lower.includes("wholesale")
  ) {
    return "Wholesaler";
  }

  if (
    lower.includes("retailer") ||
    lower.includes("retail")
  ) {
    return "Retailer";
  }

  if (
    lower.includes("buyer") ||
    lower.includes("purchasing") ||
    lower.includes("procurement")
  ) {
    return "Buyer";
  }

  return "Potential Buyer";
}

function makeReason(candidate) {
  const reasons = [];

  if (candidate.verified) {
    reasons.push("官网可访问");
  }

  if (candidate.productRelevant) {
    reasons.push("产品高度相关");
  }

  if (candidate.buyerSignals > 0) {
    reasons.push("存在批发/分销/采购信号");
  }

  if (candidate.email) {
    reasons.push("找到公开企业邮箱");
  }

  if (reasons.length === 0) {
    return "需要进一步人工确认";
  }

  return reasons.join(" · ");
}

export async function searchCompanies(product, country) {
  const rawProduct = normalizeText(product).trim();
  const englishProduct = normalizeProduct(product);
  const market = normalizeCountry(country);

  if (!rawProduct || !market) {
    return [];
  }

  const queries = [
    `"${englishProduct}" ${market} distributor company`,
    `"${englishProduct}" ${market} wholesaler company`,
    `"${englishProduct}" ${market} retailer company`,
    `"${englishProduct}" ${market} importer company`,
    `"${englishProduct}" ${market} purchasing procurement`,
    `"${englishProduct}" ${market} "mobile accessories" wholesale`,
    `"${englishProduct}" ${market} "phone accessories" distributor`,
    `"${englishProduct}" ${market} company wholesale retailer`
  ];

  const candidates = [];
  const seen = new Set();

  for (const query of queries) {
    try {
      const results = await webSearch(query);

      if (!Array.isArray(results)) {
        continue;
      }

      for (const item of results) {
        const url = normalizeText(item.url).trim();

        if (!url) continue;

        const domain = getDomain(url);

        if (!domain) continue;

        if (isBlockedDomain(domain)) {
          continue;
        }

        if (pathLooksBad(url)) {
          continue;
        }

        if (seen.has(domain)) {
          continue;
        }

        const title = normalizeText(item.title);
        const snippet = normalizeText(item.snippet);

        const initialText = `${title} ${snippet}`;

        if (looksLikeBadPage(initialText, url)) {
          continue;
        }

        const supplierHits = countSignals(
          initialText,
          SUPPLIER_WORDS
        );

        const buyerHits = countSignals(
          initialText,
          BUYER_WORDS
        );

        if (supplierHits >= 3 && buyerHits < 2) {
          continue;
        }

        seen.add(domain);

        candidates.push({
          domain,
          url,
          title,
          snippet,
          source: item.source || "Tavily",
          keyword: query,
          initialBuyerSignals: buyerHits,
          initialSupplierSignals: supplierHits
        });
      }
    } catch (error) {
      console.error("Search query failed:", query, error.message);
    }
  }

  const verifiedCandidates = [];

  // 最多检查 30 个网站，避免浪费服务器资源
  for (const candidate of candidates.slice(0, 30)) {
    const origin = getOrigin(candidate.url);

    if (!origin) continue;

    const homepage = await fetchPage(origin);

    if (!homepage) {
      continue;
    }

    const html = homepage.html || "";
    const homepageText = htmlToText(html);

    const title = extractTitle(html);
    const siteName = extractSiteName(html);

    const combinedText = [
      candidate.title,
      candidate.snippet,
      title,
      siteName,
      homepageText.slice(0, 15000)
    ].join(" ");

    const lowerCombined = combinedText.toLowerCase();

    const logistics =
      LOGISTICS_DOMAINS.some(
        d => candidate.domain === d || candidate.domain.endsWith("." + d)
      ) ||
      (
        lowerCombined.includes("freight forwarding") &&
        lowerCombined.includes("shipping")
      ) ||
      lowerCombined.includes("air freight booking");

    if (logistics) {
      continue;
    }

    const supplierSignals = countSignals(
      combinedText,
      SUPPLIER_WORDS
    );

    const buyerSignals = countSignals(
      combinedText,
      BUYER_WORDS
    );

    const relevant = productRelevant(
      combinedText,
      product
    );

    const badPage = looksLikeBadPage(
      combinedText,
      candidate.url
    );

    // 产品完全无关，直接淘汰
    if (!relevant) {
      continue;
    }

    // 明显厂家/供应商，直接淘汰
    if (supplierSignals >= 3 && buyerSignals < 3) {
      continue;
    }

    // 明显文章/目录/买家名单，直接淘汰
    if (badPage) {
      continue;
    }

    // 没有任何买家属性，不进入最终列表
    if (buyerSignals < 1) {
      continue;
    }

    const companyIdentity =
      cleanCompanyName(
        siteName || title || candidate.title,
        candidate.domain
      );

    if (!companyIdentity) {
      continue;
    }

    const type = determineType(combinedText);

    const result = {
      company: companyIdentity,
      companyIdentity: true,
      country: market,
      type,
      website: origin,
      source: "Tavily + Website Verification",
      description: candidate.snippet || homepageText.slice(0, 500),
      keyword: candidate.keyword,

      verified: true,
      websiteVerified: true,

      productRelevant: relevant,

      buyerSignals,
      supplierSignals,

      pageType: "company",

      email: "",
      emailSource: "",

      qualityScore: 0,

      qualityReason: ""
    };

    result.qualityScore = calculateQuality(result);
    result.qualityReason = makeReason(result);

    // 最低质量线
    if (result.qualityScore < 50) {
      continue;
    }

    verifiedCandidates.push(result);
  }

  // 同一公司/域名去重
  const unique = [];
  const finalSeen = new Set();

  for (const item of verifiedCandidates) {
    const key = getDomain(item.website);

    if (!key || finalSeen.has(key)) {
      continue;
    }

    finalSeen.add(key);
    unique.push(item);
  }

  unique.sort((a, b) => {
    return b.qualityScore - a.qualityScore;
  });

  return unique.slice(0, 15);
}
