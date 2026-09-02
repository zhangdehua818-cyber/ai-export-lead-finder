import { webSearch } from "./modules/searchAPI.js";

const BLOCKED_DOMAINS = [
  "tradewheel.com",
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
  "go4worldbusiness.com",
  "europages.com",
  "kompass.com",
  "thomasnet.com",
  "yellowpages.com",
  "yelp.com",
  "facebook.com",
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "reddit.com",
  "wikipedia.org"
];

const DIRECTORY_WORDS = [
  "buyers list",
  "buyer list",
  "buyers directory",
  "buyer directory",
  "importers list",
  "importer list",
  "supplier directory",
  "supplier list",
  "company directory",
  "b2b directory",
  "buy leads",
  "buying leads",
  "buy leads found",
  "buyers and importers list"
];

const STRONG_BUYER_WORDS = [
  "procurement",
  "purchasing",
  "purchase manager",
  "purchasing manager",
  "procurement manager",
  "sourcing manager",
  "sourcing",
  "outsourcing",
  "request for quotation",
  "rfq",
  "request a quote",
  "purchase order",
  "buying",
  "buyer",
  "buyers",
  "importer",
  "importers"
];

const BUYER_WORDS = [
  "distributor",
  "distributors",
  "dealer",
  "dealers",
  "retailer",
  "retailers",
  "brand",
  "brands",
  "wholesale",
  "wholesaler",
  "components",
  "parts",
  "equipment",
  "systems",
  "manufacturer",
  "manufacturers",
  "factory",
  "factories"
];

const SUPPLIER_WORDS = [
  "supplier",
  "suppliers",
  "supplier of",
  "manufacturer of",
  "factory direct",
  "factory",
  "factories",
  "cnc machining service",
  "machining service",
  "contract manufacturing service",
  "oem manufacturer",
  "custom manufacturing service",
  "wholesale supplier"
];

function getDomain(url) {
  try {
    return new URL(url)
      .hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function normalizeWebsite(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return "";
  }
}

function isBlockedDomain(url) {
  const domain = getDomain(url);

  if (!domain) return true;

  return BLOCKED_DOMAINS.some(blocked =>
    domain === blocked ||
    domain.endsWith("." + blocked)
  );
}

function isDirectoryPage(item) {
  const text = [
    item.title || "",
    item.snippet || "",
    item.url || ""
  ]
    .join(" ")
    .toLowerCase();

  return DIRECTORY_WORDS.some(word =>
    text.includes(word)
  );
}

function isLikelySupplier(item) {

  const text = [
    item.title || "",
    item.snippet || "",
    item.url || ""
  ]
    .join(" ")
    .toLowerCase();

  let supplierHits = 0;

  for (const word of SUPPLIER_WORDS) {
    if (text.includes(word)) {
      supplierHits++;
    }
  }

  let buyerHits = 0;

  for (const word of STRONG_BUYER_WORDS) {
    if (text.includes(word)) {
      buyerHits += 2;
    }
  }

  for (const word of BUYER_WORDS) {
    if (text.includes(word)) {
      buyerHits++;
    }
  }

  return supplierHits >= 2 && buyerHits < 3;
}

function calculateScore(item, product) {

  const text = [
    item.title || "",
    item.snippet || "",
    item.url || ""
  ]
    .join(" ")
    .toLowerCase();

  let score = 45;

  // 产品匹配
  if (
    product &&
    text.includes(product.toLowerCase())
  ) {
    score += 12;
  }

  // 强采购信号
  for (const word of STRONG_BUYER_WORDS) {
    if (text.includes(word)) {
      score += 7;
    }
  }

  // 普通买家信号
  for (const word of BUYER_WORDS) {
    if (text.includes(word)) {
      score += 3;
    }
  }

  // 供应商信号
  for (const word of SUPPLIER_WORDS) {
    if (text.includes(word)) {
      score -= 8;
    }
  }

  // 官网常见企业信息
  if (text.includes("about us")) {
    score += 2;
  }

  if (text.includes("contact us")) {
    score += 2;
  }

  if (text.includes("our company")) {
    score += 2;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

function companyName(item) {

  const title =
    item.title ||
    "Potential Buyer";

  let name =
    title
      .replace(/\s*[-|–—]\s*.*$/, "")
      .trim();

  const badNames = [
    "buyers",
    "importers",
    "suppliers",
    "company directory",
    "b2b"
  ];

  const lower =
    name.toLowerCase();

  if (
    badNames.some(word =>
      lower.includes(word)
    )
  ) {
    return "Potential Buyer";
  }

  return name.slice(0, 150);
}

async function verifyWebsite(url) {

  if (!url) {
    return {
      verified: false,
      status: null
    };
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      5000
    );

  try {

    const response =
      await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 AI-Export-Lead-Finder/3.4"
        }
      });

    clearTimeout(timeout);

    return {
      verified:
        response.status >= 200 &&
        response.status < 500,

      status:
        response.status
    };

  } catch {

    clearTimeout(timeout);

    return {
      verified: false,
      status: null
    };

  }
}

