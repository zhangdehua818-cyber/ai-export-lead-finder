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

const SUPPLIER_SIGNALS = [
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
  "factory price",
  "wholesale supplier"
];

const BUYER_SIGNALS = [
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
  "request a quote"
];

/*
 * 这是本次升级最重要的一组信号：
 * 它们说明网站是在“招募下游”，
 * 而不是“寻找上游供应商”。
 */
const REVERSE_DISTRIBUTION_SIGNALS = [
  "become a distributor",
  "become our distributor",
  "become an authorized distributor",
  "authorized distributor application",
  "distributor application",
  "distributor program",
  "dealer application",
  "dealer program",
  "become a dealer",
  "become an authorized dealer",
  "reseller application",
  "become a reseller",
  "authorized reseller",
  "wholesale from us",
  "buy our products",
  "buy from us",
  "purchase our products",
  "our products",
  "our exclusive products",
  "exclusive products",
  "minimum purchase requirement",
  "minimum purchase target",
  "minimum order quantity",
  "moq required",
  "apply to become",
  "apply to be a distributor",
  "apply to become a distributor",
  "distributor requirements",
  "distributor requirements below",
  "wholesale prices",
  "wholesale pricing",
  "dealer requirements"
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

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.company ||
      value.value ||
      value.text ||
      ""
    ).toString();
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
    return new URL(url)
      .hostname
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
    BLOCKED_DOMAINS.some(
      d => domain === d || domain.endsWith("." + d)
    ) ||
    SOCIAL_DOMAINS.some(
      d => domain === d || domain.endsWith("." + d)
    ) ||
    LOGISTICS_DOMAINS.some(
      d => domain === d || domain.endsWith("." + d)
    )
  );
}

function pathLooksBad(url) {
  try {
    const path = new URL(url).pathname.toLowerCase();

    return BAD_PATH_WORDS.some(
      word => path.includes(word)
    );
  } catch {
    return true;
  }
}

function countSignals(text, words) {
  const lower = normalizeText(text).toLowerCase();

  return words.reduce(
    (total, word) =>
      total +
      (lower.includes(word.toLowerCase()) ? 1 : 0),
    0
  );
}

function hasReverseDistribution(text) {
  const lower = normalizeText(text).toLowerCase();

  const hits = [];

  for (const signal of REVERSE_DISTRIBUTION_SIGNALS) {
    if (lower.includes(signal)) {
      hits.push(signal);
    }
  }

  return hits;
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

  return aliases.some(
    x => x && lower.includes(x)
  );
}

function looksLikeBadPage(text, url = "") {
  const lower = normalizeText(text).toLowerCase();

  if (pathLooksBad(url)) {
    return true;
  }

  let hits = 0;

  for (const word of BAD_PAGE_WORDS) {
    if (lower.includes(word)) {
      hits++;
    }
  }

  return hits >= 2;
}

