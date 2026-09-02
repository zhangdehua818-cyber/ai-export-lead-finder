/*
 * AI Export Lead Finder V3.5
 * Real Buyer Scoring Engine
 */

export function scoreCompany(company) {

  const c = company || {};

  let score = 40;


  /*
   * 官网验证
   */
  if (
    c.verified ||
    c.websiteVerified
  ) {
    score += 10;
  } else {
    score -= 10;
  }


  /*
   * 产品相关性
   */
  const relevance =
    Array.isArray(c.relevanceEvidence)
      ? c.relevanceEvidence
      : [];

  if (relevance.length >= 3) {
    score += 12;
  } else if (relevance.length >= 1) {
    score += 8;
  }


  /*
   * 直接买家证据
   */
  const buyerEvidence =
    Array.isArray(c.buyerEvidence)
      ? c.buyerEvidence
      : [];

  if (buyerEvidence.length >= 3) {
    score += 22;
  } else if (buyerEvidence.length === 2) {
    score += 18;
  } else if (buyerEvidence.length === 1) {
    score += 12;
  }


  /*
   * 渠道型买家
   */
  const channelEvidence =
    Array.isArray(c.channelEvidence)
      ? c.channelEvidence
      : [];

  if (channelEvidence.length >= 3) {
    score += 15;
  } else if (channelEvidence.length === 2) {
    score += 12;
  } else if (channelEvidence.length === 1) {
    score += 8;
  }


  /*
   * 邮箱
   */
  if (c.email) {
    score += 8;
  }


  /*
   * 真实买家 + 邮箱 + 官网
   */
  if (
    c.email &&
    c.verified &&
    buyerEvidence.length > 0
  ) {
    score += 5;
  }


  /*
   * 供应商 / 制造商
   */
  const supplierEvidence =
    Array.isArray(c.supplierEvidence)
      ? c.supplierEvidence
      : [];

  if (
    c.supplierStrong ||
    c.pageType === "supplier"
  ) {
    score -= 45;
  } else if (supplierEvidence.length >= 2) {
    score -= 25;
  } else if (supplierEvidence.length === 1) {
    score -= 10;
  }


  /*
   * 下游经销商招募
   *
   * 例如：
   * Become A Distributor
   * Authorized Distributor
   */
  if (c.downstreamRecruiter) {
    score -= 40;
  }


  /*
   * 目录 / 文章 / 物流
   */
  if (
    c.pageType === "directory"
  ) {
    score -= 50;
  }

  if (
    c.pageType === "article"
  ) {
    score -= 45;
  }

  if (
    c.pageType === "logistics"
  ) {
    score -= 45;
  }


  /*
   * 防止“卖家自己的购买按钮”
   * 被误判成真正买家
   */
  const sellerEvidence =
    Array.isArray(c.sellerEvidence)
      ? c.sellerEvidence
      : [];

  if (
    sellerEvidence.length >= 3 &&
    buyerEvidence.length === 0
  ) {
    score -= 15;
  }


  /*
   * 没有任何买家证据
   *
   * 渠道型企业仍可保留，
   * 但不能获得过高分。
   */
  if (
    buyerEvidence.length === 0 &&
    channelEvidence.length === 0
  ) {
    score -= 15;
  }


  /*
   * 如果只有渠道证据，
   * 不允许轻易达到 90+
   */
  if (
    buyerEvidence.length === 0 &&
    channelEvidence.length > 0
  ) {
    score = Math.min(score, 85);
  }


  /*
   * 没有直接采购证据的普通渠道商
   * 不允许出现夸张的 95/100
   */
  if (
    buyerEvidence.length === 0
  ) {
    score = Math.min(score, 85);
  }


  /*
   * 最终范围
   *
   * V3.5 不再出现轻易 100 分的情况。
   */
  score = Math.max(0, Math.min(95, score));

  return Math.round(score);
}
