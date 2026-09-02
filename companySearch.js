import { webSearch } from "./modules/searchAPI.js";

/**
 * AI外贸客户开发助手 V3.6
 *
 * 二次企业核验：
 *
 * 第一层：
 * Tavily 找候选企业
 *
 * 第二层：
 * 访问候选企业官网首页
 *
 * 第三层：
 * 分析企业身份
 *
 * 第四层：
 * 判断是否真的属于买家
 *
 * 最终：
 * 只返回值得开发的企业
 */

const BLOCKED_DOMAINS = [
  // B2B / 供应商 / 买家目录
  "tradewheel.com",
  "exporthub.com",
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
  "go4worldbusiness.com",

  // 社交平台
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "reddit.com",
  "pinterest.com",

  // 大型平台
  "amazon.com",
  "ebay.com",
  "etsy.com",
  "walmart.com",

  // 其他目录
  "yellowpages.com",
  "yelp.com",
  "mapquest.com",
  "manta.com",
  "zoominfo.com",
  "crunchbase.com",
  "dnb.com",
  "dnb.com",
  "glassdoor.com",
  "indeed.com",

  // 内容/百科
  "wikipedia.org"
];

const BLOCKED_PATH_WORDS = [
  "buyers-list",
  "buyer-list",
  "buyers_list",
  "buyer_list",
  "importers-list",
  "importer-list",
  "importers_list",
  "importer_list",
  "suppliers-list",
  "supplier-list",
  "supplier_directory",
  "supplier-directory",
  "buyer-directory",
  "buyer_directory",
  "b2b-directory",
  "b2b_directory",
  "buying-leads",
  "buying-lead",
  "rfq-list",
  "request-list",
  "buyer-card",
  "buyer-cards"
];

const CATEGORY_PATH_WORDS = [
  "browsecategory",
  "/category/",
  "/categories/",
  "/products/",
  "/product/",
  "/collections/",
  "/catalog/",
  "/catalogue/",
  "/search?",
  "/search/",
  "/tag/",
  "/blog/",
  "/article/"
];

const SUPPLIER_WORDS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "supplier",
  "suppliers",
  "factory direct",
  "oem manufacturer",
  "odm manufacturer",
  "contract manufacturer",
  "production factory",
  "custom manufacturer",
  "made in china",
  "manufactured in"
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
  "ocean freight",
  "courier service"
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
  "marketplace",
  "complete guide",
  "connecting manufacturers"
];

const STRONG_BUYER_WORDS = [
  "purchasing",
  "procurement",
  "purchase order",
  "purchase orders",
  "sourcing",
  "importer",
  "importers",
  "distributor",
  "distributors",
  "wholesaler",
  "wholesalers",
  "wholesale"
];

const BUYER_WORDS = [
  "retailer",
  "retail",
  "buyer",
  "buyers",
  "dealer",
  "dealers",
  "reseller",
  "resellers",
  "ecommerce",
  "e-commerce",
  "online store",
  "online shop",
  "brand",
  "shop",
  "stores"
];

const PRODUCT_WORDS = [
  "phone case",
  "phone cases",
  "phone accessory",
  "phone accessories",
  "mobile accessories",
  "mobile phone accessories",
  "cell phone accessories",
  "smartphone accessories"
];

function safeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.text ||
      value.title ||
      value.name ||
      value.value ||
      ""
    );
  }

  return "";
}

function normalizeUrl(url) {
  if (!url) return "";

  try {
    let value = safeText(url).trim();

    if (!/^https?:\/\//i.test(value)) {
      value = "https://" + value;
    }

    const u = new URL(value);

    return u.toString();
  } catch {
    return "";
  }
}

function getDomain(url) {
  try {
    return new URL(normalizeUrl(url))
      .hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function getOrigin(url) {
  try {
    return new URL(normalizeUrl(url)).origin;
  } catch {
    return "";
  }
}

function isBlockedDomain(url) {
  const domain = getDomain(url);

  if (!domain) return true;

  return BLOCKED_DOMAINS.some(blocked => {
    return (
      domain === blocked ||
      domain.endsWith("." + blocked)
    );
  });
}

function hasBlockedPath(url) {
  const value = safeText(url).toLowerCase();

  return BLOCKED_PATH_WORDS.some(word =>
    value.includes(word)
  );
}

function isCategoryPage(url) {
  const value = safeText(url).toLowerCase();

  return CATEGORY_PATH_WORDS.some(word =>
    value.includes(word)
  );
}

function containsAny(text, words) {
  const value = safeText(text).toLowerCase();

  return words.some(word =>
    value.includes(word)
  );
}

function countWords(text, words) {
  const value = safeText(text).toLowerCase();

  let count = 0;

  for (const word of words) {
    if (value.includes(word)) {
      count++;
    }
  }

  return count;
}

function stripHtml(html) {
  return safeText(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const match = safeText(html).match(
    /<title[^>]*>([\s\S]*?)<\/title>/i
  );

  if (!match) return "";

  return stripHtml(match[1]);
}

function extractMetaDescription(html) {
  const value = safeText(html);

  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match) {
      return safeText(match[1]).trim();
    }
  }

  return "";
}

function extractEmails(html) {
  const emails =
    safeText(html).match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    ) || [];

  return [
    ...new Set(
      emails.map(email =>
        email.trim().toLowerCase()
      )
    )
  ];
}

