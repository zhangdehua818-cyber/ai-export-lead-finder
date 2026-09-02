import { webSearch } from "./modules/searchAPI.js";

/*
 * V3.7
 * 核心：
 * 1. 判断公司是谁
 * 2. 判断公司在买还是在卖
 * 3. 区分主动采购 vs 销售自己的产品
 * 4. 排除供应商、厂家、目录站、文章站、物流公司
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
 * 真正的厂家信号
 */
const MANUFACTURER_SIGNALS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "factory direct",
  "our factory",
  "production facility",
  "production line",
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

/*
 * 供应商信号
 */
const SUPPLIER_SIGNALS = [
  "supplier",
  "suppliers",
  "supplier of",
  "leading supplier",
  "direct supplier",
  "product supplier",
  "we supply",
  "we provide products",
  "factory price",
  "factory prices",
  "wholesale supplier"
];

/*
 * 渠道/买家身份
 *
 * 注意：
 * 这里的 distributor / wholesaler / retailer
 * 只能说明“渠道身份”，
 * 不能证明它正在找供应商。
 */
const CHANNEL_SIGNALS = [
  "importer",
  "importing",
  "distributor",
  "distribution",
  "wholesale",
  "wholesaler",
  "retailer",
  "retail",
  "buyer",
  "purchasing",
  "procurement",
  "sourcing"
];

/*
 * 真正的主动采购信号
 *
 * 这一组才是高价值。
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
  "seeking new suppliers",
  "seeking new manufacturers",

  "we are sourcing",
  "we're sourcing",
  "we are currently sourcing",
  "we're currently sourcing",
  "currently sourcing",
  "actively sourcing",

  "sourcing from manufacturers",
  "sourcing from suppliers",
  "source from manufacturers",
  "source from suppliers",

  "supplier sourcing",
  "vendor sourcing",
  "supplier onboarding",
  "vendor onboarding",
  "new supplier",
  "new suppliers",
  "new vendor",
  "new vendors",

  "purchasing department",
  "procurement department",
  "purchasing team",
  "procurement team",
  "purchasing manager",
  "procurement manager",
  "purchasing director",
  "procurement director",

  "submit your products",
  "submit products",
  "submit your product",
  "vendor registration",
  "vendor application",
  "supplier registration",
  "supplier application",

  "we are looking to source",
  "looking to source",
  "looking to purchase from suppliers",
  "looking to purchase from manufacturers"
];

/*
 * 销售自己的产品。
 *
 * 这些不能被误认为采购。
 */
const SELLING_SIGNALS = [
  "buy in bulk",
  "buy our products",
  "buy from us",
  "purchase our products",
  "purchase from us",
  "our products",
  "our product line",
  "our exclusive products",
  "our wholesale products",
  "wholesale pricing",
  "wholesale prices",
  "bulk pricing",
  "bulk orders",
  "bulk order",
  "minimum order quantity",
  "minimum purchase requirement",
  "minimum purchase target",
  "moq required",

  "become a distributor",
  "become our distributor",
  "become an authorized distributor",
  "authorized distributor",
  "distributor application",
  "distributor program",
  "distributor requirements",

  "become a dealer",
  "dealer application",
  "dealer program",
  "dealer requirements",

  "become a reseller",
  "authorized reseller",
  "reseller application",
  "reseller program",

  "why partner with us",
  "partner with us",
  "apply to become",
  "apply to be a distributor",

  "custom products",
  "custom phone cases",
  "custom designs",
  "we deliver",
  "we offer",
  "we sell",
  "shop our",
  "shop now",
  "order now"
];

