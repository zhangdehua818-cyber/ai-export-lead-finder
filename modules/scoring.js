/**
 * AI外贸客户开发助手 V3.6
 *
 * 最终客户评分
 */

const STRONG_BUYER = [
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

const BUYER = [
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

const PRODUCT = [
  "phone case",
  "phone cases",
  "phone accessory",
  "phone accessories",
  "mobile accessories",
  "mobile phone accessories",
  "cell phone accessories",
  "smartphone accessories"
];

const SUPPLIER = [
  "manufacturer",
  "manufacturing",
  "factory",
  "supplier",
  "suppliers",
  "factory direct",
  "oem manufacturer",
  "odm manufacturer",
  "contract manufacturer",
  "production factory"
];

const BAD = [
  "directory",
  "buyers list",
  "buyer list",
  "supplier directory",
  "company directory",
  "importer list",
  "buying leads",
  "complete guide",
  "marketplace",
  "freight",
  "logistics",
  "freight forwarding",
  "shipping company"
];

function safe(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {

    return (
      value.text ||
      value.name ||
      value.title ||
      value.value ||
      ""
    );
  }

  return String(value);
}

function getText(company) {

  return [
    company.company,
    company.type,
    company.description,
    company.website,
    company.verifiedTitle,
    company.verifiedText,
    company.verification
  ]
    .map(safe)
    .join(" ")
    .toLowerCase();
}

function count(text, words) {

  let result = 0;

  for (const word of words) {

    if (
      text.includes(word)
    ) {
      result++;
    }
  }

  return result;
}

export function scoreCompany(
  company
) {

  const text =
    getText(company);

  /*
   * 如果搜索阶段已经核验，
   * 直接给予基础可信度。
   */
  let score =
    company.verified === true
      ? 25
      : 10;

  const strong =
    count(
      text,
      STRONG_BUYER
    );

  const buyer =
    count(
      text,
      BUYER
    );

  const product =
    count(
      text,
      PRODUCT
    );

  const supplier =
    count(
      text,
      SUPPLIER
    );

  const bad =
    count(
      text,
      BAD
    );

  /*
   * 强买家信号
   */
  score +=
    Math.min(
      strong * 10,
      40
    );

  /*
   * 普通买家信号
   */
  score +=
    Math.min(
      buyer * 6,
      24
    );

  /*
   * 产品匹配
   */
  score +=
    Math.min(
      product * 5,
      20
    );

  /*
   * 企业类型
   */
  const type =
    safe(
      company.type
    ).toLowerCase();

  if (
    type === "importer" ||
    type === "distributor" ||
    type === "wholesaler"
  ) {
    score += 8;
  }

  if (
    type === "retailer" ||
    type === "brand"
  ) {
    score += 6;
  }

  /*
   * 真实邮箱
   */
  if (
    company.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      company.email
    )
  ) {
    score += 8;
  }

  /*
   * 二次核验
   */
  if (
    company.verification ===
    "二次企业核验通过"
  ) {
    score += 8;
  }

  /*
   * 供应商惩罚
   */
  score -=
    Math.min(
      supplier * 14,
      42
    );

  /*
   * 垃圾页面惩罚
   */
  score -=
    Math.min(
      bad * 20,
      60
    );

  /*
   * 完全没有买家信号
   */
  if (
    strong === 0 &&
    buyer === 0
  ) {
    score -= 30;
  }

  /*
   * 只有供应商，没有买家属性
   */
  if (
    supplier >= 2 &&
    strong === 0 &&
    buyer === 0
  ) {
    score -= 40;
  }

  /*
   * 限制
   */
  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );

  return Math.round(
    score
  );
}
