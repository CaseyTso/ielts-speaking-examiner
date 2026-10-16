# ielts-speaking-examiner

一个以 AI 模拟雅思考官为核心的口语练习产品。以网页应用形态交付，手机浏览器为第一目标平台，开源发布。

## Language

### 产品与角色

**Examiner（考官）**:
由 AI 扮演的雅思口语考官，按照雅思口语考试的真实流程（Part 1 日常问答、Part 2 个人陈述、Part 3 深入讨论）与用户进行语音对话。
_Avoid_: 老师（teacher）、教练（coach）、面试官（interviewer）——产品行为对标"考官"而非"教师"

**Practice Session（练习场次）**:
用户与考官完成的一次完整口语互动，可以是一场完整模拟考，也可以是针对单个 Part 的专项练习。
_Avoid_: 对话（conversation）、课程（lesson）、测试（test）

**Practice Report（练习报告）**:
一场练习结束后生成的 Markdown 文档，按照雅思官方四项标准（Fluency & Coherence / Lexical Resource / Grammatical Range & Accuracy / Pronunciation）对回答逐条评价、改正并给出进步建议。**不打分数**，报告的主体是可执行的反馈而非评分。可被保存、回看和导出。
_Avoid_: 成绩单（scorecard）、总结（summary）、评分（scoring）

### 技术概念

**Native Audio Assessment（原生音频评估）**:
考官直接基于用户的语音音频（而非文字转录）感知流利度、语调、发音问题的能力，由 Gemini Live API 的原生音频模型提供。
_Avoid_: 语音识别评分、语音分析

**Transcript（对话转录）**:
练习场次中双方对话的文字记录，由 Live API 的转录功能生成，是生成练习报告的主要依据。
_Avoid_: 字幕（subtitle）、聊天记录（chat log）

### 交付与运营

**Base（底座）**:
项目代码的起点：fork 自 Google 官方 multimodal-live-api-web-console 仓库，保留其音频连接层，产品功能在其上开发。
_Avoid_: 模板（template）、脚手架（scaffold）

**Project Name（项目名）**:
对外名称与仓库名固定为 `ielts-speaking-examiner`，与 Examiner 术语保持一致；不使用 coach / assistant / oral 等词。
_Avoid_: IELTS-coach, ielts-oral-assistant

**Deployment Target（部署目标）**:
产品部署在 Cloudflare Pages（纯静态托管），通过 wrangler 管理，无服务端组件。
_Avoid_: 服务器（server）、主机（host）

**BYOK（自带密钥）**:
产品不持有任何 Gemini API key；每位使用者（包括项目所有者本人）在页面设置中粘贴自己的 key，对话流量与额度归属使用者本人。
_Avoid_: 服务端密钥、共享密钥

**Exam Mode（考官模式）**:
严格按真实雅思口语考试流程进行的练习模式：考官不打断、不纠错，用户**不可求助**，各部分作答遵循真实考试的时长限制，全部结束后才生成练习报告。
_Avoid_: 正式模式、考试模式、模拟考模式

**Coach Mode（教练模式）**:
以即时反馈为核心的练习模式：作答**无时长限制**，用户可随时通过固定唤醒语向考官求助（询问自身表现、请求纠正），考官识别唤醒语后切换为教师角色回答，随后返回练习流程。
_Avoid_: 练习模式（practice mode，与 Practice Session 混淆）、学习模式

**Progress Digest（进步摘要）**:
一段跨场次的纯文本描述，每次练习结束后由模型对比最近报告更新，归纳用户反复出现的问题与有所改善的方面；同时注入后续练习的 system instruction，让考官记得用户的弱点。
_Avoid_: 学习曲线、水平报告

**Part Session（分段会话）**:
一场练习按 Part 切分为多个独立的 Live API 会话，每个 Part 独占一个会话；Part 衔接处通过向新会话注入前情摘要保持连续性。设计的直接原因是免费层单会话 15 分钟上限。
_Avoid_: 长会话、单会话
