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
  "tradewheel.com",
  "exporthub.com",
  "globalimporter.net",
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
  "pinterest.com",
  "x.com"
];

const LOGISTICS_DOMAINS = [
  "dhl.com",
  "fedex.com",
  "ups.com",
  "freightos.com",
  "flexport.com",
  "bookairfreight.com"
];

const DIRECTORY_WORDS = [
  "buyer list",
  "buyers list",
  "buyer directory",
  "buyers directory",
  "importer list",
  "importers list",
  "supplier directory",
  "supplier list",
  "buying leads",
  "buying lead",
  "b2b directory",
  "wholesale directory",
  "company directory",
  "directory of",
  "thousands of buyers",
  "buyers from",
  "importers from"
];

const ARTICLE_WORDS = [
  "complete guide",
  "ultimate guide",
  "how to",
  "what is",
  "tips",
  "guide to",
  "blog",
  "article",
  "news",
  "case study",
  "best products",
  "top products",
  "review"
];

const LOGISTICS_WORDS = [
  "freight",
  "freight forwarding",
  "forwarder",
  "shipping",
  "logistics",
  "cargo",
  "customs clearance",
  "air freight",
  "ocean freight",
  "warehouse logistics",
  "3pl",
  "testing laboratory",
  "product testing"
];

const SUPPLIER_WORDS = [
  "we manufacture",
  "we manufacturer",
  "manufacturer",
  "manufacturing",
  "factory",
  "our factory",
  "factory direct",
  "oem manufacturer",
  "odm manufacturer",
  "oem/odm",
  "we produce",
  "production facility",
  "supplier",
  "supplier of",
  "wholesale supplier",
  "direct supplier",
  "made by us",
  "made in our factory"
];

const BUYER_WORDS = [
  "we import",
  "we source",
  "we are looking for suppliers",
  "looking for suppliers",
  "seeking suppliers",
  "seeking manufacturers",
  "looking for manufacturers",
  "our suppliers",
  "purchase from manufacturers",
  "purchasing department",
  "procurement department",
  "procurement team",
  "purchasing team",
  "sourcing team",
  "sourcing department",
  "vendor application",
  "vendor registration",
  "new vendor",
  "supplier onboarding",
  "supplier application",
  "become a vendor",
  "rfq",
  "request for quotation"
];

const CHANNEL_WORDS = [
  "wholesaler",
  "wholesale",
  "distributor",
  "retailer",
  "retail",
  "reseller",
  "brand",
  "ecommerce",
  "e-commerce",
  "online store",
  "shop",
  "mobile accessories",
  "phone accessories"
];

const DOWNSTREAM_RECRUIT_WORDS = [
  "become a distributor",
  "become an authorized distributor",
  "authorized distributor",
  "distributor application",
  "apply to become a distributor",
  "distributor program",
  "join our distributor",
  "distributor opportunity",
  "exclusive distributor",
  "minimum purchase requirement"
];

const SELLER_SIDE_WORDS = [
  "shop now",
  "buy now",
  "add to cart",
  "our products",
  "our collection",
  "our wholesale prices",
  "we sell",
  "order from us",
  "customers can purchase",
  "customers purchase",
  "purchase our products"
];

function safeString(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;

  if (typeof value === "number") return String(value);

  if (typeof value === "object") {
    return (
      value.name ||
      value.company ||
      value.label ||
      value.value ||
      value.country ||
      ""
    );
  }

  return String(value);
}

function normalizeProduct(product) {
  const value = safeString(product).trim();

  const map = {
    "手机壳": "phone case",
    "手机保护壳": "phone case",
    "手机套": "phone case",
    "手机配件": "mobile phone accessories",
    "充电器": "phone charger",
    "手机充电器": "phone charger",
    "数据线": "USB charging cable",
    "充电线": "USB charging cable",
    "耳机": "earphones",
    "蓝牙耳机": "wireless earbuds",
    "移动电源": "power bank",
    "充电宝": "power bank",
    "平板保护壳": "tablet case",
    "电脑包": "laptop bag"
  };

  return map[value] || value;
}