/*
 * 页面型垃圾
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
  "/suppliers/",
  "/supplier/",
  "/importers/",
  "/importer/",
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
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "object"
  ) {
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
  const value =
    normalizeText(product).trim();

  return (
    PRODUCT_MAP[value] ||
    value
  );
}

function normalizeCountry(country) {
  const value =
    normalizeText(country).trim();

  return (
    COUNTRY_MAP[value] ||
    value
  );
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
    const u =
      new URL(url);

    return (
      `${u.protocol}//${u.hostname}`
    );
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
      word =>
        path.includes(word)
    );
  } catch {
    return true;
  }
}

function findSignals(
  value,
  signals
) {
  const lower =
    normalizeText(value)
      .toLowerCase();

  return signals.filter(
    signal =>
      lower.includes(
        signal.toLowerCase()
      )
  );
}

function productRelevant(
  value,
  product
) {
  const lower =
    normalizeText(value)
      .toLowerCase();

  const original =
    normalizeText(product)
      .toLowerCase();

  const english =
    normalizeProduct(product)
      .toLowerCase();

  const aliases = [
    original,
    english
  ];

  if (
    english === "phone case"
  ) {
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
    english ===
    "mobile phone accessories"
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
    alias =>
      alias &&
      lower.includes(alias)
  );
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

  const generic = [
    "potential buyer",
    "potential buyers",
    "complete guide",
    "ultimate guide",
    "guide",
    "buyer list",
    "importer list",
    "phone case buyer",
    "phone case buyers",
    "phone case importers",
    "phone case importer",
    "buy hanfu online",
    "wholesale cell phone accessories"
  ];

  if (
    generic.includes(
      value.toLowerCase()
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
    const separator of separators
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
            "Mozilla/5.0 (compatible; AI-Export-Lead-Finder/3.7)"
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

function classifyRole(data) {
  const {
    channelHits,
    activeHits,
    sellingHits,
    manufacturerHits,
    supplierHits
  } = data;

  /*
   * 第一优先：
   * 真主动采购。
   */
  if (
    activeHits.length >= 1 &&
    channelHits.length >= 1
  ) {
    if (
      channelHits.includes(
        "importer"
      ) ||
      channelHits.includes(
        "importing"
      )
    ) {
      return "Importer";
    }

    if (
      channelHits.includes(
        "buyer"
      ) ||
      channelHits.includes(
        "purchasing"
      ) ||
      channelHits.includes(
        "procurement"
      )
    ) {
      return "Buyer";
    }

    return "Active Buyer";
  }

  /*
   * 有强销售语言，
   * 不能当成主动采购。
   */
  if (
    sellingHits.length >= 2 &&
    activeHits.length === 0
  ) {
    if (
      manufacturerHits.length >= 2
    ) {
      return "Manufacturer";
    }

    return "Seller";
  }

  /*
   * 明确厂家
   */
  if (
    manufacturerHits.length >= 3 &&
    activeHits.length === 0
  ) {
    return "Manufacturer";
  }

  /*
   * 明确供应商
   */
  if (
    supplierHits.length >= 3 &&
    activeHits.length === 0
  ) {
    return "Supplier";
  }

  /*
   * 进口商
   */
  if (
    channelHits.includes(
      "importer"
    ) ||
    channelHits.includes(
      "importing"
    )
  ) {
    return "Importer";
  }

  /*
   * 分销商
   */
  if (
    channelHits.includes(
      "distributor"
    )
  ) {
    return "Distributor";
  }

  /*
   * 批发商
   */
  if (
    channelHits.includes(
      "wholesaler"
    ) ||
    channelHits.includes(
      "wholesale"
    )
  ) {
    return "Wholesaler";
  }

  /*
   * 零售商
   */
  if (
    channelHits.includes(
      "retailer"
    ) ||
    channelHits.includes(
      "retail"
    )
  ) {
    return "Retailer";
  }

  /*
   * Buyer 只是出现 buyer，
   * 没有主动采购证据，
   * 不能直接认定。
   */
  if (
    channelHits.includes(
      "buyer"
    )
  ) {
    return "Potential Buyer";
  }

  return "Unknown";
}

