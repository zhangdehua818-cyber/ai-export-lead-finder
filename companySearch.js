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

/*
 * 明确的供应商/生产商信号
 */
const MANUFACTURER_SIGNALS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "factory direct",
  "production facility",
  "our factory",
  "we manufacture",
  "we manufacture our",
  "manufactured by us",
  "made in our factory",
  "oem manufacturer",
  "original manufacturer",
  "contract manufacturer",
  "custom manufacturing",
  "cnc machining",
  "machining service"
];

const SUPPLIER_SIGNALS = [
  "supplier",
  "suppliers",
  "supplier of",
  "leading supplier",
  "wholesale supplier",
  "direct supplier",
  "product supplier",
  "we supply",
  "we provide products",
  "factory price",
  "wholesale prices"
];

/*
 * 买家/渠道信号
 */
const BUYER_SIGNALS = [
  "importer",
  "import",
  "importing",
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
 * “反向招商”：
 * 网站不是在找供应商，而是在让别人买它的货/成为它的代理。
 */
const REVERSE_SELLING_SIGNALS = [
  "become a distributor",
  "become our distributor",
  "become an authorized distributor",
  "authorized distributor application",
  "distributor application",
  "distributor program",
  "distributor requirements",
  "dealer application",
  "dealer program",
  "dealer requirements",
  "become a dealer",
  "become an authorized dealer",
  "become a reseller",
  "authorized reseller",
  "reseller application",
  "reseller program",
  "buy our products",
  "buy from us",
  "purchase our products",
  "our products",
  "our exclusive products",
  "exclusive products",
  "apply to become",
  "apply to be a distributor",
  "apply to become a distributor",
  "minimum purchase requirement",
  "minimum purchase target",
  "minimum order quantity",
  "moq required",
  "wholesale from us",
  "wholesale pricing from us",
  "wholesale prices from us",
  "open a wholesale account",
  "wholesale account application"
];

/*
 * “主动采购”信号。
 *
 * 这些比单纯出现 wholesale / distributor 更有价值。
 */
const ACTIVE_BUYING_SIGNALS = [
  "looking for suppliers",
  "looking for a supplier",
  "looking for new suppliers",
  "looking for manufacturers",
  "looking for new manufacturers",
  "seeking suppliers",
  "seeking a supplier",
  "seeking manufacturers",
  "sourcing from",
  "source from manufacturers",
  "source from suppliers",
  "we source",
  "we are sourcing",
  "currently sourcing",
  "supplier sourcing",
  "vendor sourcing",
  "new supplier",
  "new suppliers",
  "supplier onboarding",
  "vendor onboarding",
  "become a vendor",
  "vendor application",
  "submit your products",
  "submit products",
  "wholesale vendors",
  "vendor registration",
  "purchase products",
  "bulk purchase",
  "bulk purchasing",
  "bulk order",
  "bulk orders",
  "purchase in bulk",
  "buy in bulk",
  "we buy",
  "we purchase",
  "purchasing department",
  "procurement department",
  "purchasing team",
  "procurement team"
];

/*
 * 产品页面/内容型页面
 */
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
  if (value === null || value === undefined) {
    return "";
  }

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
  if (!domain) {
    return true;
  }

  return (
    BLOCKED_DOMAINS.some(
      d =>
        domain === d ||
        domain.endsWith("." + d)
    ) ||
    SOCIAL_DOMAINS.some(
      d =>
        domain === d ||
        domain.endsWith("." + d)
    ) ||
    LOGISTICS_DOMAINS.some(
      d =>
        domain === d ||
        domain.endsWith("." + d)
    )
  );
}

function pathLooksBad(url) {
  try {
    const path =
      new URL(url)
        .pathname
        .toLowerCase();

    return BAD_PATH_WORDS.some(
      word => path.includes(word)
    );
  } catch {
    return true;
  }
}

