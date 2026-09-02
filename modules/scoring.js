function text(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
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
  "dealer application",
  "dealer program",
  "become a dealer",
  "become a reseller",
  "authorized reseller",
  "reseller application",
  "buy our products",
  "buy from us",
  "our exclusive products",
  "minimum purchase requirement",
  "minimum purchase target",
  "minimum order quantity",
  "moq required",
  "apply to become",
  "distributor requirements",
  "dealer requirements"
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

function count(textValue, signals) {
  const value =
    text(textValue).toLowerCase();

  return signals.reduce(
    (total, signal) =>
      total +
      (value.includes(signal)
        ? 1
        : 0),
    0
  );
}

export function scoreCompany(company) {
  if (!company) {
    return 0;
  }

  const combined = [
    company.company,
    company.description,
    company.type,
    company.website,
    company.buyerEvidence,
    company.qualityReason
  ].join(" ");

  let score = 40;

  const buyerHits =
    count(
      combined,
      BUYER_SIGNALS
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
    company.verified === true ||
    company.websiteVerified === true
  ) {
    score += 12;
  } else {
    score -= 15;
  }

  /*
   * 产品
   */
  if (
    company.productRelevant === true
  ) {
    score += 15;
  } else if (
    productHits > 0
  ) {
    score += 8;
  } else {
    score -= 30;
  }

  /*
   * 买家信号
   */
  if (buyerHits >= 1) {
    score += Math.min(
      buyerHits * 4,
      20
    );
  }

  /*
   * 公司类型
   */
  const type =
    text(company.type)
      .toLowerCase();

  if (
    type.includes("importer")
  ) {
    score += 8;
  }

  if (
    type.includes("distributor")
  ) {
    score += 7;
  }

  if (
    type.includes("wholesaler")
  ) {
    score += 6;
  }

  if (
    type.includes("retailer")
  ) {
    score += 5;
  }

  /*
   * 企业邮箱
   */
  const email =
    text(company.email)
      .toLowerCase();

  if (
    email &&
    !email.includes(
      "example.com"
    ) &&
    !email.includes(
      "test.com"
    )
  ) {
    score += 12;
  }

  /*
   * 供应商
   */
  if (supplierHits >= 2) {
    score -= 30;
  }

  if (supplierHits >= 4) {
    score -= 20;
  }

  /*
   * 反向招商：
   * 这是最高级别的扣分。
   */
  if (reverseHits >= 1) {
    score -= 35;
  }

  if (reverseHits >= 2) {
    score -= 30;
  }

  /*
   * 如果 companySearch 已经确认，
   * 仍然保留这层保险。
   */
  if (
    Number(
      company.reverseDistributionHits
    ) >= 2
  ) {
    score -= 50;
  }

  /*
   * 质量分只做轻微辅助，
   * 防止搜索质量分直接把垃圾顶到90+。
   */
  if (
    typeof company.qualityScore ===
      "number" &&
    company.qualityScore > 0
  ) {
    score += Math.round(
      (company.qualityScore - 50) *
        0.1
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
