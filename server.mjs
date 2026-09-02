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

const PORT = process.env.PORT || 3000;


/* =========================
   首页
========================= */

app.get("/", (req, res) => {

  res.json({
    name: "AI外贸客户开发助手",
    version: "3.3.0",
    status: "running",
    searchEngine: "Tavily"
  });

});


/* =========================
   健康检查
========================= */

app.get("/health", (req, res) => {

  res.json({
    success: true,
    version: "3.3.0",
    status: "healthy",
    search: "Tavily Web Search"
  });

});


/* =========================
   注册
========================= */

app.post("/register", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message: "邮箱和密码不能为空"
      });

    }

    if (password.length < 6) {

      return res.status(400).json({
        success: false,
        message: "密码至少6位"
      });

    }

    const oldUser = await findUser(email);

    if (oldUser) {

      return res.status(400).json({
        success: false,
        message: "该邮箱已经注册"
      });

    }

    const passwordHash = await encryptPassword(password);

    const id = await createUser(
      email,
      passwordHash
    );

    const user = await getUserById(id);

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

    console.error("注册错误:", error);

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

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message: "邮箱和密码不能为空"
      });

    }

    const user = await findUser(email);

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "账号或密码错误"
      });

    }

    const ok = await comparePassword(
      password,
      user.password
    );

    if (!ok) {

      return res.status(401).json({
        success: false,
        message: "账号或密码错误"
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

    console.error("登录错误:", error);

    res.status(500).json({
      success: false,
      message: "登录失败"
    });

  }

});


/* =========================
   客户开发
========================= */

app.post("/find-leads", async (req, res) => {

  try {

    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    const decoded = verifyToken(token);

    if (!decoded) {

      return res.status(401).json({
        success: false,
        message: "请先登录"
      });

    }

    const user = await getUserById(decoded.id);

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "用户不存在"
      });

    }

    const membership = checkMembership(user);

    if (!membership.allow) {

      return res.status(403).json({
        success: false,
        message: membership.message
      });

    }

    const { product, country } = req.body;

    if (!product || !country) {

      return res.status(400).json({
        success: false,
        message: "请输入产品和目标国家"
      });

    }


    /* =========================
       1. 产品分析
    ========================= */

    let analysis;

    try {

      analysis = await analyzeProduct(
        product,
        country
      );

    } catch {

      analysis = {
        product,
        country,
        keywords: [
          product,
          `${product} buyer`,
          `${product} importer`,
          `${product} distributor`
        ]
      };

    }


    /* =========================
       2. 搜索海外公司
    ========================= */

    const companies = await searchCompanies(
      product,
      country
    );


    /* =========================
       3. 公司评分
    ========================= */

    const customers = [];

    for (const company of companies) {

      try {

        const companyScore =
          await scoreCompany(company);

        company.score = Math.max(
          company.score || 0,
          companyScore || 0
        );

      } catch {

        // 保留搜索引擎评分
      }


      /* =========================
         4. 查找公开邮箱
      ========================= */

      try {

        const contact = await findContact(
          company.website
        );

        if (contact && contact.email) {
          company.email = contact.email;
        }

      } catch {

        company.email = "";
      }


      /* =========================
         5. 生成开发信
      ========================= */

      try {

        company.emailText =
          await generateEmail(
            product,
            company
          );

      } catch {

        company.emailText = "";

      }


      customers.push(company);

    }


    /* =========================
       6. CRM 自动保存
    ========================= */

    for (const customer of customers) {

      try {

        await addCustomer(
          user.id,
          customer
        );

      } catch (error) {

        console.error(
          "CRM保存失败:",
          error.message
        );

      }

    }


    /* =========================
       7. 返回
    ========================= */

    res.json({

      success: true,

      version: "3.3.0",

      searchEngine: "Tavily",

      analysis,

      customers,

      count: customers.length,

      remaining:
        user.vip === "pro"
          ? "unlimited"
          : user.searchCount

    });

  } catch (error) {

    console.error(
      "客户开发错误:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
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

    message: "接口不存在"

  });

});


/* =========================
   启动
========================= */

app.listen(PORT, () => {

  console.log(
    `AI外贸客户开发助手 V3.3 已启动: ${PORT}`
  );

});
