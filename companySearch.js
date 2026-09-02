import { webSearch } from "./modules/searchAPI.js";

/**
 * AI外贸客户开发助手 V3.5
 * 真实买家识别搜索引擎
 *
 * 核心原则：
 * 1. 不把买家名单网站当客户
 * 2. 不把供应商/工厂当客户
 * 3. 不把物流公司当客户
 * 4. 不把文章/博客当客户
 * 5. 尽可能寻找真实企业官网
 * 6. 宁可少，也不要垃圾客户
 */

const BLOCKED_DOMAINS = [
  "tradewheel.com",
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
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "reddit.com",
  "pinterest.com",
  "wikipedia.org",
  "amazon.com",
  "ebay.com",
  "etsy.com",
  "walmart.com"
];

const BLOCKED_PATH_WORDS = [
  "buyers-list",
  "buyer-list",
  "buyers",
  "importers-list",
  "importer-list",
  "suppliers-list",
  "supplier-list",
  "supplier-directory",
  "buyer-directory",
  "b2b-directory",
  "buying-leads",
  "buying-lead",
  "rfq-list",
  "request-list"
];

const SUPPLIER_WORDS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "supplier",
  "suppliers",
  "wholesale supplier",
  "factory direct",
  "oem manufacturer",
  "odm manufacturer",
  "cnc machining",
  "machining service",
  "contract manufacturer",
  "production factory",
  "custom manufacturer",
  "made in china"
];

const LOGISTICS_WORDS = [
  "freight",
  "freight forwarding",
  "freight forwarder",
  "shipping company",
  "logistics",
  "cargo",
  "warehousing",
  "customs broker",
  "transportation",
  "air freight",
  "ocean freight"
];

const DIRECTORY_WORDS = [
  "directory",
  "buyers list",
  "buyer list",
  "supplier directory",
  "company directory",
  "importer list",
  "buyers and importers",
  "buying leads",
  "rfq marketplace",
  "marketplace"
];

const BUYER_WORDS = [
  "retailer",
  "retail",
  "distributor",
  "distributors",
  "importer",
  "importers",
  "wholesaler",
  "wholesale",
  "buyer",
  "buyers",
  "purchasing",
  "procurement",
  "sourcing",
  "purchase",
  "purchase order",
  "brand",
  "ecommerce",
  "e-commerce",
  "online store",
  "shop",
  "stores",
  "dealer",
  "dealers",
  "reseller",
  "resellers"
];

const PRODUCT_BUYING_WORDS = [
  "phone case",
  "phone cases",
  "mobile accessories",
  "mobile phone accessories",
  "cell phone accessories",
  "smartphone accessories",
  "phone accessories"
];

