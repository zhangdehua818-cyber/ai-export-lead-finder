function extractEmails(text) {

  if (!text) {
    return [];
  }

  const matches =
    text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    ) || [];

  return [
    ...new Set(
      matches.map(
        email =>
          email
            .trim()
            .toLowerCase()
      )
    )
  ];

}

function isBadEmail(email) {

  const lower =
    email.toLowerCase();

  const blocked =
    [
      "example.com",
      "example.org",
      "example.net",
      "sentry.io",
      "wixpress.com"
    ];

  return blocked.some(
    domain =>
      lower.endsWith(
        "@" + domain
      )
  );

}

export async function findContact(
  website
) {

  if (!website) {

    return {
      email: "",
      source: "",
      verified: false
    };

  }

  const pages = [
    website,
    `${website}/contact`,
    `${website}/contact-us`,
    `${website}/about`,
    `${website}/about-us`
  ];

  const found = [];

  for (const page of pages) {

    try {

      const controller =
        new AbortController();

      const timeout =
        setTimeout(
          () => controller.abort(),
          5000
        );

      const response =
        await fetch(
          page,
          {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 AI-Export-Lead-Finder/3.4"
            }
          }
        );

      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      const html =
        await response.text();

      const emails =
        extractEmails(html);

      for (
        const email of emails
      ) {

        if (!isBadEmail(email)) {

          found.push({
            email,
            source: page
          });

        }

      }

    } catch {

      // 网站拒绝访问或超时，继续下一个页面

    }

  }

  if (!found.length) {

    return {
      email: "",
      source: "",
      verified: false
    };

  }

  /*
   * 优先使用通用商务邮箱
   */
  const priorityWords = [
    "sales@",
    "info@",
    "contact@",
    "business@",
    "commercial@",
    "purchasing@",
    "procurement@"
  ];

  found.sort((a, b) => {

    const aScore =
      priorityWords.some(
        word =>
          a.email.startsWith(word)
      )
        ? 1
        : 0;

    const bScore =
      priorityWords.some(
        word =>
          b.email.startsWith(word)
      )
        ? 1
        : 0;

    return bScore - aScore;

  });

  return {

    email:
      found[0].email,

    source:
      found[0].source,

    verified: false

  };

}
