const PRODUCT_MAP = {
  "手机壳": "phone cases",
  "手机保护壳": "phone cases",
  "手机配件": "mobile phone accessories",
  "数据线": "charging cables",
  "充电线": "charging cables",
  "充电器": "phone chargers",
  "耳机": "earphones",
  "蓝牙耳机": "wireless earbuds",
  "移动电源": "power banks",
  "钢化膜": "tempered glass screen protectors",
  "手机膜": "screen protectors",
  "服装": "clothing",
  "鞋": "shoes",
  "箱包": "bags",
  "玩具": "toys",
  "家具": "furniture"
};

const COUNTRY_MAP = {
  "美国": "the United States",
  "美国市场": "the United States",
  "英国": "the United Kingdom",
  "德国": "Germany",
  "法国": "France",
  "加拿大": "Canada",
  "澳大利亚": "Australia",
  "日本": "Japan",
  "韩国": "South Korea",
  "新加坡": "Singapore",
  "印度": "India",
  "墨西哥": "Mexico",
  "巴西": "Brazil",
  "意大利": "Italy",
  "西班牙": "Spain"
};

function normalize(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.company ||
      value.title ||
      value.value ||
      ""
    ).toString().trim();
  }

  return String(value).trim();
}

function productName(product) {
  const value = normalize(product);

  return PRODUCT_MAP[value] || value || "our products";
}

function countryName(country) {
  const value = normalize(country);

  return COUNTRY_MAP[value] || value || "your market";
}

function companyName(company) {
  const value = normalize(company);

  if (!value) {
    return "your company";
  }

  return value;
}

export function generateEmail(product, country, company) {
  /*
   * 同时兼容：
   *
   * generateEmail(product, country, company)
   *
   * 以及：
   *
   * generateEmail({
   *   product,
   *   country,
   *   company
   * })
   */

  let finalProduct = "";
  let finalCountry = "";
  let finalCompany = "";

  if (
    product &&
    typeof product === "object" &&
    !Array.isArray(product)
  ) {
    finalProduct =
      product.product ||
      product.productName ||
      "";

    finalCountry =
      product.country ||
      product.market ||
      "";

    finalCompany =
      product.company ||
      product.companyName ||
      product.name ||
      "";
  } else {
    finalProduct = product;
    finalCountry = country;
    finalCompany =
      typeof company === "object"
        ? (
            company.company ||
            company.companyName ||
            company.name ||
            ""
          )
        : company;
  }

  finalProduct = productName(finalProduct);
  finalCountry = countryName(finalCountry);
  finalCompany = companyName(finalCompany);

  const subject =
    `${finalProduct} Supply & Cooperation Opportunity`;

  const body = `
Subject: ${subject}

Dear ${finalCompany} Team,

I came across your business while researching companies in ${finalCountry} working with ${finalProduct} and related products.

We are a manufacturer and exporter from China specializing in ${finalProduct}. We can provide competitive pricing, product customization and stable supply for wholesalers, distributors and retailers.

I would be happy to send you our product catalog, pricing and available customization options if you are currently sourcing ${finalProduct}.

Best regards,
Sales Team
China
`.trim();

  return body;
}