function cleanCompanyName(title, domain) {

  let value = safeText(title)
    .replace(/\s*\|\s*.*$/g, "")
    .replace(/\s*-\s*Home.*$/gi, "")
    .replace(/\s*-\s*Official.*$/gi, "")
    .trim();

  const invalidTitles = [
    "home",
    "homepage",
    "contact us",
    "about us",
    "complete guide",
    "potential buyer",
    "buyers list",
    "buyer list",
    "importers list",
    "supplier list",
    "phone case buyers",
    "phone case importers"
  ];

  const lower = value.toLowerCase();

  if (
    !value ||
    invalidTitles.includes(lower) ||
    lower.includes("buyers list") ||
    lower.includes("importers list") ||
    lower.includes("connecting manufacturers") ||
    lower.includes("complete guide")
  ) {
    value = "";
  }

  if (!value && domain) {
    const root = domain.split(".")[0];

    value = root
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, c =>
        c.toUpperCase()
      );
  }

  return value.substring(0, 100);
}

/**
 * 判断官网是不是一个“真实企业网站”
 */
function analyzeBusinessIdentity(homepage) {

  const text = [
    homepage.title,
    homepage.description,
    homepage.text
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let identityScore = 0;

  // 网站有标题
  if (homepage.title) {
    identityScore += 10;
  }

  // 有描述
  if (homepage.description) {
    identityScore += 5;
  }

  // 联系方式
  if (
    homepage.emails.length > 0 ||
    text.includes("contact us") ||
    text.includes("contact")
  ) {
    identityScore += 10;
  }

  // About
  if (
    text.includes("about us") ||
    text.includes("about our company") ||
    text.includes("our company")
  ) {
    identityScore += 8;
  }

  // 公司常见身份
  if (
    text.includes("company") ||
    text.includes("corporation") ||
    text.includes("inc.") ||
    text.includes("llc") ||
    text.includes("ltd")
  ) {
    identityScore += 8;
  }

  // 地址
  if (
    text.includes("address") ||
    text.includes("location") ||
    text.includes("headquarters")
  ) {
    identityScore += 5;
  }

  // 电话
  if (
    text.includes("phone") ||
    text.includes("tel")
  ) {
    identityScore += 5;
  }

  // 社交/商业信息
  if (
    text.includes("terms") ||
    text.includes("privacy") ||
    text.includes("shipping") ||
    text.includes("returns")
  ) {
    identityScore += 5;
  }

  return {
    score: Math.min(identityScore, 50),
    text
  };
}

/**
 * 判断是否为买家
 */
function analyzeBuyerIdentity(
  text,
  product
) {

  const strongBuyer =
    countWords(
      text,
      STRONG_BUYER_WORDS
    );

  const buyer =
    countWords(
      text,
      BUYER_WORDS
    );

  const productSignals =
    countWords(
      text,
      PRODUCT_WORDS
    );

  const productLower =
    safeText(product).toLowerCase();

  let customProduct = 0;

  if (
    productLower &&
    text.includes(productLower)
  ) {
    customProduct = 3;
  }

  return {
    strongBuyer,
    buyer,
    product:
      productSignals + customProduct
  };
}

/**
 * 企业身份分类
 */
function detectCompanyType(
  text,
  buyer
) {

  const value =
    safeText(text).toLowerCase();

  if (
    value.includes("importer") ||
    value.includes("importers")
  ) {
    return "Importer";
  }

  if (
    value.includes("distributor") ||
    value.includes("distributors") ||
    value.includes("dealer") ||
    value.includes("dealers")
  ) {
    return "Distributor";
  }

  if (
    value.includes("wholesaler") ||
    value.includes("wholesalers") ||
    value.includes("wholesale")
  ) {
    return "Wholesaler";
  }

  if (
    value.includes("retailer") ||
    value.includes("retail") ||
    value.includes("online store") ||
    value.includes("online shop") ||
    value.includes("ecommerce") ||
    value.includes("e-commerce")
  ) {
    return "Retailer";
  }

  if (
    value.includes("brand")
  ) {
    return "Brand";
  }

  if (
    buyer.strongBuyer > 0
  ) {
    return "Potential Buyer";
  }

  return "Potential Buyer";
}

/**
 * 官网抓取
 */
async function fetchWebsite(url) {

  const origin = getOrigin(url);

  if (!origin) {
    return {
      verified: false,
      url: "",
      title: "",
      description: "",
      text: "",
      emails: []
    };
  }

  try {

    const controller =
      new AbortController();

    const timer =
      setTimeout(() => {
        controller.abort();
      }, 8000);

    const response =
      await fetch(origin, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AI-Export-Lead-Finder/3.6)"
        }
      });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        verified: false,
        url: origin,
        title: "",
        description: "",
        text: "",
        emails: []
      };
    }

    const html =
      await response.text();

    const text =
      stripHtml(html);

    const title =
      extractTitle(html);

    const description =
      extractMetaDescription(html);

    const emails =
      extractEmails(html);

    return {
      verified: true,
      url: origin,
      title,
      description,
      text: text.substring(0, 25000),
      emails
    };

  } catch (error) {

    console.error(
      "Website verification failed:",
      origin,
      error.message
    );

    return {
      verified: false,
      url: origin,
      title: "",
      description: "",
      text: "",
      emails: []
    };
  }
}

