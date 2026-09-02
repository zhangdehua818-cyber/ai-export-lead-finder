/**
 * V3.5 AI开发信生成器
 *
 * 当前没有付费AI API时：
 * 使用规则生成高质量英文开发信。
 *
 * 重要：
 * 绝不出现 [object Object]
 * 绝不把中文产品名直接塞进英文正文。
 */

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    if (value.name) return safeString(value.name);
    if (value.title) return safeString(value.title);
    if (value.text) return safeString(value.text);
    if (value.value) return safeString(value.value);

    return "";
  }

  return "";
}

function cleanProduct(product) {
  let value = safeString(product);

  if (!value) {
    return "mobile phone accessories";
  }

  const map = {
    "手机壳": "phone cases",
    "手机套": "phone cases",
    "手机配件": "mobile phone accessories",
    "手机膜": "phone screen protectors",
    "充电器": "phone chargers",
    "数据线": "charging cables",
    "蓝牙耳机": "Bluetooth earphones",
    "耳机": "earphones",
    "充电宝": "power banks",
    "移动电源": "power banks"
  };

  if (map[value]) {
    return map[value];
  }

  return value;
}

function cleanCompany(company) {
  const value = safeString(company);

  if (!value) {
    return "your company";
  }

  return value
    .replace(/\[object Object\]/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "your company";
}

function detectGreeting(customer) {
  const type = safeString(customer.type).toLowerCase();

  if (type === "retailer") {
    return "Dear Purchasing Team,";
  }

  if (type === "distributor") {
    return "Dear Purchasing Team,";
  }

  if (type === "importer") {
    return "Dear Import Team,";
  }

  if (type === "wholesaler") {
    return "Dear Purchasing Team,";
  }

  if (type === "brand") {
    return "Dear Product Sourcing Team,";
  }

  return "Dear Purchasing Team,";
}

function cleanDescription(description) {
  const value = safeString(description);

  if (!value) return "";

  return value
    .replace(/\[object Object\]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 350);
}

export function generateEmail(product, customer) {
  const productName = cleanProduct(product);

  const company = cleanCompany(
    customer?.company
  );

  const type = safeString(
    customer?.type
  );

  const website = safeString(
    customer?.website
  );

  const description = cleanDescription(
    customer?.description
  );

  const greeting = detectGreeting(customer || {});

  let relevanceSentence =
    `We came across ${company} while researching companies in the ${productName} market.`;

  if (type.toLowerCase() === "retailer") {
    relevanceSentence =
      `We noticed that ${company} operates in the retail market, and we believe our ${productName} could fit your product range.`;
  }

  if (type.toLowerCase() === "distributor") {
    relevanceSentence =
      `We noticed that ${company} is active in distribution, and we believe our ${productName} could be a good addition to your portfolio.`;
  }

  if (type.toLowerCase() === "importer") {
    relevanceSentence =
      `We noticed that ${company} is involved in importing products for the market, and we would like to introduce our ${productName}.`;
  }

  if (type.toLowerCase() === "wholesaler") {
    relevanceSentence =
      `We noticed that ${company} is active in wholesale distribution, and we would like to introduce our ${productName}.`;
  }

  if (type.toLowerCase() === "brand") {
    relevanceSentence =
      `We noticed that ${company} has a product brand in the market, and we would like to explore whether our ${productName} could support your sourcing needs.`;
  }

  const subject =
    `${productName
      .replace(/\b\w/g, c => c.toUpperCase())} – Supply Opportunity`;

  const body = [
    `Subject: ${subject}`,
    "",
    greeting,
    "",
    relevanceSentence,
    "",
    `We are a China-based manufacturer specializing in ${productName}. We can support OEM/ODM projects, custom packaging, and flexible order quantities depending on your requirements.`,
    "",
    "If you are currently sourcing this category, I would be happy to send you our product catalog, pricing, MOQ, and available customization options.",
    "",
    "Would you be open to taking a quick look at our product range?",
    "",
    "Best regards,",
    "Sales Team",
    "China"
  ].join("\n");

  return {
    subject,
    body,
    company,
    product: productName,
    website,
    description
  };
}
