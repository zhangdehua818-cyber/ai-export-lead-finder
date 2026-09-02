/**
 * V3.5 企业买家评分
 *
 * 评分目标：
 * 不是“和产品有关”就高分，
 * 而是判断“值不值得开发”。
 */

const STRONG_BUYER_SIGNALS = [
  "purchasing",
  "procurement",
  "purchase order",
  "request for quotation",
  "request a quote",
  "rfq",
  "sourcing",
  "importer",
  "importers",
  "distributor",
  "distributors",
  "wholesaler",
  "wholesalers"
];

const BUYER_SIGNALS = [
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
  "brand",
  "shop",
  "stores"
];

const PRODUCT_SIGNALS = [
  "phone case",
  "phone cases",
  "phone accessory",
  "phone accessories",
  "mobile accessories",
  "mobile phone accessories",
  "cell phone accessories",
  "smartphone accessories"
];

const SUPPLIER_SIGNALS = [
  "manufacturer",
  "manufacturing",
  "factory",
  "supplier",
  "suppliers",
  "factory direct",
  "oem manufacturer",
  "odm manufacturer",
  "cnc machining",
  "machining service",
  "contract manufacturer"
];

const BAD_SIGNALS = [
  "freight",
  "freight forwarding",
  "freight forwarder",
  "logistics",
  "shipping company",
  "cargo",
  "buyer list",
  "buyers list",
  "supplier directory",
  "company directory",
  "b2b directory",
  "complete guide",
  "marketplace"
];

function textOf(company) {
  return [
    company.company,
    company.title,
    company.description,
    company.website,
    company.verifiedText,
    company.verifiedTitle,
    company.type
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function countSignals(text, list) {
  let count = 0;

  for (const signal of list) {
    if (text.includes(signal)) {
      count++;
    }
  }

  return count;
}

export function scoreCompany(company) {
  const text = textOf(company);

  let score = 25;

  const strongBuyer = countSignals(
    text,
    STRONG_BUYER_SIGNALS
  );

  const buyer = countSignals(
    text,
    BUYER_SIGNALS
  );

  const product = countSignals(
    text,
    PRODUCT_SIGNALS
  );

  const supplier = countSignals(
    text,
    SUPPLIER_SIGNALS
  );

  const bad = countSignals(
    text,
    BAD_SIGNALS
  );

  // 强买家信号
  score += Math.min(strongBuyer * 10, 40);

  // 普通买家信号
  score += Math.min(buyer * 6, 24);

  // 产品相关性
  score += Math.min(product * 5, 15);

  // 官网验证
  if (company.verified === true) {
    score += 8;
  }

  // 邮箱
  if (
    company.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email)
  ) {
    score += 8;
  }

  // 供应商惩罚
  score -= Math.min(supplier * 15, 45);

  // 垃圾页面严重惩罚
  score -= Math.min(bad * 20, 60);

  // 明确类型奖励
  const type = String(company.type || "").toLowerCase();

  if (
    [
      "retailer",
      "distributor",
      "importer",
      "wholesaler",
      "brand"
    ].includes(type)
  ) {
    score += 5;
  }

  // 没有任何买家证据
  if (strongBuyer === 0 && buyer === 0) {
    score -= 20;
  }

  // 明确是纯供应商
  if (
    supplier >= 2 &&
    strongBuyer === 0 &&
    buyer === 0
  ) {
    score -= 30;
  }

  // 限制范围
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}
