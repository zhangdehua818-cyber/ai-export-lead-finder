function normalize(value) {
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
      value.company ||
      value.title ||
      value.text ||
      value.value ||
      ""
    ).toString();
  }

  return String(value);
}

function countSignals(
  value,
  signals
) {
  const text =
    normalize(value)
      .toLowerCase();

  return signals.filter(
    signal =>
      text.includes(
        signal.toLowerCase()
      )
  ).length;
}

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
  "we are sourcing",
  "we're sourcing",
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
  "vendor registration",
  "vendor application",
  "supplier registration",
  "supplier application",
  "looking to source",
  "we are looking to source",
  "looking to purchase from suppliers",
  "looking to purchase from manufacturers"
];

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
  "authorized distributor",
  "distributor application",
  "distributor program",
  "distributor requirements",
  "become a dealer",
  "dealer application",
  "dealer program",
  "become a reseller",
  "authorized reseller",
  "reseller application",
  "reseller program",
  "why partner with us",
  "partner with us",
  "apply to become",
  "custom products",
  "custom designs",
  "we deliver",
  "we offer",
  "we sell",
  "shop now",
  "order now"
];

const SUPPLIER_SIGNALS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "factory direct",
  "our factory",
  "production facility",
  "we manufacture",
  "oem manufacturer",
  "contract manufacturer",
  "supplier",
  "suppliers",
  "direct supplier",
  "wholesale supplier",
  "we supply",
  "factory price",
  "cnc machining",
  "machining service"
];

const PRODUCT_SIGNALS = [
  "phone case",
  "phone cases",
  "cell phone case",
  "cell phone cases",
  "mobile phone case",
  "mobile phone cases",
  "phone accessories",
  "mobile accessories",
  "cell phone accessories"
];

export function scoreCompany(
  company
) {
  if (!company) {
    return 0;
  }

  /*
   * 这里特别注意：
   *
   * 不把“purchase / buy / wholesale”
   * 本身直接当作主动采购。
   */

  const combined = [
    normalize(
      company.company
    ),

    normalize(
      company.description
    ),

    normalize(
      company.supplyRole
    ),

    normalize(
      company.type
    ),

    normalize(
      company.website
    ),

    normalize(
      company.activeBuyingEvidence
    ),

    normalize(
      company.sellingEvidence
    )
  ].join(" ");

  let score = 35;

  const active =
    Math.max(
      company.activeBuyingSignals || 0,
      countSignals(
        combined,
        ACTIVE_BUYING_SIGNALS
      )
    );

  const channel =
    countSignals(
      combined,
      CHANNEL_SIGNALS
    );

  const selling =
    Math.max(
      company.sellingSignals || 0,
      countSignals(
        combined,
        SELLING_SIGNALS
      )
    );

  const supplier =
    countSignals(
      combined,
      SUPPLIER_SIGNALS
    );

  const product =
    countSignals(
      combined,
      PRODUCT_SIGNALS
    );

  const role =
    normalize(
      company.supplyRole ||
      company.type
    ).toLowerCase();

  /*
   * 官网验证
   */
  if (
    company.websiteVerified === true ||
    company.verified === true
  ) {
    score += 12;
  }

  /*
   * 产品相关
   */
  if (
    company.productRelevant === true
  ) {
    score += 14;
  } else if (
    product > 0
  ) {
    score += 5;
  } else {
    score -= 35;
  }

  /*
   * 公司身份
   */
  if (
    company.companyIdentity
  ) {
    score += 5;
  }

  /*
   * 渠道身份
   */
  if (
    role === "importer"
  ) {
    score += 14;
  }

  if (
    role === "buyer" ||
    role === "active buyer"
  ) {
    score += 12;
  }

  if (
    role === "distributor"
  ) {
    score += 8;
  }

  if (
    role === "wholesaler"
  ) {
    score += 6;
  }

  if (
    role === "retailer"
  ) {
    score += 4;
  }

  /*
   * 真主动采购
   */
  if (
    active >= 1
  ) {
    score += 20;
  }

  if (
    active >= 2
  ) {
    score += 10;
  }

  if (
    active >= 4
  ) {
    score += 5;
  }

  /*
   * 渠道关键词只是辅助
   */
  if (
    channel > 0
  ) {
    score += Math.min(
      channel * 2,
      8
    );
  }

  /*
   * 邮箱
   */
  const email =
    normalize(
      company.email
    ).toLowerCase();

  if (
    email
  ) {
    if (
      email.includes(
        "@gmail.com"
      ) ||
      email.includes(
        "@yahoo.com"
      ) ||
      email.includes(
        "@hotmail.com"
      )
    ) {
      score += 5;
    } else {
      score += 10;
    }
  }

  /*
   * 销售自己的产品
   *
   * 这是本版本最重要的扣分项。
   */
  if (
    selling >= 1
  ) {
    score -= 8;
  }

  if (
    selling >= 3
  ) {
    score -= 15;
  }

  if (
    selling >= 6
  ) {
    score -= 20;
  }

  /*
   * 供应商
   */
  if (
    supplier >= 2
  ) {
    score -= 20;
  }

  if (
    supplier >= 4
  ) {
    score -= 25;
  }

  /*
   * 厂家
   */
  if (
    role === "manufacturer"
  ) {
    score -= 70;
  }

  /*
   * Supplier
   */
  if (
    role === "supplier"
  ) {
    score -= 65;
  }

  /*
   * Seller
   */
  if (
    role === "seller"
  ) {
    score -= 45;
  }

  /*
   * 关键限制：
   *
   * 没有主动采购证据，
   * 即使是一个很好的批发商，
   * 也不能给100。
   */
  if (
    active === 0
  ) {
    score =
      Math.min(
        score,
        82
      );
  }

  /*
   * 只有主动采购证据，
   * 才允许进入90分区间。
   */
  if (
    active === 1
  ) {
    score =
      Math.min(
        score,
        91
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