function countSignals(text, signals) {
  const lower =
    normalizeText(text).toLowerCase();

  return signals.reduce(
    (total, signal) =>
      total +
      (
        lower.includes(
          signal.toLowerCase()
        )
          ? 1
          : 0
      ),
    0
  );
}

function findSignals(text, signals) {
  const lower =
    normalizeText(text).toLowerCase();

  return signals.filter(
    signal =>
      lower.includes(
        signal.toLowerCase()
      )
  );
}

function productRelevant(text, product) {
  const lower =
    normalizeText(text).toLowerCase();

  const p =
    normalizeProduct(product)
      .toLowerCase();

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
      "protective cases",
      "phone accessories",
      "mobile accessories",
      "cell phone accessories"
    );
  }

  if (
    p === "mobile phone accessories"
  ) {
    aliases.push(
      "phone accessories",
      "mobile accessories",
      "cell phone accessories",
      "phone case",
      "screen protector"
    );
  }

  return aliases.some(
    x =>
      x &&
      lower.includes(x)
  );
}

function looksLikeBadPage(
  text,
  url = ""
) {
  const lower =
    normalizeText(text).toLowerCase();

  if (pathLooksBad(url)) {
    return true;
  }

  let hits = 0;

  for (
    const word of BAD_PAGE_WORDS
  ) {
    if (lower.includes(word)) {
      hits++;
    }
  }

  return hits >= 2;
}

