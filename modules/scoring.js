function text(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.text ||
      value.value ||
      JSON.stringify(value)
    );
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
  const value = text(textValue).toLowerCase();

  return signals.reduce((total, signal) => {
    return total + (value.includes(signal) ? 1 : 0);
  }, 0);
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

  const buyerHits = count(combined, BUYER_SIGNALS);
  const supplierHits = count(combined, SUPPLIER_SIGNALS);
  const productHits = count(combined, PRODUCT_SIGNALS);

  // 官网验证
  if (
    company.verified === true ||
    company.websiteVerified === true
  ) {
    score += 12;
  } else {
    score -= 15;
  }

  // 产品相关性
  if (company.productRelevant === true) {
    score += 15;
  } else if (productHits > 0) {
    score += 8;
  } else {
    score -= 25;
  }

  // 买家属性
  if (buyerHits >= 1) {
    score += Math.min(buyerHits * 4, 20);
  }

  // 类型奖励
  const type = text(company.type).toLowerCase();

  if (type.includes("importer")) {
    score += 8;
  }

  if (type.includes("distributor")) {
    score += 7;
  }

  if (type.includes("wholesaler")) {
    score += 6;
  }

  if (type.includes("retailer")) {
    score += 5;
  }

  // 企业邮箱
  const email = text(company.email).toLowerCase();

  if (
    email &&
    !email.includes("example.com") &&
    !email.includes("test.com")
  ) {
    score += 12;
  }

  // 供应商强烈扣分
  if (supplierHits >= 2) {
    score -= 30;
  }

  if (supplierHits >= 4) {
    score -= 20;
  }

  // 已经被识别为坏页面
  const pageType = text(company.pageType).toLowerCase();

  if (
    pageType.includes("directory") ||
    pageType.includes("article") ||
    pageType.includes("blog") ||
    pageType.includes("logistics")
  ) {
    score -= 40;
  }

  // 搜索质量分作为辅助，但不能直接决定最终分数
  if (
    typeof company.qualityScore === "number" &&
    company.qualityScore > 0
  ) {
    score += Math.round(
      (company.qualityScore - 50) * 0.15
    );
  }

  score = Math.round(score);

  return Math.max(0, Math.min(100, score));
}
