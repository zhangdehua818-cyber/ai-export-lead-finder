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
app.use(express.json());

const PORT = process.env.PORT || 3000;

function getToken(req) {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return "";
  }

  return auth.substring(7);
}

function getUserFromRequest(req) {
  const token = getToken(req);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "AI外贸客户开发助手",
    version: "3.5.0",
    message: "精准买家筛选引擎运行中"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    version: "3.5.0",
    status: "healthy",
    search: "Tavily Web Search",
    engine: "Precision Buyer Filtering"
  });
});

app.post("/register", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");

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

    const existing = await findUser(email);

    if (existing) {
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

app.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");

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

app.post("/find-leads", async (req, res) => {
  try {
    const authUser = getUserFromRequest(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: "请先登录"
      });
    }

    const user = await getUserById(authUser.id);

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
        message: membership.message || "暂无搜索权限"
      });
    }

    const product = String(
      req.body.product || ""
    ).trim();

    const country = String(
      req.body.country || ""
    ).trim();

    if (!product || !country) {
      return res.status(400).json({
        success: false,
        message: "请输入产品和目标国家"
      });
    }

    console.log(
      `V3.5 search: ${product} / ${country}`
    );

    // 1. 产品分析
    let analysis = null;

    try {
      analysis = await analyzeProduct(
        product,
        country
      );
    } catch (error) {
      console.error(
        "Product analysis error:",
        error.message
      );

      analysis = {
        product,
        country
      };
    }

    // 2. 搜索真实企业
    const companies = await searchCompanies(
      product,
      country
    );

    console.log(
      `V3.5 filtered companies: ${companies.length}`
    );

    const customers = [];

    // 3. 只对通过精准筛选的企业找邮箱
    for (const company of companies) {
      try {
        let contact = {
          email: "",
          source: ""
        };

        try {
          contact = await findContact(
            company.website
          );
        } catch (error) {
          console.error(
            "Email finder error:",
            error.message
          );
        }

        const email =
          contact &&
          typeof contact === "object"
            ? String(contact.email || "")
            : "";

        const emailSource =
          contact &&
          typeof contact === "object"
            ? String(contact.source || "")
            : "";

        const customer = {
          ...company,

          email,
          emailSource,

          verified:
            company.websiteVerified === true,

          score: 0,

          outreachEmail: ""
        };

        // 4. 最终评分
        customer.score = scoreCompany(
          customer
        );

        // 5. 生成开发邮件
        customer.outreachEmail =
          generateEmail(
            product,
            country,
            customer
          );

        // 最低最终分数
        if (customer.score < 50) {
          continue;
        }

        // 6. 保存 CRM
        try {
          await addCustomer(
            user.id,
            customer
          );
        } catch (error) {
          console.error(
            "CRM save error:",
            error.message
          );
        }

        customers.push(customer);
      } catch (error) {
        console.error(
          "Lead processing error:",
          error.message
        );
      }
    }

    customers.sort(
      (a, b) => b.score - a.score
    );

    const finalCustomers =
      customers.slice(0, 15);

    res.json({
      success: true,

      version: "3.5.0",

      product,

      country,

      analysis,

      customers: finalCustomers,

      count: finalCustomers.length,

      remaining:
        membership.limit,

      engine: {
        name: "Precision Buyer Filtering",
        verifiedWebsite: true,
        productRelevance: true,
        supplierFiltering: true,
        directoryFiltering: true,
        logisticsFiltering: true
      }
    });
  } catch (error) {
    console.error(
      "Find leads error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "客户搜索失败，请稍后重试"
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "接口不存在"
  });
});

app.listen(PORT, () => {
  console.log(
    `AI Export Lead Finder V3.5 running on port ${PORT}`
  );
});