function extractTitle(html) {
  const match =
    html.match(
      /<title[^>]*>([\s\S]*?)<\/title>/i
    );

  if (!match) {
    return "";
  }

  return match[1]
    .replace(/\s+/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function extractSiteName(html) {
  const patterns = [
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
    /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
  ];

  for (
    const regex of patterns
  ) {
    const match =
      html.match(regex);

    if (
      match &&
      match[1]
    ) {
      return match[1].trim();
    }
  }

  return "";
}

function htmlToText(html) {
  return normalizeText(html)
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      " "
    )
    .replace(
      /<svg[\s\S]*?<\/svg>/gi,
      " "
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
    .replace(
      /&nbsp;/gi,
      " "
    )
    .replace(
      /&amp;/gi,
      "&"
    )
    .replace(
      /&quot;/gi,
      '"'
    )
    .replace(
      /&#39;/gi,
      "'"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function cleanCompanyName(
  name,
  domain
) {
  let value =
    normalizeText(name)
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

  const lower =
    value.toLowerCase();

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

  for (
    const separator
    of separators
  ) {
    if (
      value.includes(separator)
    ) {
      const first =
        value
          .split(separator)[0]
          .trim();

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
  if (!url) {
    return null;
  }

  try {
    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () => controller.abort(),
        8000
      );

    const response =
      await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal:
          controller.signal,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AI-Export-Lead-Finder/3.6)"
        }
      });

    clearTimeout(timer);

    if (!response.ok) {
      return null;
    }

    const html =
      await response.text();

    return {
      html,
      url: response.url,
      status:
        response.status
    };
  } catch {
    return null;
  }
}

/*
 * 判断供应链角色
 */
function determineSupplyRole(data) {
  const {
    manufacturerSignals,
    supplierSignals,
    buyerSignals,
    activeBuyingSignals,
    reverseSellingSignals,
    text
  } = data;

  const manufacturer =
    manufacturerSignals >= 2;

  const supplier =
    supplierSignals >= 2;

  const activeBuyer =
    activeBuyingSignals >= 1;

  const reverseSeller =
    reverseSellingSignals >= 2;

  /*
   * 生产/供应属性非常强，
   * 并且没有明确主动采购行为。
   */
  if (
    manufacturer &&
    !activeBuyer
  ) {
    return "Manufacturer";
  }

  if (
    supplier &&
    !activeBuyer &&
    reverseSeller
  ) {
    return "Supplier";
  }

  /*
   * 明确在招代理、让别人买自己的产品
   */
  if (
    reverseSeller &&
    !activeBuyer
  ) {
    return "Supplier";
  }

  /*
   * 有主动采购行为
   */
  if (
    activeBuyer &&
    buyerSignals >= 1
  ) {
    return "Buyer";
  }

  /*
   * 进口商
   */
  if (
    buyerSignals >= 1 &&
    text
      .toLowerCase()
      .includes("importer")
  ) {
    return "Importer";
  }

  /*
   * 渠道商
   */
  if (
    text
      .toLowerCase()
      .includes("distributor")
  ) {
    return "Distributor";
  }

  if (
    text
      .toLowerCase()
      .includes("wholesaler")
  ) {
    return "Wholesaler";
  }

  if (
    text
      .toLowerCase()
      .includes("wholesale")
  ) {
    return "Wholesaler";
  }

  if (
    text
      .toLowerCase()
      .includes("retailer")
  ) {
    return "Retailer";
  }

  if (
    buyerSignals >= 1
  ) {
    return "Potential Buyer";
  }

  return "Unknown";
}

function calculateQuality(candidate) {
  let score = 35;

  /*
   * 官网
   */
  if (
    candidate.websiteVerified
  ) {
    score += 12;
  }

  /*
   * 产品相关
   */
  if (
    candidate.productRelevant
  ) {
    score += 15;
  }

  /*
   * 买家角色
   */
  if (
    candidate.supplyRole ===
    "Importer"
  ) {
    score += 15;
  }

  if (
    candidate.supplyRole ===
    "Buyer"
  ) {
    score += 14;
  }

  if (
    candidate.supplyRole ===
    "Distributor"
  ) {
    score += 10;
  }

  if (
    candidate.supplyRole ===
    "Wholesaler"
  ) {
    score += 9;
  }

  if (
    candidate.supplyRole ===
    "Retailer"
  ) {
    score += 6;
  }

  /*
   * 主动采购
   */
  if (
    candidate.activeBuyingSignals >= 1
  ) {
    score += 12;
  }

  if (
    candidate.activeBuyingSignals >= 3
  ) {
    score += 8;
  }

  /*
   * 企业邮箱
   */
  if (
    candidate.email
  ) {
    score += 12;
  }

  /*
   * 供应商/厂家
   */
  if (
    candidate.supplyRole ===
    "Manufacturer"
  ) {
    score -= 60;
  }

  if (
    candidate.supplyRole ===
    "Supplier"
  ) {
    score -= 55;
  }

  /*
   * 反向招商
   */
  if (
    candidate.reverseSellingSignals >= 2
  ) {
    score -= 45;
  }

  if (
    candidate.reverseSellingSignals >= 4
  ) {
    score -= 20;
  }

  /*
   * 产品相关性极低
   */
  if (
    !candidate.productRelevant
  ) {
    score -= 50;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}

function makeReason(candidate) {
  const reasons = [];

  if (
    candidate.supplyRole ===
    "Importer"
  ) {
    reasons.push(
      "进口商"
    );
  } else if (
    candidate.supplyRole ===
    "Buyer"
  ) {
    reasons.push(
      "存在主动采购信号"
    );
  } else if (
    candidate.supplyRole ===
    "Distributor"
  ) {
    reasons.push(
      "分销渠道"
    );
  } else if (
    candidate.supplyRole ===
    "Wholesaler"
  ) {
    reasons.push(
      "批发渠道"
    );
  } else if (
    candidate.supplyRole ===
    "Retailer"
  ) {
    reasons.push(
      "零售渠道"
    );
  }

  if (
    candidate.productRelevant
  ) {
    reasons.push(
      "产品相关"
    );
  }

  if (
    candidate.websiteVerified
  ) {
    reasons.push(
      "官网已验证"
    );
  }

  if (
    candidate.activeBuyingSignals > 0
  ) {
    reasons.push(
      "存在采购行为"
    );
  }

  if (
    candidate.email
  ) {
    reasons.push(
      "公开邮箱"
    );
  }

  return reasons.join(
    " · "
  );
}

export async function searchCompanies(
  product,
  country
) {
  const rawProduct =
    normalizeText(product)
      .trim();

  const englishProduct =
    normalizeProduct(product);

  const market =
    normalizeCountry(country);

  if (
    !rawProduct ||
    !market
  ) {
    return [];
  }

  /*
   * 不再只搜索 distributor。
   * 加入采购、批发、进口、零售等不同入口。
   */
  const queries = [
    `"${englishProduct}" ${market} importer company`,
    `"${englishProduct}" ${market} distributor company`,
    `"${englishProduct}" ${market} wholesaler company`,
    `"${englishProduct}" ${market} retailer company`,
    `"${englishProduct}" ${market} purchasing`,
    `"${englishProduct}" ${market} procurement`,
    `"${englishProduct}" ${market} "looking for suppliers"`,
    `"${englishProduct}" ${market} wholesale buyer`
  ];

  const candidates = [];
  const seen = new Set();

  /*
   * 第一轮：Tavily 搜索
   */
  for (
    const query of queries
  ) {
    try {
      const results =
        await webSearch(query);

      if (
        !Array.isArray(results)
      ) {
        continue;
      }

      for (
        const item of results
      ) {
        const url =
          normalizeText(
            item.url
          ).trim();

        if (!url) {
          continue;
        }

        const domain =
          getDomain(url);

        if (!domain) {
          continue;
        }

        if (
          isBlockedDomain(domain)
        ) {
          continue;
        }

        if (
          pathLooksBad(url)
        ) {
          continue;
        }

        if (
          seen.has(domain)
        ) {
          continue;
        }

        const title =
          normalizeText(
            item.title
          );

        const snippet =
          normalizeText(
            item.snippet
          );

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
          findSignals(
            initialText,
            REVERSE_SELLING_SIGNALS
          );

        const activeHits =
          findSignals(
            initialText,
            ACTIVE_BUYING_SIGNALS
          );

        const manufacturerHits =
          findSignals(
            initialText,
            MANUFACTURER_SIGNALS
          );

        const supplierHits =
          findSignals(
            initialText,
            SUPPLIER_SIGNALS
          );

        const buyerHits =
          findSignals(
            initialText,
            BUYER_SIGNALS
          );

        /*
         * 搜索结果阶段就发现：
         *
         * 招代理 + 没有采购行为
         *
         * 直接不要。
         */
        if (
          reverseHits.length >= 2 &&
          activeHits.length === 0
        ) {
          continue;
        }

        /*
         * 明显制造商，同时没有采购信号
         */
        if (
          manufacturerHits.length >= 3 &&
          activeHits.length === 0 &&
          buyerHits.length < 3
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
            item.source ||
            "Tavily",
          keyword:
            query
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

  const finalCandidates = [];

  /*
   * 第二轮：
   * 打开真正的官网进行判断。
   */
  for (
    const candidate
    of candidates.slice(0, 35)
  ) {
    const origin =
      getOrigin(
        candidate.url
      );

    if (!origin) {
      continue;
    }

    const homepage =
      await fetchPage(
        origin
      );

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
      homepageText.slice(
        0,
        20000
      )
    ].join(" ");

    const lower =
      combinedText.toLowerCase();

    const manufacturerHits =
      findSignals(
        combinedText,
        MANUFACTURER_SIGNALS
      );

    const supplierHits =
      findSignals(
        combinedText,
        SUPPLIER_SIGNALS
      );

    const buyerHits =
      findSignals(
        combinedText,
        BUYER_SIGNALS
      );

    const activeHits =
      findSignals(
        combinedText,
        ACTIVE_BUYING_SIGNALS
      );

    const reverseHits =
      findSignals(
        combinedText,
        REVERSE_SELLING_SIGNALS
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

    /*
     * 物流/货代/运输类公司直接淘汰
     */
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
      ) ||
      lower.includes(
        "freight company"
      );

    if (logistics) {
      continue;
    }

    /*
     * 产品不相关直接淘汰
     */
    if (!relevant) {
      continue;
    }

    /*
     * 文章/目录直接淘汰
     */
    if (badPage) {
      continue;
    }

    /*
     * 供应商反向招商
     */
    if (
      reverseHits.length >= 2 &&
      activeHits.length === 0
    ) {
      continue;
    }

    /*
     * 生产厂家
     */
    if (
      manufacturerHits.length >= 3 &&
      activeHits.length === 0 &&
      buyerHits.length < 3
    ) {
      continue;
    }

    /*
     * 供应商
     */
    if (
      supplierHits.length >= 3 &&
      activeHits.length === 0 &&
      buyerHits.length < 3
    ) {
      continue;
    }

    /*
     * 至少有买家/渠道信号
     */
    if (
      buyerHits.length === 0
    ) {
      continue;
    }

    /*
     * 供应链角色
     */
    const supplyRole =
      determineSupplyRole({
        manufacturerSignals:
          manufacturerHits.length,

        supplierSignals:
          supplierHits.length,

        buyerSignals:
          buyerHits.length,

        activeBuyingSignals:
          activeHits.length,

        reverseSellingSignals:
          reverseHits.length,

        text:
          combinedText
      });

    /*
     * Manufacturer / Supplier
     * 不进入最终客户池。
     */
    if (
      supplyRole ===
        "Manufacturer" ||
      supplyRole ===
        "Supplier"
    ) {
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

    const result = {
      company:
        companyIdentity,

      companyIdentity:
        true,

      country:
        market,

      type:
        supplyRole,

      supplyRole,

      website:
        origin,

      source:
        "Tavily + Website Verification",

      description:
        candidate.snippet ||
        homepageText.slice(
          0,
          700
        ),

      keyword:
        candidate.keyword,

      verified:
        true,

      websiteVerified:
        true,

      productRelevant:
        true,

      manufacturerSignals:
        manufacturerHits.length,

      supplierSignals:
        supplierHits.length,

      buyerSignals:
        buyerHits.length,

      activeBuyingSignals:
        activeHits.length,

      reverseSellingSignals:
        reverseHits.length,

      buyerEvidence:
        activeHits
          .slice(0, 8),

      reverseSellingEvidence:
        reverseHits
          .slice(0, 8),

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
      calculateQuality(
        result
      );

    result.qualityReason =
      makeReason(
        result
      );

    /*
     * 最低质量线
     */
    if (
      result.qualityScore < 50
    ) {
      continue;
    }

    finalCandidates.push(
      result
    );
  }

  /*
   * 域名去重
   */
  const unique = [];
  const finalSeen =
    new Set();

  for (
    const item
    of finalCandidates
  ) {
    const domain =
      getDomain(
        item.website
      );

    if (
      !domain ||
      finalSeen.has(domain)
    ) {
      continue;
    }

    finalSeen.add(domain);

    unique.push(item);
  }

  /*
   * 优先真正采购型客户
   */
  unique.sort(
    (a, b) => {
      if (
        a.supplyRole ===
          "Importer" &&
        b.supplyRole !==
          "Importer"
      ) {
        return -1;
      }

      if (
        b.supplyRole ===
          "Importer" &&
        a.supplyRole !==
          "Importer"
      ) {
        return 1;
      }

      if (
        a.activeBuyingSignals >
        b.activeBuyingSignals
      ) {
        return -1;
      }

      if (
        b.activeBuyingSignals >
        a.activeBuyingSignals
      ) {
        return 1;
      }

      return (
        b.qualityScore -
        a.qualityScore
      );
    }
  );

  return unique.slice(
    0,
    15
  );
}