function normalizeUrl(url) {
  if (!url) return "";

  try {
    let value = String(url).trim();

    if (!/^https?:\/\//i.test(value)) {
      value = "https://" + value;
    }

    const u = new URL(value);

    return `${u.protocol}//${u.hostname}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return "";
  }
}

function getDomain(url) {
  try {
    return new URL(normalizeUrl(url)).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function domainBlocked(url) {
  const domain = getDomain(url);

  if (!domain) return true;

  return BLOCKED_DOMAINS.some(blocked => {
    return domain === blocked || domain.endsWith("." + blocked);
  });
}

function pathBlocked(url) {
  const value = String(url || "").toLowerCase();

  return BLOCKED_PATH_WORDS.some(word => value.includes(word));
}

function containsAny(text, words) {
  const value = String(text || "").toLowerCase();

  return words.some(word => value.includes(word));
}

function looksLikeSupplier(text) {
  return containsAny(text, SUPPLIER_WORDS);
}

function looksLikeLogistics(text) {
  return containsAny(text, LOGISTICS_WORDS);
}

function looksLikeDirectory(text) {
  return containsAny(text, DIRECTORY_WORDS);
}

function buyerSignalCount(text) {
  const value = String(text || "").toLowerCase();

  let count = 0;

  for (const word of BUYER_WORDS) {
    if (value.includes(word)) {
      count++;
    }
  }

  return count;
}

function productSignalCount(text, product) {
  const value = String(text || "").toLowerCase();

  const p = String(product || "").toLowerCase();

  let count = 0;

  if (p && value.includes(p)) {
    count += 3;
  }

  for (const word of PRODUCT_BUYING_WORDS) {
    if (value.includes(word)) {
      count++;
    }
  }

  return count;
}

function isProbablyCompanyTitle(title) {
  if (!title) return false;

  const value = String(title).trim();

  if (value.length < 2) return false;

  const badTitles = [
    "potential buyer",
    "complete guide",
    "global phone case dealers",
    "phone case buyer",
    "phone case buyers",
    "phone case importer",
    "phone case importers",
    "buyers and importers",
    "buying leads",
    "supplier list",
    "buyer list",
    "home",
    "homepage",
    "contact us",
    "about us"
  ];

  const lower = value.toLowerCase();

  if (badTitles.includes(lower)) {
    return false;
  }

  if (
    lower.includes("buyers list") ||
    lower.includes("importers list") ||
    lower.includes("supplier list") ||
    lower.includes("complete guide") ||
    lower.includes("connecting manufacturers")
  ) {
    return false;
  }

  return true;
}

function cleanCompanyName(title, domain) {
  if (isProbablyCompanyTitle(title)) {
    let name = String(title)
      .replace(/\s*\|\s*.*$/g, "")
      .replace(/\s*-\s*Home.*$/gi, "")
      .trim();

    if (name.length > 80) {
      name = name.substring(0, 80).trim();
    }

    return name;
  }

  if (domain) {
    const first = domain.split(".")[0];

    return first
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  return "";
}

async function verifyWebsite(url) {
  const cleanUrl = normalizeUrl(url);

  if (!cleanUrl) {
    return {
      verified: false,
      title: "",
      text: ""
    };
  }

  try {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
    }, 7000);

    const response = await fetch(cleanUrl, {
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
        title: "",
        text: ""
      };
    }

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    const title = titleMatch
      ? titleMatch[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 15000);

    return {
      verified: true,
      title,
      text
    };
  } catch {
    return {
      verified: false,
      title: "",
      text: ""
    };
  }
}

function buildSearchQueries(product, country) {
  return [
    `"${product}" "${country}" retailer`,
    `"${product}" "${country}" distributor`,
    `"${product}" "${country}" importer`,
    `"${product}" "${country}" wholesaler`,
    `"${product}" "${country}" "mobile accessories" company`,
    `"${product}" "${country}" "phone accessories" retailer`,
    `"${product}" "${country}" purchasing`,
    `"${product}" "${country}" procurement`,
    `"${product}" "${country}" sourcing`,
    `"${product}" "${country}" "request for quotation"`
  ];
}

function candidateQuality(candidate, product) {
  const combined = [
    candidate.title,
    candidate.description,
    candidate.url,
    candidate.verifiedTitle,
    candidate.verifiedText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!candidate.url) return -100;

  if (domainBlocked(candidate.url)) {
    return -100;
  }

  if (pathBlocked(candidate.url)) {
    return -100;
  }

  if (looksLikeDirectory(combined)) {
    return -80;
  }

  if (looksLikeLogistics(combined)) {
    return -80;
  }

  let score = 0;

  const buyerSignals = buyerSignalCount(combined);

  const productSignals = productSignalCount(combined, product);

  score += Math.min(buyerSignals * 12, 48);

  score += Math.min(productSignals * 8, 32);

  if (candidate.verified) {
    score += 10;
  }

  if (candidate.email) {
    score += 8;
  }

  if (
    combined.includes("contact") ||
    combined.includes("sales") ||
    combined.includes("purchase")
  ) {
    score += 5;
  }

  if (looksLikeSupplier(combined)) {
    score -= 65;
  }

  if (
    combined.includes("manufacturer") &&
    !combined.includes("retailer") &&
    !combined.includes("distributor") &&
    !combined.includes("importer")
  ) {
    score -= 50;
  }

  return score;
}

function detectCompanyType(candidate) {
  const combined = [
    candidate.title,
    candidate.description,
    candidate.verifiedTitle,
    candidate.verifiedText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (looksLikeLogistics(combined)) {
    return "";
  }

  if (looksLikeSupplier(combined)) {
    const hasBuyer =
      combined.includes("retailer") ||
      combined.includes("distributor") ||
      combined.includes("importer") ||
      combined.includes("wholesaler");

    if (!hasBuyer) {
      return "";
    }
  }

  if (
    combined.includes("retailer") ||
    combined.includes("retail") ||
    combined.includes("online store") ||
    combined.includes("e-commerce")
  ) {
    return "Retailer";
  }

  if (
    combined.includes("distributor") ||
    combined.includes("dealer")
  ) {
    return "Distributor";
  }

  if (
    combined.includes("importer") ||
    combined.includes("importers")
  ) {
    return "Importer";
  }

  if (
    combined.includes("wholesaler") ||
    combined.includes("wholesale")
  ) {
    return "Wholesaler";
  }

  if (
    combined.includes("brand")
  ) {
    return "Brand";
  }

  if (
    combined.includes("purchasing") ||
    combined.includes("procurement") ||
    combined.includes("sourcing")
  ) {
    return "Potential Buyer";
  }

  return "Potential Buyer";
}

export async function searchCompanies(product, country) {
  const queries = buildSearchQueries(product, country);

  const rawCandidates = [];

  for (const query of queries) {
    try {
      const results = await webSearch(query);

      if (!Array.isArray(results)) {
        continue;
      }

      for (const item of results) {
        if (!item) continue;

        const url = normalizeUrl(item.url || item.link);

        if (!url) continue;

        if (domainBlocked(url)) continue;

        if (pathBlocked(url)) continue;

        rawCandidates.push({
          title: item.title || "",
          description: item.snippet || item.description || "",
          url,
          source: "Tavily",
          keyword: query
        });
      }
    } catch (error) {
      console.error("Search query failed:", query, error.message);
    }
  }

  // 按域名去重
  const domainMap = new Map();

  for (const candidate of rawCandidates) {
    const domain = getDomain(candidate.url);

    if (!domain) continue;

    if (!domainMap.has(domain)) {
      domainMap.set(domain, candidate);
    } else {
      const existing = domainMap.get(domain);

      const oldText =
        `${existing.title} ${existing.description}`.length;

      const newText =
        `${candidate.title} ${candidate.description}`.length;

      if (newText > oldText) {
        domainMap.set(domain, candidate);
      }
    }
  }

  let candidates = Array.from(domainMap.values());

  // 第一轮粗筛
  candidates = candidates.filter(candidate => {
    const text = [
      candidate.title,
      candidate.description,
      candidate.url
    ].join(" ");

    if (looksLikeLogistics(text)) return false;

    if (looksLikeDirectory(text)) return false;

    if (pathBlocked(candidate.url)) return false;

    return true;
  });

  // 最多验证前 40 个
  candidates = candidates.slice(0, 40);

  const verifiedCandidates = [];

  for (const candidate of candidates) {
    const verified = await verifyWebsite(candidate.url);

    const merged = {
      ...candidate,
      verified: verified.verified,
      verifiedTitle: verified.title,
      verifiedText: verified.text
    };

    const quality = candidateQuality(merged, product);

    if (quality < 25) {
      continue;
    }

    const company = cleanCompanyName(
      verified.title || candidate.title,
      getDomain(candidate.url)
    );

    if (!company) continue;

    const type = detectCompanyType(merged);

    if (!type) continue;

    verifiedCandidates.push({
      company,
      country,
      type,
      website: candidate.url,
      description:
        verified.text.substring(0, 800) ||
        candidate.description ||
        "",
      source: "Tavily",
      keyword: candidate.keyword,
      verified: verified.verified,
      searchQuality: quality
    });
  }

  // 按质量排序
  verifiedCandidates.sort(
    (a, b) => b.searchQuality - a.searchQuality
  );

  // 最终最多 20 个
  return verifiedCandidates.slice(0, 20);
}
