function text(value) {
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

const SUPPLIER_SIGNALS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "supplier",
  "factory direct",
  "oem manufacturer",
  "contract manufacturer",
  "cnc machining",
  "machining service",
  "wholesale supplier"
];

const REVERSE_SIGNALS = [
  "become a distributor",
  "become our distributor",
  "authorized distributor application",
  "distributor application",
  "distributor program",
  "distributor requirements",
  "dealer application",
  "dealer program",
  "become a dealer",
  "become a reseller",
  "authorized reseller",
  "reseller application",
  "buy our products",
  "buy from us",
  "purchase our products",
  "our exclusive products",
  "minimum purchase requirement",
  "minimum purchase target",
  "minimum order quantity",
  "moq required",
  "apply to become",
  "wholesale from us",
  "open a wholesale account"
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

function count(
  textValue,
  signals
) {
  const value =
    text(textValue)
      .toLowerCase();

  return signals.reduce(
    (total, signal) =>
      total +
      (
        value.includes(
          signal
        )
          ? 1
          : 0
      ),
    0
  );
}

export function scoreCompany(
  company
) {
  if (!company) {
    return 0;
  }

  const combined = [
    company.company,
    company.description,
    company.type,
    company.supplyRole,
    company.website,
    company.buyerEvidence,
    company.reverseSellingEvidence,
    company.qualityReason
  ].join(" ");

  let score = 35;

  const buyerHits =
    count(
      combined,
      BUYER_SIGNALS
    );

  const activeHits =
    count(
      combined,
      ACTIVE_BUYING_SIGNALS
    );

  const supplierHits =
    count(
      combined,
      SUPPLIER_SIGNALS
    );

  const reverseHits =
    count(
      combined,
      REVERSE_SIGNALS
    );

  const productHits =
    count(
      combined,
      PRODUCT_SIGNALS
    );

  /*
   * 官网
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
    score += 15;
  } else if (
    productHits > 0
  ) {
    score += 5;
  } else {
    score -= 35;
  }

  /*
   * 供应链角色
   */
  const role =
    text(
      company.supplyRole ||
      company.type
    ).toLowerCase();

  if (
    role === "importer"
  ) {
    score += 18;
  }

  if (
    role === "buyer"
  ) {
    score += 17;
  }

  if (
    role === "distributor"
  ) {
    score += 10;
  }

  if (
    role === "wholesaler"
  ) {
    score += 9;
  }

  if (
    role === "retailer"
  ) {
    score += 6;
  }

  /*
   * 主动采购是核心加分项
   */
  if (
    activeHits >= 1
  ) {
    score += 12;
  }

  if (
    activeHits >= 2
  ) {
    score += 8;
  }

  if (
    activeHits >= 4
  ) {
    score += 5;
  }

  /*
   * 买家关键词只做辅助，
   * 防止“Wholesale”一个词就冲到100分。
   */
  if (
    buyerHits >= 1
  ) {
    score += Math.min(
      buyerHits * 2,
      10
    );
  }

  /*
   * 邮箱
   */
  const email =
    text(
      company.email
    ).toLowerCase();

  if (
    email &&
    !email.includes(
      "example.com"
    ) &&
    !email.includes(
      "test.com"
    ) &&
    !email.includes(
      "gmail.com"
    ) &&
    !email.includes(
      "yahoo.com"
    )
  ) {
    score += 12;
  } else if (
    email
  ) {
    /*
     * Gmail/Yahoo 仍然有价值，
     * 但企业邮箱权重更高。
     */
    score += 6;
  }

  /*
   * 供应商属性
   */
  if (
    supplierHits >= 2
  ) {
    score -= 20;
  }

  if (
    supplierHits >= 4
  ) {
    score -= 25;
  }

  /*
   * 反向招商
   */
  if (
    reverseHits >= 1
  ) {
    score -= 25;
  }

  if (
    reverseHits >= 2
  ) {
    score -= 35;
  }

  if (
    reverseHits >= 4
  ) {
    score -= 25;
  }

  /*
   * 如果搜索引擎已经识别为厂家，
   * 这里再做一道保险。
   */
  if (
    role === "manufacturer"
  ) {
    score -= 70;
  }

  if (
    role === "supplier"
  ) {
    score -= 65;
  }

  /*
   * 绝对上限。
   *
   * 没有主动采购证据，
   * 即使是批发商，也不允许轻易100分。
   */
  if (
    activeHits === 0 &&
    role !== "importer"
  ) {
    score = Math.min(
      score,
      88
    );
  }

  /*
   * 真正有主动采购信号，
   * 才有机会进入90分以上。
   */
  if (
    activeHits >= 1 &&
    (
      role === "importer" ||
      role === "buyer"
    )
  ) {
    score += 5;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}
