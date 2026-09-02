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
  findUser
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
  scoreCompany
} from "./modules/scoring.js";

import {
  findContact
} from "./modules/emailFinder.js";

import {
  generateEmail
} from "./modules/emailWriter.js";

import {
  addCustomer
} from "./modules/crm.js";

import {
  exportLeads
} from "./modules/exportExcel.js";

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   首页
========================= */

app.get("/", (req, res) => {

  res.send(`
    <h1>AI外贸客户开发助手 V3.3</h1>
    <p>AI联网获客系统运行中</p>
  `);

});

/* =========================
   Health
========================= */

app.get("/health", (req, res) => {

  res.json({
    status: "ok",
    version: "3.3.0",
    search: "OpenAI Web Search",
    time: new Date().toISOString()
  });

});

/* =========================
   注册
========================= */

app.post("/register", async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {

    return res.json({
      success: false,
      message: "请输入邮箱和密码"
    });

  }

  if (password.length < 6) {

    return res.json({
      success: false,
      message: "密码至少6位"
    });

  }

  try {

    const hash = await encryptPassword(password);

    const id = await createUser(email, hash);

    res.json({
      success: true,
      id
    });

  } catch (error) {

    console.error(error);

    res.json({
      success: false,
      message: "注册失败，邮箱可能已存在"
    });

  }

});

/* =========================
   登录
========================= */

app.post("/login", async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {

    return res.json({
      success: false,
      message: "请输入邮箱和密码"
    });

  }

  const user = await findUser(email);

  if (!user) {

    return res.json({
      success: false,
      message: "用户不存在"
    });

  }

  const ok = await comparePassword(
    password,
    user.password
  );

  if (!ok) {

    return res.json({
      success: false,
      message: "密码错误"
    });

  }

  const token = createToken(user);

  res.json({

    success: true,

    token,

    user: {
      email: user.email,
      vip: user.vip
    }

  });

});

/* =========================
   AI外贸客户开发
========================= */

app.post("/find-leads", async (req, res) => {

  const {
    token,
    product,
    country
  } = req.body;

  /* ---------- 参数检查 ---------- */

  if (!token) {

    return res.json({
      success: false,
      message: "请先登录"
    });

  }

  if (!product || !country) {

    return res.json({
      success: false,
      message: "请输入产品和目标国家"
    });

  }

  /* ---------- Token ---------- */

  const user = verifyToken(token);

  if (!user) {

    return res.json({
      success: false,
      message: "登录已过期，请重新登录"
    });

  }

  /* ---------- 权限 ---------- */

  const permission = checkMembership(user);

  if (!permission.allow) {

    return res.json(permission);

  }

  try {

    console.log("");
    console.log("=================================");
    console.log("V3.3 开始客户开发");
    console.log("产品:", product);
    console.log("国家:", country);
    console.log("=================================");

    /* ---------- 产品分析 ---------- */

    const analysis = analyzeProduct(
      product,
      country
    );

    /* ---------- AI联网寻找买家 ---------- */

    const companies = await searchCompanies(
      product,
      country
    );

    /* ---------- 没找到 ---------- */

    if (!companies.length) {

      return res.json({

        success: true,

        version: "V3.3",

        analysis,

        customers: [],

        message:
          "本次没有找到足够可靠的潜在买家，请更换产品关键词或目标国家后重试。",

        remaining: permission.limit - 1

      });

    }

    /* ---------- 客户处理 ---------- */

    const customers = [];

    for (const company of companies) {

      let scoreData;

      try {

        scoreData = scoreCompany(company);

      } catch (error) {

        scoreData = {
          level: "B",
          score: company.score || 60,
          reason: company.description || ""
        };

      }

      /*
       * 注意：
       * 这里不再无条件生成 purchase@example.com
       */

      let contact = {};

      try {

        contact = await findContact(
          company,
          country
        );

      } catch (error) {

        contact = {
          contactPerson: "",
          email: "",
          salesEmail: "",
          linkedin: "",
          country
        };

      }

      let emailTemplate = "";

      try {

        emailTemplate = generateEmail(
          product,
          country,
          company.company
        );

      } catch (error) {

        emailTemplate = "";
      }

      const customer = {

        company: company.company,

        country: company.country,

        website: company.website,

        industry: company.industry,

        buyer_type: company.buyer_type,

        score: scoreData.level,

        scoreNumber:
          Number(scoreData.score || company.score || 0),

        reason:
          scoreData.reason ||
          company.description,

        evidence:
          company.evidence,

        contactPerson:
          contact.contactPerson || "",

        email:
          contact.email || "",

        salesEmail:
          contact.salesEmail || "",

        linkedin:
          contact.linkedin || "",

        contactHint:
          company.contact_hint || "",

        emailTemplate,

        source:
          company.source,

        status:
          "未联系"

      };

      try {

        await addCustomer(customer);

      } catch (error) {

        console.error(
          "CRM保存失败:",
          error.message
        );

      }

      customers.push(customer);

    }

    /* ---------- 导出 ---------- */

    let excel = null;

    try {

      excel = exportLeads(customers);

    } catch (error) {

      console.error(
        "Excel导出失败:",
        error.message
      );

    }

    /* ---------- 返回 ---------- */

    res.json({

      success: true,

      version: "V3.3",

      analysis,

      customers,

      excel,

      count: customers.length,

      remaining:
        Math.max(0, permission.limit - 1)

    });

  } catch (error) {

    console.error(
      "V3.3客户开发错误:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
        "客户开发失败"

    });

  }

});

/* =========================
   404
========================= */

app.use((req, res) => {

  res.status(404).json({

    success: false,

    message: "接口不存在"

  });

});

/* =========================
   启动
========================= */

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("");
  console.log("=================================");
  console.log("AI外贸客户开发助手 V3.3");
  console.log("Server running on port:", PORT);
  console.log("Search Engine: OpenAI Web Search");
  console.log("=================================");

});
