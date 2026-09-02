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
  "阿联酋": "the United Arab Emirates",
  "沙特": "Saudi Arabia",
  "新加坡": "Singapore",
  "印度": "India",
  "墨西哥": "Mexico",
  "巴西": "Brazil",
  "意大利": "Italy",
  "西班牙": "Spain"
};

function normalize(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  if (
    typeof value === "object"
  ) {
    return (
      value.company ||
      value.name ||
      value.title ||
      value.value ||
      value.text ||
      ""
    ).toString().trim();
  }

  return String(
    value
  ).trim();
}

function productName(
  product
) {
  const value =
    normalize(product);

  return (
    PRODUCT_MAP[value] ||
    value
  );
}

function countryName(
  country
) {
  const value =
    normalize(country);

  return (
    COUNTRY_MAP[value] ||
    value
  );
}

/*
 * 支持多种调用方式：
 *
 * generateEmail(product, country, company)
 *
 * 也支持：
 *
 * generateEmail({
 *   product,
 *   country,
 *   company
 * })
 */
export function generateEmail(
  product,
  country,
  company
) {
  let data = {};

  if (
    product &&
    typeof product === "object"
  ) {
    data =
      product;
  } else {
    data = {
      product,
      country,
      company
    };
  }

  const finalProduct =
    productName(
      data.product
    );

  const finalCountry =
    countryName(
      data.country
    );

  let companyName =
    normalize(
      data.company
    );

  if (
    !companyName
  ) {
    companyName =
      "your company";
  }

  if (
    !finalProduct
  ) {
    return [
      `Subject: Business Cooperation Opportunity`,
      "",
      `Dear ${companyName} Team,`,
      "",
      "We are a manufacturer and exporter from China.",
      "",
      "We are looking to establish long-term cooperation with reliable partners in your market.",
      "",
      "If you are currently sourcing products from China, we would be happy to provide our product catalog, pricing and samples.",
      "",
      "Best regards,",
      "Sales Team"
    ].join("\n");
  }

  const subject =
    `${finalProduct.replace(
      /\b\w/g,
      c => c.toUpperCase()
    )} Sourcing Opportunity`;

  return [
    `Subject: ${subject}`,
    "",
    `Dear ${companyName} Team,`,
    "",
    `We are a manufacturer and exporter from China specializing in ${finalProduct}.`,
    "",
    `We are currently looking to build long-term cooperation with distributors, wholesalers and retailers in ${finalCountry}.`,
    "",
    `If your company is currently sourcing ${finalProduct} or considering new suppliers, we would be happy to provide our product catalog, pricing and samples.`,
    "",
    "Please let me know if this is relevant to your current purchasing needs.",
    "",
    "Best regards,",
    "Sales Team"
  ].join("\n");
}