/**
 * 综合判断
 */
function evaluateCandidate(
  candidate,
  homepage,
  product
) {

  const combined = [
    candidate.title,
    candidate.description,
    candidate.url,
    homepage.title,
    homepage.description,
    homepage.text
  ]
    .filter(Boolean)
    .join(" ");

  const lower =
    combined.toLowerCase();

  // 目录
  if (
    containsAny(
      lower,
      DIRECTORY_WORDS
    )
  ) {
    return {
      keep: false,
      reason: "directory"
    };
  }

  // 物流
  if (
    containsAny(
      lower,
      LOGISTICS_WORDS
    )
  ) {
    return {
      keep: false,
      reason: "logistics"
    };
  }

  const buyer =
    analyzeBuyerIdentity(
      lower,
      product
    );

  const identity =
    analyzeBusinessIdentity(
      homepage
    );

  const supplierCount =
    countWords(
      lower,
      SUPPLIER_WORDS
    );

  /*
   * 必须有真实官网
   */
  if (!homepage.verified) {
    return {
      keep: false,
      reason: "website_not_verified"
    };
  }

  /*
   * 企业身份太弱
   */
  if (identity.score < 18) {
    return {
      keep: false,
      reason: "weak_business_identity"
    };
  }

  /*
   * 完全没有买家信号
   */
  if (
    buyer.strongBuyer === 0 &&
    buyer.buyer === 0
  ) {
    return {
      keep: false,
      reason: "no_buyer_signal"
    };
  }

  /*
   * 明显供应商，而且没有买家信号
   */
  if (
    supplierCount >= 2 &&
    buyer.strongBuyer === 0 &&
    buyer.buyer === 0
  ) {
    return {
      keep: false,
      reason: "supplier"
    };
  }

  /*
   * 产品完全不相关
   */
  if (buyer.product === 0) {
    return {
      keep: false,
      reason: "product_not_relevant"
    };
  }

  let score = 0;

  score += identity.score;

  score +=
    Math.min(
      buyer.strongBuyer * 14,
      42
    );

  score +=
    Math.min(
      buyer.buyer * 8,
      24
    );

  score +=
    Math.min(
      buyer.product * 6,
      24
    );

  if (
    homepage.emails.length > 0
  ) {
    score += 10;
  }

  /*
   * 供应商惩罚
   */
  score -=
    Math.min(
      supplierCount * 10,
      30
    );

  /*
   * 如果明确同时存在买家身份，
   * 减少供应商惩罚
   */
  if (
    buyer.strongBuyer >= 1 ||
    buyer.buyer >= 1
  ) {
    score += 5;
  }

  score =
    Math.max(
      0,
      Math.min(100, score)
    );

  /*
   * V3.6：
   * 必须达到 55 才能展示
   */
  if (score < 55) {
    return {
      keep: false,
      reason: "score_too_low",
      score
    };
  }

  const type =
    detectCompanyType(
      lower,
      buyer
    );

  return {
    keep: true,
    score,
    type,
    identityScore: identity.score,
    buyerSignals: buyer,
    supplierCount
  };
}

function buildQueries(
  product,
  country
) {

  return [

    `"${product}" "${country}" retailer company`,

    `"${product}" "${country}" distributor company`,

    `"${product}" "${country}" importer company`,

    `"${product}" "${country}" wholesaler company`,

    `"${product}" "${country}" "mobile accessories" retailer`,

    `"${product}" "${country}" "phone accessories" distributor`,

    `"${product}" "${country}" "phone accessories" wholesale`,

    `"${product}" "${country}" purchasing procurement`,

    `"${product}" "${country}" sourcing company`,

    `"${product}" "${country}" "mobile accessories" brand`
  ];
}

