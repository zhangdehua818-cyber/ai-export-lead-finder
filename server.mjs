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

const app =
  express();

app.use(cors());

app.use(
  express.json({
    limit: "1mb"
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

    res.json({

      name:
        "AI外贸客户开发助手",

      version:
        "3.4.0",

      status:
        "running",

      searchEngine:
        "Tavily",

      mode:
        "Real Buyer Filtering"

    });

  }
);


/* =========================
   健康检查
========================= */

app.get(
  "/health",
  (req, res) => {

    res.json({

      success: true,

      version:
        "3.4.0",

      status:
        "healthy",

      search:
        "Tavily Web Search",

      email:
        "Real Public Email Only",

      buyerFilter:
        "Enabled"

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

      const {
        email,
        password
      } = req.body;

      if (
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "邮箱和密码不能为空"

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

      const oldUser =
        await findUser(email);

      if (oldUser) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "该邮箱已经注册"

          });

      }

      const passwordHash =
        await encryptPassword(
          password
        );

      const id =
        await createUser(
          email,
          passwordHash
        );

      const user =
        await getUserById(id);

      const token =
        createToken(user);

      res.json({

        success: true,

        token,

        user: {

          id:
            user.id,

          email:
            user.email,

          vip:
            user.vip

        }

      });

    } catch (error) {

      console.error(
        "注册错误:",
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

      const {
        email,
        password
      } = req.body;

      if (
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "邮箱和密码不能为空"

          });

      }

      const user =
        await findUser(email);

      if (!user) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "账号或密码错误"

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
              "账号或密码错误"

          });

      }

      const token =
        createToken(user);

      res.json({

        success: true,

        token,

        user: {

          id:
            user.id,

          email:
            user.email,

          vip:
            user.vip

        }

      });

    } catch (error) {

      console.error(
        "登录错误:",
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
   找客户
========================= */

app.post(
  "/find-leads",
  async (req, res) => {

    try {

      /*
       * Token
       */

      const authHeader =
        req.headers.authorization ||
        "";

      const token =
        authHeader.startsWith(
          "Bearer "
        )
          ? authHeader.slice(7)
          : "";

      const decoded =
        verifyToken(token);

      if (!decoded) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "请先登录"

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


      /*
       * 会员检查
       */

      const membership =
        checkMembership(user);

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


      /*
       * 参数
       */

      const {
        product,
        country
      } = req.body;

      if (
        !product ||
        !country
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "请输入产品和目标国家"

          });

      }


      /*
       * 产品分析
       */

      let analysis;

      try {

        analysis =
          await analyzeProduct(
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

            `${product} distributor`,

            `${product} procurement`

          ]

        };

      }


      /*
       * Tavily真实搜索
       */

      let customers =
        await searchCompanies(
          product,
          country
        );


      /*
       * 查找真实公开邮箱
       */

      for (
        const customer of customers
      ) {

        try {

          const contact =
            await findContact(
              customer.website
            );

          if (
            contact &&
            contact.email
          ) {

            customer.email =
              contact.email;

            customer.emailSource =
              contact.source;

            customer.emailVerified =
              false;

          } else {

            customer.email =
              "";

            customer.emailSource =
              "";

            customer.emailVerified =
              false;

          }

        } catch {

          customer.email =
            "";

          customer.emailSource =
            "";

          customer.emailVerified =
            false;

        }


        /*
         * 最终评分
         */

        try {

          customer.score =
            await scoreCompany(
              customer
            );

        } catch {

          customer.score =
            Number(
              customer.score
            ) || 0;

        }


        /*
         * 开发信
         */

        try {

          customer.emailText =
            await generateEmail(
              product,
              customer
            );

        } catch {

          customer.emailText =
            "";

        }

      }


      /*
       * 最终排序
       */

      customers.sort(
        (a, b) =>
          Number(b.score || 0) -
          Number(a.score || 0)
      );


      /*
       * CRM
       */

      for (
        const customer of customers
      ) {

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


      /*
       * 返回
       */

      res.json({

        success: true,

        version:
          "3.4.0",

        searchEngine:
          "Tavily",

        buyerFilter:
          "enabled",

        fakeEmail:
          false,

        analysis,

        customers,

        count:
          customers.length,

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

      res
        .status(500)
        .json({

          success: false,

          message:
            error.message ||
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
          "接口不存在"

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
      `AI外贸客户开发助手 V3.4 已启动: ${PORT}`
    );

  }
);
