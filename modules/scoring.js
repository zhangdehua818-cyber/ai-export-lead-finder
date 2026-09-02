export function scoreCompany(company) {

  const c = company || {};

  let score = 40;

  if (
    c.verified ||
    c.websiteVerified
  ) {
    score += 10;
  } else {
    score -= 10;
  }

  const relevance =
    Array.isArray(
      c.relevanceEvidence
    )
      ? c.relevanceEvidence
      : [];

  if (relevance.length >= 3) {
    score += 12;
  } else if (relevance.length >= 1) {
    score += 8;
  }

  const buyerEvidence =
    Array.isArray(
      c.buyerEvidence
    )
      ? c.buyerEvidence
      : [];

  if (buyerEvidence.length >= 3) {
    score += 22;
  } else if (buyerEvidence.length === 2) {
    score += 18;
  } else if (buyerEvidence.length === 1) {
    score += 12;
  }

  const channelEvidence =
    Array.isArray(
      c.channelEvidence
    )
      ? c.channelEvidence
      : [];

  if (channelEvidence.length >= 3) {
    score += 15;
  } else if (channelEvidence.length === 2) {
    score += 12;
  } else if (channelEvidence.length === 1) {
    score += 8;
  }

  if (c.email) {
    score += 8;
  }

  if (
    c.email &&
    c.verified &&
    buyerEvidence.length > 0
  ) {
    score += 5;
  }

  const supplierEvidence =
    Array.isArray(
      c.supplierEvidence
    )
      ? c.supplierEvidence
      : [];

  if (
    c.supplierStrong ||
    c.pageType === "supplier"
  ) {
    score -= 45;

  } else if (
    supplierEvidence.length >= 2
  ) {
    score -= 25;

  } else if (
    supplierEvidence.length === 1
  ) {
    score -= 10;
  }

  if (c.downstreamRecruiter) {
    score -= 40;
  }

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

  const sellerEvidence =
    Array.isArray(
      c.sellerEvidence
    )
      ? c.sellerEvidence
      : [];

  if (
    sellerEvidence.length >= 3 &&
    buyerEvidence.length === 0
  ) {
    score -= 15;
  }

  if (
    buyerEvidence.length === 0 &&
    channelEvidence.length === 0
  ) {
    score -= 15;
  }

  if (
    buyerEvidence.length === 0 &&
    channelEvidence.length > 0
  ) {
    score =
      Math.min(
        score,
        85
      );
  }

  if (
    buyerEvidence.length === 0
  ) {
    score =
      Math.min(
        score,
        85
      );
  }

  score =
    Math.max(
      0,
      Math.min(
        95,
        score
      )
    );

  return Math.round(score);
}