export async function searchCompanies(
  product,
  country
) {

  console.log(
    "========== V3.6 SEARCH =========="
  );

  console.log(
    "Product:",
    product
  );

  console.log(
    "Country:",
    country
  );

  const queries =
    buildQueries(
      product,
      country
    );

  const raw = [];

  /*
   * 第一阶段：
   * Tavily 搜索候选企业
   */

  for (const query of queries) {

    try {

      console.log(
        "Tavily query:",
        query
      );

      const results =
        await webSearch(query);

      if (!Array.isArray(results)) {
        continue;
      }

      for (const item of results) {

        if (!item) continue;

        const url =
          normalizeUrl(
            item.url ||
            item.link
          );

        if (!url) continue;

        if (
          isBlockedDomain(url)
        ) {
          continue;
        }

        if (
          hasBlockedPath(url)
        ) {
          continue;
        }

        raw.push({
          title:
            safeText(item.title),

          description:
            safeText(
              item.snippet ||
              item.description
            ),

          url,

          source: "Tavily",

          keyword: query
        });
      }

    } catch (error) {

      console.error(
        "Tavily error:",
        error.message
      );
    }
  }

  console.log(
    "Raw candidates:",
    raw.length
  );

  /*
   * 第二阶段：
   * 域名去重
   */

  const domainMap =
    new Map();

  for (const item of raw) {

    const domain =
      getDomain(item.url);

    if (!domain) continue;

    if (
      !domainMap.has(domain)
    ) {
      domainMap.set(
        domain,
        item
      );
    }
  }

  let candidates =
    Array.from(
      domainMap.values()
    );

  /*
   * 搜索结果页面如果是分类页，
   * 仍然可以尝试访问它的官网首页。
   *
   * 但买家名单、目录页直接过滤。
   */

  candidates =
    candidates.filter(
      item =>
        !hasBlockedPath(
          item.url
        )
    );

  /*
   * 最多核验 35 家
   */

  candidates =
    candidates.slice(0, 35);

  console.log(
    "Candidates for verification:",
    candidates.length
  );

  const verified = [];

  /*
   * 第三阶段：
   * 真正访问企业官网
   */

  for (
    const candidate of candidates
  ) {

    try {

      const homepage =
        await fetchWebsite(
          candidate.url
        );

      /*
       * 如果搜索结果本身是深层分类页，
       * homepage 仍然使用网站根域名进行核验。
       */

      const evaluation =
        evaluateCandidate(
          candidate,
          homepage,
          product
        );

      console.log(
        "VERIFY:",
        getDomain(candidate.url),
        evaluation.keep,
        evaluation.reason ||
          evaluation.score
      );

      if (!evaluation.keep) {
        continue;
      }

      const domain =
        getDomain(
          homepage.url ||
          candidate.url
        );

      const company =
        cleanCompanyName(
          homepage.title ||
          candidate.title,
          domain
        );

      if (!company) {
        continue;
      }

      /*
       * 官网公开邮箱
       */
      const email =
        homepage.emails[0] ||
        "";

      verified.push({

        company,

        country,

        type:
          evaluation.type,

        website:
          homepage.url ||
          getOrigin(candidate.url),

        email,

        emailSource:
          email
            ? homepage.url
            : "",

        description:
          homepage.description ||
          candidate.description ||
          homepage.text.substring(
            0,
            700
          ),

        source:
          "Tavily + Website Verification",

        keyword:
          candidate.keyword,

        verified: true,

        verification:
          "二次企业核验通过",

        searchQuality:
          evaluation.score,

        buyerSignals:
          evaluation.buyerSignals,

        identityScore:
          evaluation.identityScore

      });

    } catch (error) {

      console.error(
        "Candidate verification error:",
        error.message
      );
    }
  }

  /*
   * 最终排序
   */

  verified.sort(
    (a, b) => {

      /*
       * 邮箱存在优先
       */
      const emailA =
        a.email ? 8 : 0;

      const emailB =
        b.email ? 8 : 0;

      return (
        (b.searchQuality + emailB) -
        (a.searchQuality + emailA)
      );
    }
  );

  /*
   * 去重
   */

  const finalMap =
    new Map();

  for (const item of verified) {

    const domain =
      getDomain(
        item.website
      );

    if (!domain) continue;

    if (
      !finalMap.has(domain)
    ) {
      finalMap.set(
        domain,
        item
      );
    }
  }

  const finalResults =
    Array.from(
      finalMap.values()
    ).slice(0, 15);

  console.log(
    "FINAL REAL BUYERS:",
    finalResults.length
  );

  console.log(
    "================================"
  );

  return finalResults;
}
