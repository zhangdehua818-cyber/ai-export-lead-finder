/*
 * AI外贸客户开发助手 V3.5
 * 外贸开发信生成器
 *
 * 重点：
 * 绝不允许出现 [object Object]
 */

const PRODUCT_MAP = {
  "手机壳": "phone cases",
  "手机保护壳": "phone cases",
  "手机配件": "mobile phone accessories",
  "充电宝": "power banks",
  "移动电源": "power banks",
  "蓝牙耳机": "Bluetooth earbuds",
  "耳机": "earbuds",
  "数据线": "charging cables",
  "充电线": "charging cables",
  "钢化膜": "tempered glass screen protectors",
  "保护膜": "screen protectors",
  "背包": "backpacks",
  "运动服": "sportswear",
  "服装": "clothing",
  "鞋": "shoes",
  "玩具": "toys"
};

const COUNTRY_MAP = {
  "美国": "the United States",
  "美国市场": "the United States",
  "英国": "the United Kingdom",
  "加拿大": "Canada",
  "澳大利亚": "Australia",
  "德国": "Germany",
  "法国": "France",
  "意大利": "Italy",
  "西班牙": "Spain",
  "日本": "Japan",
  "韩国": "South Korea",
  "新加坡": "Singapore",
  "印度": "India",
  "巴西": "Brazil",
  "墨西哥": "Mexico"
};

function text(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    if (value.name) {
      return text(value.name);
    }

    if (value.company) {
      return text(value.company);
    }

    if (value.companyName) {
      return text(value.companyName);
    }

    if (value.title) {
      return text(value.title);
    }

    if (value.value) {
      return text(value.value);
    }

    return "";
  }

  return "";
}

function normalizeProduct(product) {
  const value = text(product);

  if (!value) {
    return "our products";
  }

  if (PRODUCT_MAP[value]) {
    return PRODUCT_MAP[value];
  }

  return value;
}

function normalizeCountry(country) {
  const value = text(country);

  if (!value) {
    return "your market";
  }

  if (COUNTRY_MAP[value]) {
    return COUNTRY_MAP[value];
  }

  return value;
}

function normalizeCompany(company) {
  const value = text(company);

  if (!value) {
    return "your company";
  }

  return value;
}

/*
 * 支持多种调用方式：
 *
 * generateEmail(product, country, company)
 *
 * generateEmail({
 *   product,
 *   country,
 *   company
 * })
 */
export function generateEmail(
  productOrObject,
  country,
  company
) {
  let product;
  let targetCountry;
  let companyName;

  if (
    productOrObject &&
    typeof productOrObject === "object"
  ) {
    product =
      productOrObject.product ||
      productOrObject.productName;

    targetCountry =
      productOrObject.country ||
      productOrObject.targetCountry;

    companyName =
      productOrObject.company ||
      productOrObject.companyName ||
      productOrObject.name;
  } else {
    product = productOrObject;
    targetCountry = country;
    companyName = company;
  }

  const productName = normalizeProduct(product);
  const countryName = normalizeCountry(targetCountry);
  const customerName = normalizeCompany(companyName);

  /*
   * 最终保险：
   * 如果任何地方还传进来了对象，
   * 绝不允许生成 [object Object]。
   */
  const safeProduct =
    productName.includes("[object Object]")
      ? "our products"
      : productName;

  const safeCountry =
    countryName.includes("[object Object]")
      ? "your market"
      : countryName;

  const safeCompany =
    customerName.includes("[object Object]")
      ? "your company"
      : customerName;

  const subject =
    `${safeProduct.replace(/\b\w/g, c => c.toUpperCase())} ` +
    `Sourcing Opportunity`;

  const body = [
    `Dear Purchasing Team at ${safeCompany},`,
    "",
    `I am reaching out from a manufacturer in China specializing in ${safeProduct}.`,
    "",
    `We are currently looking to work with reliable wholesalers, distributors, retailers and sourcing partners in ${safeCountry}.`,
    "",
    `We can support OEM/ODM requirements, bulk orders and customized packaging depending on your needs.`,
    "",
    `If ${safeProduct} is part of your current product range, I would be happy to send you our catalog, pricing and MOQ information for review.`,
    "",
    `Would you be the right person to discuss new supplier opportunities?`,
    "",
    `Best regards,`,
    `Sales Team`,
    `China`
  ].join("\n");

  return [
    `Subject: ${subject}`,
    "",
    body
  ].join("\n");
}
