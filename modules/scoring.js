/*
 * AI外贸客户开发助手 V3.5
 * 客户质量评分引擎
 *
 * 评分不再简单根据关键词堆分。
 * 100分必须非常难拿。
 */

const BUYER_SIGNALS = [
  "buyer",
  "purchasing",
  "procurement",
  "sourcing",
  "importer",
  "distributor",
  "distribution",
  "wholesaler",
  "wholesale",
  "retailer",
  "retail",
  "reseller",
  "bulk order",
  "bulk orders",
  "b2b",
  "resale"
];

const STRONG_BUYER_SIGNALS = [
  "purchasing",
  "procurement",
  "sourcing",
  "importer",
  "distributor",
  "wholesaler",
  "retailer",
  "bulk orders"
];

const SUPPLIER_SIGNALS = [
  "supplier",
  "suppliers",
  "manufacturer",
  "manufacturing",
  "factory",
  "factory direct",
  "oem manufacturer",
  "contract manufacturer",
  "manufacturing service",
  "machining service",
  "cnc machining"
];

const BAD_PAGE_SIGNALS = [
  "buyer list",
  "buyers list",
  "importer list",
  "supplier directory",
  "b2b directory",
  "buying leads",
  "complete guide",
  "ultimate guide",
  "how to",
  "blog",
  "article",
  "news",
  "case study",
  "freight",
  "freight forwarding",
  "shipping company",
  "logistics",
  "customs clearance"
];

function toText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return [
      value.company,
      value.companyName,
      value.title,
      value.description,
      value.websiteTitle,
      value.siteName,
      value.websiteText,
      value.type,
      value.buyerEvidence
    ]
      .map(toText)
      .filter(Boolean)
      .join(" ");
  }

  return String(value);
}

function countSignals(text, signals) {
  const lower = text.toLowerCase();

  return signals.filter(signal =>
    lower.includes(signal)
  ).length;
}

export function scoreCompany(company) {
  if (!company) {
    return 0;
  }

  const text = toText(company).toLowerCase();

  let score = 45;

  /*
   * 1. 官网真实性
   */
  if (
    company.verified === true ||
    company.websiteVerified === true
  ) {
    score += 10;
  } else {
    score -= 15;
  }

  /*
   * 2. 买家信号
   */
  const buyerCount = countSignals(
    text,
    BUYER_SIGNALS
  );

  const strongBuyerCount = countSignals(
    text,
    STRONG_BUYER_SIGNALS
  );

  if (buyerCount >= 1) {
    score += 8;
  }

  if (buyerCount >= 2) {
    score += 5;
  }

  if (strongBuyerCount >= 1) {
    score += 10;
  }

  if (strongBuyerCount >= 2) {
    score += 5;
  }

  /*
   * 3. 类型奖励
   */
  const type = String(company.type || "").toLowerCase();

  if (type.includes("distributor")) {
    score += 8;
  }

  if (type.includes("wholesaler")) {
    score += 8;
  }

  if (type.includes("importer")) {
    score += 8;
  }

  if (type.includes("retailer")) {
    score += 7;
  }

  if (type.includes("buyer")) {
    score += 5;
  }

  /*
   * 4. 产品相关度
   */
  if (company.productRelevant === true) {
    score += 12;
  }

  /*
   * 5. 官网邮箱
   */
  if (company.email) {
    const email = String(company.email).toLowerCase();

    if (
      email.includes("@") &&
      !email.includes("example.com") &&
      !email.includes("test.com")
    ) {
      score += 10;
    }
  }

  /*
   * 6. 买家证据
   */
  if (
    Array.isArray(company.buyerEvidence) &&
    company.buyerEvidence.length > 0
  ) {
    score += Math.min(
      company.buyerEvidence.length * 2,
      8
    );
  }

  /*
   * 7. 供应商扣分
   */
  const supplierCount = countSignals(
    text,
    SUPPLIER_SIGNALS
  );

  if (supplierCount >= 1) {
    score -= 20;
  }

  if (supplierCount >= 2) {
    score -= 20;
  }

  /*
   * 8. 垃圾页面扣分
   */
  const badPageCount = countSignals(
    text,
    BAD_PAGE_SIGNALS
  );

  if (badPageCount >= 1) {
    score -= 25;
  }

  if (badPageCount >= 2) {
    score -= 20;
  }

  if (company.directory === true) {
    score -= 40;
  }

  if (company.article === true) {
    score -= 30;
  }

  if (company.logistics === true) {
    score -= 40;
  }

  if (company.pageIsBad === true) {
    score -= 30;
  }

  /*
   * 9. 不允许因为关键词太多直接刷到100。
   *
   * 最高分：
   * 真实官网 + 强买家 + 产品相关 + 邮箱
   * 才有机会进入90+
   */
  score = Math.max(
    0,
    Math.min(100, Math.round(score))
  );

  return score;
}