export async function searchCompanies(
  product,
  country
) {

  if (!product || !country) {
    throw new Error(
      "产品和目标国家不能为空"
    );
  }

  /*
   * 不再只搜索“buyer list”
   * 而是从不同采购意图寻找真实企业
   */

  const queries = [

    `"${product}" ${country} retailer company`,

    `"${product}" ${country} distributor company`,

    `"${product}" ${country} importer company`,

    `"${product}" ${country} purchasing procurement`,

    `"${product}" ${country} sourcing purchasing`,

    `"${product}" ${country} "request for quotation"`,

    `${product} ${country} brand company`,

    `${product} ${country} wholesale company`

  ];

  const allResults = [];

  for (const query of queries) {

    try {

      const results =
        await webSearch(query);

      for (const item of results) {

        if (!item.url) {
          continue;
        }

        if (isBlockedDomain(item.url)) {
          continue;
        }

        if (isDirectoryPage(item)) {
          continue;
        }

        if (isLikelySupplier(item)) {
          continue;
        }

        const website =
          normalizeWebsite(item.url);

        if (!website) {
          continue;
        }

        const domain =
          getDomain(website);

        if (!domain) {
          continue;
        }

        const score =
          calculateScore(
            item,
            product
          );

        /*
         * 分数太低的结果直接不要
         */
        if (score < 45) {
          continue;
        }

        allResults.push({

          company:
            companyName(item),

          country,

          type:
            "Potential Buyer",

          website,

          email: "",

          description:
            item.snippet || "",

          source:
            item.source || "Tavily",

          keyword:
            query,

          score,

          websiteVerified: false,

          verificationStatus:
            "checking"

        });

      }

    } catch (error) {

      console.error(
        `Tavily搜索失败: ${query}`,
        error.message
      );

    }

  }

  /*
   * 网站域名去重
   */
  const unique =
    new Map();

  for (const company of allResults) {

    const domain =
      getDomain(
        company.website
      );

    const old =
      unique.get(domain);

    if (
      !old ||
      company.score > old.score
    ) {

      unique.set(
        domain,
        company
      );

    }

  }

  let companies =
    Array.from(
      unique.values()
    );

  /*
   * 优先验证高分企业
   * 最多验证前20个
   */
  companies.sort(
    (a, b) =>
      b.score - a.score
  );

  const verificationTargets =
    companies.slice(0, 20);

  for (
    const company of verificationTargets
  ) {

    const verification =
      await verifyWebsite(
        company.website
      );

    company.websiteVerified =
      verification.verified;

    company.verificationStatus =
      verification.verified
        ? "verified"
        : "unverified";

    if (verification.verified) {
      company.score = Math.min(
        100,
        company.score + 5
      );
    } else {
      company.score = Math.max(
        0,
        company.score - 8
      );
    }

  }

  /*
   * 最终排序
   */
  companies.sort(
    (a, b) =>
      b.score - a.score
  );

  /*
   * 最终最多30个
   */
  return companies.slice(0, 30);
}
