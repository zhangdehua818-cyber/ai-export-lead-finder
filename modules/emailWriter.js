function toText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (
    typeof value === "object"
  ) {
    return (
      value.name ||
      value.company ||
      value.label ||
      value.value ||
      value.country ||
      ""
    );
  }

  return String(value);
}

function normalizeProduct(product) {

  const value =
    toText(product).trim();

  const map = {

    "手机壳":
      "Phone Cases",

    "手机保护壳":
      "Phone Cases",

    "手机套":
      "Phone Cases",

    "手机配件":
      "Mobile Phone Accessories",

    "充电器":
      "Phone Chargers",

    "手机充电器":
      "Phone Chargers",

    "数据线":
      "USB Charging Cables",

    "充电线":
      "USB Charging Cables",

    "耳机":
      "Earphones",

    "蓝牙耳机":
      "Wireless Earbuds",

    "充电宝":
      "Power Banks",

    "移动电源":
      "Power Banks",

    "平板保护壳":
      "Tablet Cases",

    "电脑包":
      "Laptop Bags"
  };

  return map[value] || value;
}

function normalizeCountry(country) {

  const value =
    toText(country).trim();

  const map = {

    "美国":
      "United States",

    "英国":
      "United Kingdom",

    "德国":
      "Germany",

    "法国":
      "France",

    "加拿大":
      "Canada",

    "澳大利亚":
      "Australia",

    "日本":
      "Japan",

    "韩国":
      "South Korea",

    "新加坡":
      "Singapore",

    "阿联酋":
      "United Arab Emirates"
  };

  return map[value] || value;
}

function normalizeCompany(company) {

  if (!company) {
    return "Purchasing Team";
  }

  const value =
    toText(company).trim();

  if (!value) {
    return "Purchasing Team";
  }

  return value;
}

export function generateEmail(
  productOrData,
  country,
  company
) {

  let product;
  let targetCountry;
  let companyName;

  if (
    productOrData &&
    typeof productOrData === "object"
  ) {

    product =
      productOrData.product ||
      productOrData.productName ||
      "";

    targetCountry =
      productOrData.country ||
      productOrData.targetCountry ||
      "";

    companyName =
      productOrData.company ||
      productOrData.companyName ||
      productOrData.name ||
      "";

  } else {

    product =
      productOrData;

    targetCountry =
      country;

    companyName =
      company;
  }

  product =
    normalizeProduct(product);

  targetCountry =
    normalizeCountry(targetCountry);

  companyName =
    normalizeCompany(companyName);

  if (
    product.includes(
      "[object Object]"
    )
  ) {
    product =
      "Our Products";
  }

  if (
    targetCountry.includes(
      "[object Object]"
    )
  ) {
    targetCountry =
      "your market";
  }

  if (
    companyName.includes(
      "[object Object]"
    )
  ) {
    companyName =
      "Purchasing Team";
  }

  const subject =
    `${product} Sourcing Opportunity`;

  return `Subject: ${subject}

Hello ${companyName} Team,

I’m reaching out from a China-based manufacturer and exporter specializing in ${product.toLowerCase()}.

We are looking to develop reliable distribution, wholesale and sourcing partnerships in ${targetCountry}.

Our products can be supplied for wholesale, retail and private-label requirements, depending on your needs.

If your company is currently sourcing ${product.toLowerCase()}, I would be happy to share our product catalog, pricing and available models for your review.

Would you be open to receiving more information?

Best regards,
Export Sales Team
China`;
}
