import OpenAI from "openai";
import { AI_CONFIG } from "./apiConfig.js";

let client = null;

if (AI_CONFIG.apiKey) {
  client = new OpenAI({
    apiKey: AI_CONFIG.apiKey
  });
}

export async function webSearch(product, country) {

  if (!client) {
    throw new Error("OPENAI_API_KEY 未配置");
  }

  const prompt = `
你现在是一个专业的国际贸易客户开发系统。

任务：

根据下面的产品和目标国家，联网搜索真实存在的潜在B2B买家。

产品：
${product}

目标国家：
${country}

【非常重要】

我们寻找的是“买方”，不是卖方。

优先寻找：

1. 制造企业
2. 品牌商
3. OEM/ODM企业
4. 工业设备制造商
5. 批发商
6. 分销商
7. 进口商
8. 采购公司
9. 最终产品生产企业
10. 可能长期采购该产品的企业

严格排除：

1. 中国供应商
2. CNC加工厂
3. 同行业供应商
4. 产品制造商（如果它本身就是我们要开发的供应商类型）
5. Alibaba
6. Made-in-China
7. Global Sources
8. Europages等纯供应商目录
9. 纯贸易信息网站
10. 招聘网站
11. 新闻网站
12. 企业黄页中无法证明采购需求的页面

尤其注意：

不要因为一家公司的网页上出现了产品关键词，就直接认为它是买家。

必须尽可能判断：

“这家公司是否真的有可能采购中国供应商提供的这个产品？”

搜索目标：

找到真实公司官网，并尽量找到能够证明其业务与产品需求相关的证据。

每家公司返回：

- company
- country
- website
- industry
- buyer_type
- match_score
- why_fit
- evidence
- contact_hint

其中：

match_score 为0-100。

评分标准：

90-100：
高度匹配，有明确产品需求或采购逻辑。

75-89：
高度相关，有较明显采购可能。

60-74：
行业相关，但采购需求不够明确。

低于60：
不要返回。

contact_hint：
如果公开网页中发现采购、销售、商务、供应链等联系方式，可以写出来。
没有就写空字符串。

最终最多返回10家公司。

只返回JSON。

格式：

[
  {
    "company": "公司名称",
    "country": "国家",
    "website": "官网",
    "industry": "行业",
    "buyer_type": "买家类型",
    "match_score": 85,
    "why_fit": "为什么可能成为客户",
    "evidence": "证明其业务相关的网页信息",
    "contact_hint": "公开联系方式或职位"
  }
]

不要编造公司。
不要编造网址。
不要编造邮箱。
不要把搜索结果中的供应商冒充买家。
`;

  const response = await client.responses.create({
    model: AI_CONFIG.model,
    tools: [
      {
        type: "web_search"
      }
    ],
    input: prompt
  });

  const text = response.output_text || "";

  return parseJSON(text);
}

function parseJSON(text) {

  try {
    return JSON.parse(text);
  } catch (error) {}

  const match = text.match(/\[[\s\S]*\]/);

  if (!match) {
    console.error("AI返回内容无法解析：", text);
    return [];
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    console.error("JSON解析失败：", error.message);
    return [];
  }
}
