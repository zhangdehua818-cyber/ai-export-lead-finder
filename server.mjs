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

const app =
  express();

app.use(
  cors()
);

app.use(
  express.json({
    limit: "2mb"
  })
);

const PORT =
  process.env.PORT || 3000;

/* =========================
   首页
========================= */

app.get(
  "/",
  (req, res) => {

    res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI外贸客户开发助手 V3.6</title>
<style>
body{
  font-family:Arial,sans-serif;
  max-width:900px;
  margin:40px auto;
  padding:20px;
}
.box{
  border:1px solid #ddd;
  border-radius:14px;
  padding:24px;
}
</style>
</head>
<body>
<div class="box">
<h1>AI外贸客户开发助手 V3.6</h1>
<p>真实买家识别 · 二次企业核验 · 公开邮箱发现</p>
<p>API服务运行正常。</p>
</div>
</body>
</html>
    `);
  }
);

/* =========================
   Health
========================= */

app.get(
  "/health",
  (req, res) => {

    res.json({

      success: true,

      version:
        "3.6.0",

      status:
        "healthy",

      search:
        "Tavily Web Search",

      verification:
        "Two-Stage Website Verification",

      buyerFilter:
        "Real Buyer Verification",

      email:
        "Real Public Email Only"

    });
  }
);

/* =========================
   注册
========================= */

app.post(
  "/register",
  async (req, res) => {

    try {

      const email =
        String(
          req.body?.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body?.password || ""
        );

      if (
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "请输入邮箱和密码"
          });
      }

      if (
        password.length < 6
      ) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "密码至少6位"
          });
      }

      const exists =
        await findUser(
          email
        );

      if (exists) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "该邮箱已经注册"
          });
      }

      const hash =
        await encryptPassword(
          password
        );

      const userId =
        await createUser(
          email,
          hash
        );

      const user =
        await getUserById(
          userId
        );

      const token =
        createToken(
          user
        );

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

      console.error(
        "Register error:",
        error
      );

      res
        .status(500)
        .json({
          success: false,
          message:
            "注册失败"
        });
    }
  }
);

/* =========================
   登录
========================= */

app.post(
  "/login",
  async (req, res) => {

    try {

      const email =
        String(
          req.body?.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body?.password || ""
        );

      const user =
        await findUser(
          email
        );

      if (!user) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "邮箱或密码错误"
          });
      }

      const ok =
        await comparePassword(
          password,
          user.password
        );

      if (!ok) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "邮箱或密码错误"
          });
      }

      const token =
        createToken(
          user
        );

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

      console.error(
        "Login error:",
        error
      );

      res
        .status(500)
        .json({
          success: false,
          message:
            "登录失败"
        });
    }
  }
);

/* =========================
   Token
========================= */

function getToken(req) {

  const header =
    req.headers.authorization ||
    "";

  if (
    !header.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return header
    .substring(7)
    .trim();
}

/* =========================
   找客户
========================= */

app.post(
  "/find-leads",
  async (req, res) => {

    try {

      console.log(
        "========== V3.6 FIND LEADS =========="
      );

      const token =
        getToken(req);

      if (!token) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "请先登录"
          });
      }

      const decoded =
        verifyToken(
          token
        );

      if (!decoded) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "登录已过期，请重新登录"
          });
      }

      const user =
        await getUserById(
          decoded.id
        );

      if (!user) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "用户不存在"
          });
      }

      const membership =
        checkMembership(
          user
        );

      if (
        !membership.allow
      ) {

        return res
          .status(403)
          .json({
            success: false,
            message:
              membership.message
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

        return res
          .status(400)
          .json({
            success: false,
            message:
              "请输入产品"
          });
      }

      if (!country) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "请输入目标国家"
          });
      }

      console.log(
        "Product:",
        product
      );

      console.log(
        "Country:",
        country
      );

      /* =====================
         产品分析
      ===================== */

      let analysis;

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

      /* =====================
         搜索 + 二次核验
      ===================== */

      const candidates =
        await searchCompanies(
          product,
          country
        );

      console.log(
        "Verified candidates:",
        candidates.length
      );

      /* =====================
         邮箱 + 最终评分
      ===================== */

      const customers = [];

      for (
        const candidate
        of candidates
      ) {

        try {

          /*
           * 如果搜索阶段已经找到邮箱，
           * 先直接使用。
           */

          let email =
            candidate.email ||
            "";

          let emailSource =
            candidate.emailSource ||
            "";

          /*
           * 官网没有邮箱，
           * 再用 emailFinder 深挖。
           */

          if (
            !email &&
            candidate.website
          ) {

            try {

              const contact =
                await findContact(
                  candidate.website
                );

              if (
                contact?.email
              ) {

                email =
                  contact.email;

                emailSource =
                  contact.source ||
                  candidate.website;
              }

            } catch (error) {

              console.error(
                "Contact finder failed:",
                error.message
              );
            }
          }

          const enriched = {

            ...candidate,

            email,

            emailSource,

            /*
             * 防止 object 进入评分
             */
            company:
              typeof candidate.company ===
              "string"
                ? candidate.company
                : String(
                    candidate.company?.name ||
                    candidate.company?.title ||
                    ""
                  ),

            type:
              typeof candidate.type ===
              "string"
                ? candidate.type
                : "Potential Buyer",

            description:
              typeof candidate.description ===
              "string"
                ? candidate.description
                : ""

          };

          /*
           * 最终评分
           */

          const score =
            scoreCompany(
              enriched
            );

          /*
           * V3.6：
           * 低于55直接不要
           */

          if (
            score < 55
          ) {

            console.log(
              "Rejected:",
              enriched.company,
              score
            );

            continue;
          }

          /*
           * 生成开发信
           */

          let outreach;

          try {

            outreach =
              generateEmail(
                product,
                enriched
              );

          } catch (error) {

            console.error(
              "Email writer failed:",
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

          /*
           * 最终客户对象
           */

          const customer = {

            company:
              enriched.company,

            country,

            type:
              enriched.type,

            website:
              enriched.website,

            email,

            emailSource,

            score,

            verified:
              enriched.verified === true,

            verification:
              enriched.verification ||
              "企业官网已核验",

            description:
              enriched.description,

            source:
              enriched.source ||
              "Tavily",

            outreach

          };

          /*
           * CRM
           */

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

          customers.push(
            customer
          );

        } catch (error) {

          console.error(
            "Customer processing error:",
            error.message
          );

        }
      }

      /*
       * 最终排序
       */

      customers.sort(
        (a, b) =>
          Number(
            b.score || 0
          ) -
          Number(
            a.score || 0
          )
      );

      /*
       * 最终只给前15个
       */

      const finalCustomers =
        customers.slice(
          0,
          15
        );

      console.log(
        "FINAL CUSTOMERS:",
        finalCustomers.length
      );

      console.log(
        "======================================"
      );

      res.json({

        success: true,

        version:
          "3.6.0",

        analysis,

        customers:
          finalCustomers,

        count:
          finalCustomers.length,

        remaining:
          user.vip === "pro"
            ? membership.limit
            : Math.max(
                0,
                Number(
                  user.searchCount || 3
                ) - 1
              )

      });

    } catch (error) {

      console.error(
        "Find leads error:",
        error
      );

      res
        .status(500)
        .json({

          success: false,

          message:
            error?.message ||
            "客户搜索失败"

        });
    }
  }
);

/* =========================
   404
========================= */

app.use(
  (req, res) => {

    res
      .status(404)
      .json({
        success: false,
        message:
          "API不存在"
      });

  }
);

/* =========================
   启动
========================= */

app.listen(
  PORT,
  () => {

    console.log(
      `AI Export Lead Finder V3.6 running on port ${PORT}`
    );

  }
);