function normalizeCountry(country) {
  const value = safeString(country).trim();

  const map = {
    "美国": "United States",
    "美国市场": "United States",
    "英国": "United Kingdom",
    "德国": "Germany",
    "法国": "France",
    "加拿大": "Canada",
    "澳大利亚": "Australia",
    "日本": "Japan",
    "韩国": "South Korea",
    "新加坡": "Singapore",
    "阿联酋": "United Arab Emirates"
  };

  return map[value] || value;
}

function cleanText(text) {
  return safeString(text)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getHostname(url) {
  try {
    return new URL(url)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");
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

function isBlockedDomain(url) {
  const host = getHostname(url);

  if (!host) return true;

  return BLOCKED_DOMAINS.some(
    domain =>
      host === domain ||
      host.endsWith("." + domain)
  );
}

function isLogisticsDomain(url) {
  const host = getHostname(url);

  return LOGISTICS_DOMAINS.some(
    domain =>
      host === domain ||
      host.endsWith("." + domain)
  );
}

function containsAny(text, words) {
  const lower = safeString(text).toLowerCase();

  return words.filter(word =>
    lower.includes(word.toLowerCase())
  );
}

function looksLikeBadPath(url) {
  const value = safeString(url).toLowerCase();

  const badPaths = [
    "/blog/",
    "/article/",
    "/articles/",
    "/news/",
    "/guide/",
    "/guides/",
    "/buyers/",
    "/buyer/",
    "/importers/",
    "/importer/",
    "/buying-leads",
    "/supplier-directory",
    "/directory/",
    "/category/",
    "/tag/",
    "/search?",
    "/list/"
  ];

  return badPaths.some(path =>
    value.includes(path)
  );
}

function getProductTerms(product) {
  const p =
    normalizeProduct(product).toLowerCase();

  const terms = [p];

  if (p.includes("phone case")) {
    terms.push(
      "phone case",
      "cell phone case",
      "cellphone case",
      "mobile phone case",
      "smartphone case",
      "mobile case",
      "phone cases",
      "mobile accessories",
      "cell phone accessories"
    );
  }

  if (p.includes("charger")) {
    terms.push(
      "phone charger",
      "mobile charger",
      "usb charger",
      "charging adapter"
    );
  }

  if (p.includes("cable")) {
    terms.push(
      "usb cable",
      "charging cable",
      "phone cable",
      "data cable"
    );
  }

  if (p.includes("earbud")) {
    terms.push(
      "wireless earbuds",
      "bluetooth earbuds",
      "earphones",
      "wireless earphones"
    );
  }

  if (p.includes("power bank")) {
    terms.push(
      "power bank",
      "portable charger",
      "battery pack"
    );
  }

  return [...new Set(terms)];
}

function getRelevanceEvidence(product, text) {
  const lower =
    safeString(text).toLowerCase();

  const terms =
    getProductTerms(product);

  return terms.filter(term =>
    lower.includes(term.toLowerCase())
  );
}

function extractTitle(html) {
  const match =
    html.match(
      /<title[^>]*>([\s\S]*?)<\/title>/i
    );

  return match
    ? cleanText(match[1])
    : "";
}

function extractSiteName(html) {
  const patterns = [
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function getCompanyName(title, siteName, url) {

  if (siteName) {
    return siteName.trim();
  }

  if (title) {

    const parts = title
      .split(/\s+[|—–-]\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      return parts[0];
    }

    if (
      !/guide/i.test(title) &&
      !/buyer/i.test(title) &&
      !/importer/i.test(title) &&
      !/wholesale cell phone accessories/i.test(title)
    ) {
      return title.trim();
    }
  }

  const host =
    getHostname(url);

  return host
    .replace(/\.(com|net|org|co|us|uk)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, x =>
      x.toUpperCase()
    );
}

function classifyPage({
  title,
  text,
  url
}) {

  const combined =
    `${title} ${text}`.toLowerCase();

  const directoryEvidence =
    containsAny(
      combined,
      DIRECTORY_WORDS
    );

  const articleEvidence =
    containsAny(
      combined,
      ARTICLE_WORDS
    );

  const logisticsEvidence =
    containsAny(
      combined,
      LOGISTICS_WORDS
    );

  const supplierEvidence =
    containsAny(
      combined,
      SUPPLIER_WORDS
    );

  const buyerEvidence =
    containsAny(
      combined,
      BUYER_WORDS
    );

  const channelEvidence =
    containsAny(
      combined,
      CHANNEL_WORDS
    );

  const downstreamRecruitEvidence =
    containsAny(
      combined,
      DOWNSTREAM_RECRUIT_WORDS
    );

  const sellerSideEvidence =
    containsAny(
      combined,
      SELLER_SIDE_WORDS
    );

  let pageType = "company";

  if (directoryEvidence.length) {
    pageType = "directory";
  }

  if (logisticsEvidence.length) {
    pageType = "logistics";
  }

  if (
    articleEvidence.length &&
    !channelEvidence.length &&
    !buyerEvidence.length
  ) {
    pageType = "article";
  }

  const strongSupplier =
    supplierEvidence.length >= 2 ||
    /we manufacture|our factory|factory direct|oem manufacturer|odm manufacturer/i.test(
      combined
    );

  if (strongSupplier) {
    pageType = "supplier";
  }

  const downstreamRecruiter =
    downstreamRecruitEvidence.length >= 1;

  return {
    pageType,
    directoryEvidence,
    articleEvidence,
    logisticsEvidence,
    supplierEvidence,
    buyerEvidence,
    channelEvidence,
    downstreamRecruitEvidence,
    sellerSideEvidence,
    downstreamRecruiter,
    supplierStrong: strongSupplier
  };
}

async function fetchWebsite(url) {

  const origin =
    getOrigin(url);

  if (!origin) {
    return {
      verified: false,
      url,
      finalUrl: url,
      title: "",
      siteName: "",
      text: "",
      html: "",
      status: 0
    };
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      8000
    );

  try {

    const response =
      await fetch(origin, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

    const html =
      await response.text();

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        verified: false,
        url,
        finalUrl:
          response.url || origin,
        title: "",
        siteName: "",
        text: "",
        html: "",
        status: response.status
      };
    }

    return {
      verified: true,
      url,
      finalUrl:
        response.url || origin,
      title:
        extractTitle(html),
      siteName:
        extractSiteName(html),
      text:
        cleanText(html),
      html,
      status:
        response.status
    };

  } catch (error) {

    clearTimeout(timeout);

    return {
      verified: false,
      url,
      finalUrl: url,
      title: "",
      siteName: "",
      text: "",
      html: "",
      status: 0
    };
  }
}

export async function searchCompanies(
  product,
  country
) {

  const normalizedProduct =
    normalizeProduct(product);

  const normalizedCountry =
    normalizeCountry(country);

  if (
    !normalizedProduct ||
    !normalizedCountry
  ) {
    return [];
  }

  const queries = [

    `"${normalizedProduct}" ${normalizedCountry} retailer`,

    `"${normalizedProduct}" ${normalizedCountry} wholesaler`,

    `"${normalizedProduct}" ${normalizedCountry} distributor`,

    `"${normalizedProduct}" ${normalizedCountry} importer`,

    `"${normalizedProduct}" ${normalizedCountry} purchasing`,

    `"${normalizedProduct}" ${normalizedCountry} "vendor application"`,

    `"${normalizedProduct}" ${normalizedCountry} "looking for suppliers"`,

    `"${normalizedProduct}" ${normalizedCountry} brand`

  ];

  const rawCandidates = [];

  for (const query of queries) {

    try {

      const results =
        await webSearch(query);

      if (!Array.isArray(results)) {
        continue;
      }

      for (const item of results) {

        if (!item) continue;

        const url =
          safeString(item.url);

        if (!url) continue;

        if (isBlockedDomain(url)) {
          continue;
        }

        if (isLogisticsDomain(url)) {
          continue;
        }

        if (looksLikeBadPath(url)) {
          continue;
        }

        rawCandidates.push({

          title:
            safeString(item.title),

          url,

          snippet:
            safeString(
              item.snippet ||
              item.description ||
              item.content
            ),

          source:
            safeString(
              item.source ||
              "Tavily"
            ),

          keyword:
            query
        });
      }

    } catch (error) {

      console.error(
        "Search query failed:",
        query,
        error.message
      );

    }
  }

  const unique =
    new Map();

  for (const candidate of rawCandidates) {

    const host =
      getHostname(candidate.url);

    if (!host) continue;

    if (!unique.has(host)) {
      unique.set(
        host,
        candidate
      );
    }
  }

  const candidates =
    [...unique.values()]
      .slice(0, 30);

  const finalResults = [];

  for (const candidate of candidates) {

    const website =
      await fetchWebsite(
        candidate.url
      );

    if (!website.verified) {
      continue;
    }

    const pageText =
      website.text.slice(
        0,
        60000
      );

    const title =
      website.title ||
      candidate.title;

    const siteName =
      website.siteName ||
      "";

    const combinedText = `
      ${title}
      ${siteName}
      ${candidate.snippet}
      ${pageText}
    `;

    const classification =
      classifyPage({
        title,
        text: combinedText,
        url: candidate.url
      });

    const relevanceEvidence =
      getRelevanceEvidence(
        normalizedProduct,
        combinedText
      );

    if (!relevanceEvidence.length) {
      continue;
    }

    if (
      classification.pageType ===
      "directory"
    ) {
      continue;
    }

    if (
      classification.pageType ===
      "article"
    ) {
      continue;
    }

    if (
      classification.pageType ===
      "logistics"
    ) {
      continue;
    }

    if (
      classification.supplierStrong
    ) {
      continue;
    }

    if (
      classification.downstreamRecruiter
    ) {
      continue;
    }

    const company =
      getCompanyName(
        title,
        siteName,
        website.finalUrl
      );

    const badCompanyName =
      /complete guide|ultimate guide|potential buyer|buyer list|importer list|how to/i
        .test(company);

    if (badCompanyName) {
      continue;
    }

    const isChannelCandidate =
      classification.channelEvidence
        .length > 0;

    const isDirectBuyer =
      classification.buyerEvidence
        .length > 0;

    if (
      !isDirectBuyer &&
      !isChannelCandidate
    ) {
      continue;
    }

    let type =
      "Potential Buyer";

    if (isDirectBuyer) {
      type =
        "Direct Buyer";
    } else if (isChannelCandidate) {
      type =
        "Channel Buyer";
    }

    let qualityReason = "";

    if (isDirectBuyer) {

      qualityReason =
        "官网存在采购、进口、供应商或采购部门相关证据。";

    } else if (isChannelCandidate) {

      qualityReason =
        "官网显示其为零售商、批发商、经销商、品牌商或销售渠道，可作为潜在渠道客户。";
    }

    finalResults.push({

      company,

      country:
        normalizedCountry,

      website:
        website.finalUrl ||
        getOrigin(candidate.url),

      websiteVerified:
        true,

      verified:
        true,

      title,

      type,

      pageType:
        classification.pageType,

      buyerEvidence:
        classification.buyerEvidence,

      channelEvidence:
        classification.channelEvidence,

      supplierEvidence:
        classification.supplierEvidence,

      sellerEvidence:
        classification.sellerSideEvidence,

      relevanceEvidence,

      downstreamRecruiter:
        classification.downstreamRecruiter,

      supplierStrong:
        classification.supplierStrong,

      description:
        candidate.snippet ||
        pageText.slice(0, 500),

      source:
        candidate.source ||
        "Tavily",

      keyword:
        candidate.keyword,

      qualityReason
    });
  }

  const resultMap =
    new Map();

  for (const item of finalResults) {

    const host =
      getHostname(item.website);

    if (!host) continue;

    if (!resultMap.has(host)) {
      resultMap.set(
        host,
        item
      );
    }
  }

  return [
    ...resultMap.values()
  ].slice(0, 15);
}