function extractTitle(html) {
  const match = html.match(
    /<title[^>]*>([\s\S]*?)<\/title>/i
  );

  if (!match) return "";

  return match[1]
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
      : "";
  }

  const badNames = [
    "potential buyer",
    "potential buyers",
    "complete guide",
    "guide",
    "buyer list",
    "importer list",
    "phone case buyer",
    "phone case buyers",
    "phone case importers",
    "phone case importer",
    "buy hanfu online"
  ];

  const lower = value.toLowerCase();

  if (
    badNames.some(
      x => lower === x
    )
  ) {
    return "";
  }

  const separators = [
    " | ",
    " – ",
    " — ",
    " - ",
    " :: ",
    " : "
  ];

  for (const separator of separators) {
    if (value.includes(separator)) {
      const first =
        value.split(separator)[0].trim();

      if (
        first.length >= 2 &&
        first.length <= 80
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
    const controller =
      new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      8000
    );

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AI-Export-Lead-Finder/3.5.1)"
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

function determineType(text) {
  const lower =
    normalizeText(text).toLowerCase();

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

function calculateQuality(candidate) {
  let score = 35;

  if (candidate.verified) {
    score += 15;
  } else {
    score -= 15;
  }

  if (candidate.productRelevant) {
    score += 15;
  } else {
    score -= 40;
  }

  if (candidate.buyerSignals > 0) {
    score += Math.min(
      candidate.buyerSignals * 5,
      20
    );
  }

  if (candidate.companyIdentity) {
    score += 8;
  }

  if (candidate.email) {
    score += 10;
  }

  /*
   * 反向招商是最高优先级的淘汰条件
   */
  if (
    candidate.reverseDistributionHits >= 2
  ) {
    score -= 60;
  }

  if (
    candidate.reverseDistributionHits >= 4
  ) {
    score -= 20;
  }

  if (candidate.supplierSignals >= 3) {
    score -= 45;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

function makeReason(candidate) {
  const reasons = [];

  if (candidate.verified) {
    reasons.push("官网可访问");
  }

  if (candidate.productRelevant) {
    reasons.push("产品相关");
  }

  if (candidate.buyerSignals > 0) {
    reasons.push("存在买家/渠道信号");
  }

  if (candidate.email) {
    reasons.push("找到公开企业邮箱");
  }

  return reasons.length
    ? reasons.join(" · ")
    : "需要人工确认";
}

export async function searchCompanies(
  product,
  country
) {
  const rawProduct =
    normalizeText(product).trim();

  const englishProduct =
    normalizeProduct(product);

  const market =
    normalizeCountry(country);

  if (!rawProduct || !market) {
    return [];
  }

  const queries = [
    `"${englishProduct}" ${market} distributor company`,
    `"${englishProduct}" ${market} wholesaler company`,
    `"${englishProduct}" ${market} retailer company`,
    `"${englishProduct}" ${market} importer company`,
    `"${englishProduct}" ${market} purchasing procurement`,
    `"${englishProduct}" ${market} wholesale buyer`,
    `"${englishProduct}" ${market} phone accessories company`,
    `"${englishProduct}" ${market} mobile accessories distributor`
  ];

  const candidates = [];
  const seen = new Set();

  for (const query of queries) {
    try {
      const results =
        await webSearch(query);

      if (!Array.isArray(results)) {
        continue;
      }

      for (const item of results) {
        const url =
          normalizeText(item.url).trim();

        if (!url) continue;

        const domain =
          getDomain(url);

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

        const title =
          normalizeText(item.title);

        const snippet =
          normalizeText(item.snippet);

        const initialText =
          `${title} ${snippet}`;

        if (
          looksLikeBadPage(
            initialText,
            url
          )
        ) {
          continue;
        }

        const reverseHits =
          hasReverseDistribution(
            initialText
          );

        /*
         * 搜索结果本身已经出现明显
         * “招代理/经销商”信号时，
         * 如果没有很强的买家信号，
         * 直接淘汰。
         */
        const initialBuyerSignals =
          countSignals(
            initialText,
            BUYER_SIGNALS
          );

        if (
          reverseHits.length >= 2 &&
          initialBuyerSignals < 4
        ) {
          continue;
        }

        const initialSupplierSignals =
          countSignals(
            initialText,
            SUPPLIER_SIGNALS
          );

        if (
          initialSupplierSignals >= 3 &&
          initialBuyerSignals < 3
        ) {
          continue;
        }

        seen.add(domain);

        candidates.push({
          domain,
          url,
          title,
          snippet,
          source:
            item.source || "Tavily",
          keyword: query
        });
      }
    } catch (error) {
      console.error(
        "Search error:",
        query,
        error.message
      );
    }
  }

  const verifiedCandidates = [];

  /*
   * 检查真实官网
   */
  for (
    const candidate
    of candidates.slice(0, 30)
  ) {
    const origin =
      getOrigin(candidate.url);

    if (!origin) continue;

    const homepage =
      await fetchPage(origin);

    if (!homepage) {
      continue;
    }

    const html =
      homepage.html || "";

    const homepageText =
      htmlToText(html);

    const pageTitle =
      extractTitle(html);

    const siteName =
      extractSiteName(html);

    const combinedText = [
      candidate.title,
      candidate.snippet,
      pageTitle,
      siteName,
      homepageText.slice(0, 18000)
    ].join(" ");

    const lower =
      combinedText.toLowerCase();

    const reverseHits =
      hasReverseDistribution(
        combinedText
      );

    const supplierSignals =
      countSignals(
        combinedText,
        SUPPLIER_SIGNALS
      );

    const buyerSignals =
      countSignals(
        combinedText,
        BUYER_SIGNALS
      );

    const relevant =
      productRelevant(
        combinedText,
        product
      );

    const badPage =
      looksLikeBadPage(
        combinedText,
        candidate.url
      );

    const logistics =
      lower.includes(
        "freight forwarding"
      ) ||
      lower.includes(
        "air freight"
      ) ||
      lower.includes(
        "shipping logistics"
      ) ||
      lower.includes(
        "freight forwarding company"
      ) ||
      lower.includes(
        "customs brokerage"
      ) ||
      lower.includes(
        "cargo shipping"
      );

    /*
     * ① 产品不相关
     */
    if (!relevant) {
      continue;
    }

    /*
     * ② 文章/目录
     */
    if (badPage) {
      continue;
    }

    /*
     * ③ 物流
     */
    if (logistics) {
      continue;
    }

    /*
     * ④ 明显供应商
     */
    if (
      supplierSignals >= 3 &&
      buyerSignals < 4
    ) {
      continue;
    }

    /*
     * ⑤ 最关键：
     * 如果网站大量出现
     * Become a Distributor /
     * Distributor Application /
     * Buy Our Products 等
     * 说明它是供应方。
     */
    if (
      reverseHits.length >= 2
    ) {
      continue;
    }

    /*
     * ⑥ 必须存在买家/渠道信号
     */
    if (buyerSignals < 1) {
      continue;
    }

    const companyIdentity =
      cleanCompanyName(
        siteName ||
        pageTitle ||
        candidate.title,
        candidate.domain
      );

    if (!companyIdentity) {
      continue;
    }

    /*
     * 不允许公司名本身就是
     * “Phone Case Buyer”
     * 这种搜索结果标题。
     */
    const companyLower =
      companyIdentity.toLowerCase();

    if (
      companyLower.includes(
        "buyer list"
      ) ||
      companyLower.includes(
        "importer list"
      ) ||
      companyLower.includes(
        "complete guide"
      ) ||
      companyLower ===
        "potential buyer"
    ) {
      continue;
    }

    const type =
      determineType(combinedText);

    const result = {
      company:
        companyIdentity,

      companyIdentity: true,

      country:
        market,

      type,

      website:
        origin,

      source:
        "Tavily + Website Verification",

      description:
        candidate.snippet ||
        homepageText.slice(0, 600),

      keyword:
        candidate.keyword,

      verified:
        true,

      websiteVerified:
        true,

      productRelevant:
        true,

      buyerSignals,

      supplierSignals,

      reverseDistributionHits:
        reverseHits.length,

      reverseDistributionEvidence:
        reverseHits.slice(0, 5),

      pageType:
        "company",

      email:
        "",

      emailSource:
        "",

      qualityScore:
        0,

      qualityReason:
        ""
    };

    result.qualityScore =
      calculateQuality(result);

    result.qualityReason =
      makeReason(result);

    if (
      result.qualityScore < 50
    ) {
      continue;
    }

    verifiedCandidates.push(
      result
    );
  }

  /*
   * 最终域名去重
   */
  const unique = [];
  const finalSeen = new Set();

  for (
    const item
    of verifiedCandidates
  ) {
    const domain =
      getDomain(item.website);

    if (
      !domain ||
      finalSeen.has(domain)
    ) {
      continue;
    }

    finalSeen.add(domain);

    unique.push(item);
  }

  unique.sort(
    (a, b) =>
      b.qualityScore -
      a.qualityScore
  );

  return unique.slice(0, 15);
}
