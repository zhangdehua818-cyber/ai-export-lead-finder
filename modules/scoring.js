const BUYER_SIGNALS = [
  "procurement",
  "purchasing",
  "purchase",
  "sourcing",
  "outsourcing",
  "rfq",
  "request for quotation",
  "request a quote",
  "purchase order",
  "buyer",
  "importer",
  "distributor",
  "retailer",
  "brand"
];

const SUPPLIER_SIGNALS = [
  "supplier",
  "factory direct",
  "manufacturer of",
  "manufacturer and supplier",
  "cnc machining service",
  "machining service",
  "oem manufacturer",
  "contract manufacturer",
  "wholesale supplier"
];

export async function scoreCompany(
  company
) {

  if (!company) {
    return 0;
  }

  const text = [

    company.company || "",

    company.description || "",

    company.website || "",

    company.keyword || ""

  ]
    .join(" ")
    .toLowerCase();

  let score =
    Number(company.score) || 40;

  /*
   * 买家信号
   */
  for (
    const signal of BUYER_SIGNALS
  ) {

    if (
      text.includes(signal)
    ) {

      score += 4;

    }

  }

  /*
   * 供应商信号
   */
  for (
    const signal of SUPPLIER_SIGNALS
  ) {

    if (
      text.includes(signal)
    ) {

      score -= 7;

    }

  }

  /*
   * 官网已经验证
   */
  if (
    company.websiteVerified
  ) {

    score += 5;

  }

  /*
   * 真实邮箱
   */
  if (
    company.email &&
    company.email.includes("@")
  ) {

    score += 5;

  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );

}
