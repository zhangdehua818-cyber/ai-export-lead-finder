import express from "express";
import cors from "cors";

import {
  encryptPassword,
  comparePassword,
  createToken,
  verifyToken
} from "./modules/auth.js";

import {
  createUser,
  findUser,
  getUserById
} from "./modules/users.js";

import {
  checkMembership
} from "./modules/membership.js";

import {
  analyzeProduct
} from "./modules/productAI.js";

import {
  searchCompanies
} from "./companySearch.js";

import {
  findContact
} from "./modules/emailFinder.js";

import {
  scoreCompany
} from "./modules/scoring.js";

import {
  generateEmail
} from "./modules/emailWriter.js";

import {
  addCustomer
} from "./modules/crm.js";

const app = express();

app.use(cors());

app.use(express.json({
  limit: "2mb"
}));

const PORT = process.env.PORT || 3000;

/* =========================
   基础页面
========================= */

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>AI外贸客户开发助手 V3.5</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{
  font-family:Arial,sans-serif;
  max-width:900px;
  margin:40px auto;
  padding:20px;
}
h1{color:#111827}
.box{
  padding:20px;
  border:1px solid #ddd;
  border-radius:12px;
}
</style>
</head>
<body>
<div class="box">
<h1>AI外贸客户开发助手 V3.5</h1>
<p>真实买家识别 · 企业官网验证 · 公开邮箱发现</p>
<p>API服务运行正常。</p>
</div>
</body>
</html>
  `);
});

/* =========================
   Health
========================= */

app.get("/health", (req, res) => {
  res.json({
    success: true,
    version: "3.5.0",
    status: "healthy",
    search: "Tavily Web Search",
    buyerFilter: "V3.5 Real Buyer Filter",
    email: "Real Public Email Only"
  });
});

/* =========================
   注册
========================= */

app.post("/register", async (req, res) => {
  try {
    const email = String(
      req.body?.email || ""
    ).trim().toLowerCase();

    const password = String(
      req.body?.password || ""
    );

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "请输入邮箱和密码"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "密码至少6位"
      });
    }

    const exists = await findUser(email);

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "该邮箱已经注册"
      });
    }

    const hash = await encryptPassword(password);

    const userId = await createUser(
      email,
      hash
    );

    const user = await getUserById(userId);

    const token = createToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        vip: user.vip
      }
    });

  } catch (error) {

    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "注册失败"
    });
  }
});

/* =========================
   登录
========================= */

app.post("/login", async (req, res) => {
  try {

    const email = String(
      req.body?.email || ""
    ).trim().toLowerCase();

    const password = String(
      req.body?.password || ""
    );

    const user = await findUser(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "邮箱或密码错误"
      });
    }

    const ok = await comparePassword(
      password,
      user.password
    );

    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "邮箱或密码错误"
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        vip: user.vip
      }
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "登录失败"
    });
  }
});

/* =========================
   获取 Token
========================= */

function getTokenFromRequest(req) {

  const header =
    req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.substring(7).trim();
}

/* =========================
   客户开发
========================= */

app.post("/find-leads", async (req, res) => {

  try {

    console.log("========== V3.5 SEARCH ==========");

    const token =
      getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "请先登录"
      });
    }

    const decoded =
      verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "登录已过期，请重新登录"
      });
    }

    const user =
      await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "用户不存在"
      });
    }

    const membership =
      checkMembership(user);

    if (!membership.allow) {
      return res.status(403).json({
        success: false,
        message: membership.message
      });
    }

    const product =
      String(
        req.body?.product || ""
      ).trim();

    const country =
      String(
        req.body?.country || ""
      ).trim();

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "请输入产品"
      });
    }

    if (!country) {
      return res.status(400).json({
        success: false,
        message: "请输入目标国家"
      });
    }

    console.log(
      `Product: ${product}`
    );

    console.log(
      `Country: ${country}`
    );

    /* =========================
       产品分析
    ========================= */

    let analysis = null;

    try {

      analysis =
        await analyzeProduct(
          product,
          country
        );

    } catch (error) {

      console.error(
        "Product analysis failed:",
        error.message
      );

      analysis = {
        product,
        country
      };
    }

    /* =========================
       Tavily 搜索
    ========================= */

    console.log(
      "Searching real buyer companies..."
    );

    let searchResults =
      await searchCompanies(
        product,
        country
      );

    console.log(
      `Search candidates: ${searchResults.length}`
    );

    /* =========================
       邮箱 + 评分 + 开发信
    ========================= */

    const customers = [];

    for (
      const company of searchResults
    ) {

      try {

        console.log(
          "Processing:",
          company.company,
          company.website
        );

        let contact = null;

        try {

          contact =
            await findContact(
              company.website
            );

        } catch (error) {

          console.error(
            "Email finder failed:",
            error.message
          );

          contact = {
            email: "",
            source: ""
          };
        }

        const email =
          contact?.email || "";

        const emailSource =
          contact?.source || "";

        const enriched = {
          ...company,
          email,
          emailSource
        };

        const score =
          scoreCompany(enriched);

        /*
         * V3.5 最低质量门槛
         *
         * 低于 50 分不展示。
         */

        if (score < 50) {
          console.log(
            "Rejected low quality:",
            company.company,
            score
          );

          continue;
        }

        let outreach = null;

        try {

          outreach =
            generateEmail(
              product,
              enriched
            );

        } catch (error) {

          console.error(
            "Email generation failed:",
            error.message
          );

          outreach = {
            subject:
              `${product} Supply Opportunity`,
            body:
              `Dear Purchasing Team,

We are a China-based manufacturer specializing in ${product}.

If you are currently sourcing this category, I would be happy to send you our product information and quotation.

Best regards,
Sales Team`
          };
        }

        const customer = {
          ...enriched,
          score,
          outreach
        };

        /* =========================
           CRM
        ========================= */

        try {

          await addCustomer(
            user.id,
            customer
          );

        } catch (error) {

          console.error(
            "CRM save failed:",
            error.message
          );
        }

        customers.push(customer);

      } catch (error) {

        console.error(
          "Customer processing error:",
          error.message
        );
      }
    }

    /* =========================
       最终排序
    ========================= */

    customers.sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0)
    );

    /*
     * 最终最多返回20个
     */
    const finalCustomers =
      customers.slice(0, 20);

    /* =========================
       剩余次数
    ========================= */

    let remaining = null;

    if (user.vip === "pro") {

      remaining =
        membership.limit;

    } else {

      remaining =
        Math.max(
          0,
          Number(user.searchCount || 3) - 1
        );
    }

    console.log(
      `Final real buyers: ${finalCustomers.length}`
    );

    console.log(
      "================================="
    );

    res.json({
      success: true,
      version: "3.5.0",
      analysis,
      customers: finalCustomers,
      count: finalCustomers.length,
      remaining
    });

  } catch (error) {

    console.error(
      "Find leads error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error?.message ||
        "客户搜索失败"
    });
  }
});

/* =========================
   404
========================= */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API不存在"
  });

});

/* =========================
   Start
========================= */

app.listen(
  PORT,
  () => {

    console.log(
      `AI Export Lead Finder V3.5 running on port ${PORT}`
    );

  }
);
