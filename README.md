# IELTS Speaking Examiner (AI 雅思口语考官)

基于 Google Gemini Live API 与 Gemini 文本大模型的沉浸式、全双工 AI 雅思口语模考与诊断系统。

---

## 📖 项目简介

**IELTS Speaking Examiner** 是一款完全运行在浏览器端的 AI 雅思口语模考练习应用。通过 Gemini Live WebSocket 双向全双工音频流，模拟真实考官语音交流场景，完整还原官方雅思考试 Part 1、Part 2、Part 3 流程，并在考试结束后基于雅思官方四大评分维度生成结构化诊断报告。

系统严格采用 **BYOK (Bring Your Own Key)** 模式：无后端服务器、无中心化数据库，用户的 API Key 和练习数据全部保留在浏览器本地，直接与 Google 官方接口通信。

---

## ✨ 核心特性

- **完整雅思口语流程**：
  - **Part 1 (4-5 分钟)**：日常话题问答与热身。
  - **Part 2 (3-4 分钟)**：Candidate Task Card 题卡呈现，带 60 秒倒计时备考（麦克风自动静音）及 2 分钟个人长陈述。
  - **Part 3 (4-5 分钟)**：基于 Part 2 话题深度拓展的双向深入讨论。
- **全双工即时语音互动**：
  - 基于 Gemini Live API（WebSocket + 24kHz 16-bit PCM 音频流），实现毫秒级语音交互。
  - 支持自然打断（Examiner Interruption）与音量可视化。
- **专业诊断报告（绝对不打分原则）**：
  - 严格对照雅思官方四大维度进行定性分析：
    - **FC** (Fluency and Coherence, 流利度与连贯性)
    - **LR** (Lexical Resource, 词汇多样性与准确性)
    - **GRA** (Grammatical Range and Accuracy, 语法多样性与准确性)
    - **PR** (Pronunciation, 发音表现推断)
  - **绝对不给预估分数**：拒绝误导性的虚假 Band 分数，只给考生具体可执行的语言提升建议、好词好句提炼与语法纠错对照。
- **渐进式学习画像 (Progress Digest)**：
  - 每次模考生成的画像摘要自动持久化至本地，下一次模考时考官 Prompt 会吸收历史弱项，针对性强化考查。
- **移动端友好与抗节流**：
  - 基于 Wall-clock 绝对时间戳防后台节流机制，页面切后台倒计时不失真。
  - 优化 iOS Safari 音频上下文生命周期，杜绝静音与内存泄漏。

---

## 🔑 BYOK 密钥说明与免费获取

本项目不需要任何第三方账号或付费服务，用户只需提供自己的 Google Gemini API Key：

### 免费申请 Gemini API Key 步骤

1. 打开浏览器访问 Google 官方控制台：[Google AI Studio API Keys](https://aistudio.google.com/apikey)。
2. 使用你的 Google 账号登录。
3. 点击 **"Create API key"**（创建 API 密钥）。
4. 选择或新建一个 Google Cloud 项目并生成密钥。
5. 复制生成的 API Key。
6. 进入本应用，在设置页或首页将 Key 填入输入框保存即可。（数据仅保存在浏览器的 `localStorage` 中，绝不会上传给任何第三方）。

*注：Google AI Studio 提供的免费层额度足够覆盖个人考生的日常模考与诊断需求。*

---

## 🛠️ 本地开发与构建

### 前置条件
- Node.js >= 18.0.0
- npm / pnpm / yarn

### 安装与运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-username/IELTS-coach.git
cd IELTS-coach

# 2. 安装依赖
npm install

# 3. 启动本地开发服务
npm run dev

# 4. 构建生产代码
npm run build

# 5. 预览生产构建
npm run preview
```

### 验证脚本

在配置了本地或系统环境变量 `GEMINI_API_KEY` 的情况下，可运行自动化验证脚本：

```bash
# 验证报告生成与门禁检查
GEMINI_API_KEY="your-api-key" npm run verify:report

# 验证 Gemini Live WebSocket 连接层
GEMINI_API_KEY="your-api-key" npm run verify:live
```

---

## 🚀 部署指引

本项目为纯前端静态单页应用（SPA），支持部署至任何现代静态托管平台：

- **Cloudflare Pages**：连接 GitHub 仓库，构建命令设为 `npm run build`，输出目录设为 `dist`。
- **Vercel** / **Netlify**：导入项目，Framework Preset 选择 `Vite`，直接一键部署。
- **GitHub Pages**：使用 GitHub Actions 构建并发布 `dist` 目录。

> **网络说明**：由于前端直接连接 Google Gemini 接口（`generativelanguage.googleapis.com`），部署访问者所处网络环境需能正常连通 Google 官方 API 服务。

---

## 📄 开源许可证

本项目依据 **GNU Affero General Public License v3.0 (AGPL-3.0)** 协议开源。详细许可内容请参见 [LICENSE](LICENSE) 文件。
