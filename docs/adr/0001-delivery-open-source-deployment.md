# 交付与开源形态：GitHub 公开仓库 + AGPL-3.0 + Cloudflare 部署

产品完成后推送到用户的 GitHub 公开仓库，以 AGPL-3.0 协议开源，部署目标为 Cloudflare（通过 wrangler 管理）。三条约束是绑定的：AGPL 的 copyleft 条款意味着任何基于本代码提供网络服务的衍生产品都必须开源，这与"公开仓库 + 个人自部署"的形态一致。

后果：代码中的 API key、密码等私密信息一律不进仓库——开发环境用本地 `.env`（gitignore），生产环境用 Cloudflare secrets（wrangler secret）。仓库必须是"任何人 clone 下来填自己的 key 就能跑"的形态。