function qualityScore(candidate) {
  let score = 40;

  /*
   * 官网验证
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
    score += 12;
  } else {
    score -= 40;
  }

  /*
   * 公司身份
   */
  if (
    candidate.companyIdentity
  ) {
    score += 5;
  }

  /*
   * 主动采购
   */
  if (
    candidate.activeBuyingSignals >= 1
  ) {
    score += 22;
  }

  if (
    candidate.activeBuyingSignals >= 2
  ) {
    score += 10;
  }

  if (
    candidate.activeBuyingSignals >= 4
  ) {
    score += 6;
  }

  /*
   * 渠道身份
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
    "Active Buyer"
  ) {
    score += 12;
  }

  if (
    candidate.supplyRole ===
    "Distributor"
  ) {
    score += 8;
  }

  if (
    candidate.supplyRole ===
    "Wholesaler"
  ) {
    score += 6;
  }

  if (
    candidate.supplyRole ===
    "Retailer"
  ) {
    score += 4;
  }

  /*
   * 销售自己产品
   *
   * 非常重要：
   * 这不是采购行为。
   */
  if (
    candidate.sellingSignals >= 1
  ) {
    score -= 10;
  }

  if (
    candidate.sellingSignals >= 3
  ) {
    score -= 15;
  }

  if (
    candidate.sellingSignals >= 6
  ) {
    score -= 20;
  }

  /*
   * 厂家/供应商
   */
  if (
    candidate.supplyRole ===
    "Manufacturer"
  ) {
    score -= 70;
  }

  if (
    candidate.supplyRole ===
    "Supplier"
  ) {
    score -= 65;
  }

  if (
    candidate.supplyRole ===
    "Seller"
  ) {
    score -= 40;
  }

  /*
   * 公开邮箱
   */
  if (
    candidate.email
  ) {
    score += 10;
  }

  /*
   * 没有主动采购证据，
   * 不允许轻易超过90。
   */
  if (
    candidate.activeBuyingSignals === 0
  ) {
    score =
      Math.min(
        score,
        82
      );
  }

  /*
   * 只有主动采购客户
   * 才能进入90+。
   */
  if (
    candidate.activeBuyingSignals === 0
  ) {
    score =
      Math.min(
        score,
        89
      );
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
    candidate.activeBuyingSignals > 0
  ) {
    reasons.push(
      "主动采购信号"
    );
  }

  if (
    candidate.supplyRole ===
    "Importer"
  ) {
    reasons.push(
      "进口商"
    );
  }

  if (
    candidate.supplyRole ===
    "Buyer"
  ) {
    reasons.push(
      "采购型客户"
    );
  }

  if (
    candidate.supplyRole ===
    "Active Buyer"
  ) {
    reasons.push(
      "主动采购"
    );
  }

  if (
    candidate.supplyRole ===
    "Distributor"
  ) {
    reasons.push(
      "分销渠道"
    );
  }

  if (
    candidate.supplyRole ===
    "Wholesaler"
  ) {
    reasons.push(
      "批发渠道"
    );
  }

  if (
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
    candidate.email
  ) {
    reasons.push(
      "公开邮箱"
    );
  }

  if (
    candidate.sellingSignals >= 2
  ) {
    reasons.push(
      "存在销售行为"
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

  const market =
    normalizeCountry(country);

  const englishProduct =
    normalizeProduct(product);

  if (
    !rawProduct ||
    !market
  ) {
    return [];
  }

  /*
   * 搜索入口。
   *
   * 不再把“buy”本身当作采购证据。
   */
  const queries = [
    `"${englishProduct}" ${market} importer company`,
    `"${englishProduct}" ${market} distributor company`,
    `"${englishProduct}" ${market} wholesaler`,
    `"${englishProduct}" ${market} retailer`,
    `"${englishProduct}" ${market} procurement`,
    `"${englishProduct}" ${market} purchasing`,
    `"${englishProduct}" ${market} "looking for suppliers"`,
    `"${englishProduct}" ${market} "seeking suppliers"`
  ];

  const candidates = [];
  const seenDomains =
    new Set();

  /*
   * Tavily 第一轮
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

        if (
          !domain ||
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
          seenDomains.has(domain)
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

        /*
         * 初筛：
         * 明确是目录/文章，直接不要。
         */
        const badWords =
          BAD_PAGE_WORDS.filter(
            word =>
              initialText
                .toLowerCase()
                .includes(
                  word
                )
          );

        if (
          badWords.length >= 2
        ) {
          continue;
        }

        const activeHits =
          findSignals(
            initialText,
            ACTIVE_BUYING_SIGNALS
          );

        const sellingHits =
          findSignals(
            initialText,
            SELLING_SIGNALS
          );

        const manufacturerHits =
          findSignals(
            initialText,
            MANUFACTURER_SIGNALS
          );

        /*
         * 如果明显是厂家，
         * 但没有主动采购证据，
         * 初筛直接丢弃。
         */
        if (
          manufacturerHits.length >= 3 &&
          activeHits.length === 0
        ) {
          continue;
        }

        /*
         * 如果明显是销售页面，
         * 但没有主动采购证据，
         * 不急着在第一轮保留。
         */
        if (
          sellingHits.length >= 5 &&
          activeHits.length === 0
        ) {
          continue;
        }

        seenDomains.add(
          domain
        );

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
   * 真正打开官网。
   */
  for (
    const candidate
    of candidates.slice(
      0,
      35
    )
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
        25000
      )
    ].join(" ");

    const activeHits =
      findSignals(
        combinedText,
        ACTIVE_BUYING_SIGNALS
      );

    const sellingHits =
      findSignals(
        combinedText,
        SELLING_SIGNALS
      );

    const channelHits =
      findSignals(
        combinedText,
        CHANNEL_SIGNALS
      );

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

    const relevant =
      productRelevant(
        combinedText,
        product
      );

    /*
     * 产品不相关
     */
    if (!relevant) {
      continue;
    }

    /*
     * 物流公司
     */
    const lower =
      combinedText.toLowerCase();

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
     * 文章/目录
     */
    const badPage =
      BAD_PAGE_WORDS.filter(
        word =>
          lower.includes(
            word
          )
      ).length;

    if (
      badPage >= 2
    ) {
      continue;
    }

    /*
     * 供应商/厂家
     */
    if (
      manufacturerHits.length >= 3 &&
      activeHits.length === 0
    ) {
      continue;
    }

    if (
      supplierHits.length >= 3 &&
      activeHits.length === 0 &&
      activeHits.length === 0
    ) {
      continue;
    }

    /*
     * 核心：
     *
     * 销售语言非常强，
     * 没有任何主动采购证据，
     * 不认定为 Buyer。
     */
    if (
      sellingHits.length >= 2 &&
      activeHits.length === 0
    ) {
      /*
       * 如果只是普通批发/零售商，
       * 可以保留为渠道客户。
       *
       * 但不可以标 Buyer。
       */
    }

    /*
     * 至少需要渠道身份
     * 或主动采购证据。
     */
    if (
      channelHits.length === 0 &&
      activeHits.length === 0
    ) {
      continue;
    }

    const supplyRole =
      classifyRole({
        channelHits,
        activeHits,
        sellingHits,
        manufacturerHits,
        supplierHits
      });

    /*
     * 彻底排除卖方
     */
    if (
      supplyRole ===
        "Manufacturer" ||
      supplyRole ===
        "Supplier"
    ) {
      continue;
    }

    /*
     * Seller：
     * 没有主动采购证据就不要。
     */
    if (
      supplyRole === "Seller" &&
      activeHits.length === 0
    ) {
      continue;
    }

    const company =
      cleanCompanyName(
        siteName ||
        pageTitle ||
        candidate.title,
        candidate.domain
      );

    if (!company) {
      continue;
    }

    const result = {
      company,

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
          800
        ),

      keyword:
        candidate.keyword,

      verified:
        true,

      websiteVerified:
        true,

      productRelevant:
        true,

      activeBuyingSignals:
        activeHits.length,

      activeBuyingEvidence:
        activeHits.slice(
          0,
          10
        ),

      sellingSignals:
        sellingHits.length,

      sellingEvidence:
        sellingHits.slice(
          0,
          10
        ),

      channelSignals:
        channelHits.length,

      manufacturerSignals:
        manufacturerHits.length,

      supplierSignals:
        supplierHits.length,

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
      qualityScore(
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
   * 最终域名去重
   */
  const unique = [];
  const finalDomains =
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
      finalDomains.has(domain)
    ) {
      continue;
    }

    finalDomains.add(
      domain
    );

    unique.push(item);
  }

  /*
   * 排序：
   *
   * 1. 主动采购
   * 2. 进口商
   * 3. Buyer
   * 4. Distributor / Wholesaler
   * 5. Retailer
   */
  unique.sort(
    (a, b) => {
      if (
        a.activeBuyingSignals !==
        b.activeBuyingSignals
      ) {
        return (
          b.activeBuyingSignals -
          a.activeBuyingSignals
        );
      }

      const priority = {
        "Importer": 6,
        "Buyer": 5,
        "Active Buyer": 5,
        "Distributor": 4,
        "Wholesaler": 3,
        "Retailer": 2,
        "Potential Buyer": 1
      };

      const pa =
        priority[
          a.supplyRole
        ] || 0;

      const pb =
        priority[
          b.supplyRole
        ] || 0;

      if (
        pa !== pb
      ) {
        return pb - pa;
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
