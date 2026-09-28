# AMO 提交记录与文案模板

本 fork 在 AMO 上以 **unlisted（自签名分发）** 方式发布，不进 AMO 搜索页。
每次发新版本时，可直接复用下面的文案。

## 已提交版本

| 版本 | AMO 文件 | 状态 | 备注 |
| --- | --- | --- | --- |
| 1.2.0 | `6d50b8d38b8040d6897c-1.2.0.xpi` | 已通过审核（已签名） | 首个火狐移植版，基于上游 v1.2.0 |

清单关键字段：`gecko.id = biliplus-firefox@aboluo12138.github.io`、
`strict_min_version = 140.0`（Android 142.0）、`data_collection_permissions.required = ["none"]`。

## 版本说明模板（zh-CN，AMO「版本说明」字段，支持 Markdown）

```
基于上游 BiliPlus v<上游版本> 的 Firefox 移植版。

变更内容：
- <本次改动>

使用提示：装好后请先在扩展的完整设置页点击「允许访问 B 站」，
再到弹窗打开总开关、并在设置页逐个开启想用的功能（默认全部关闭）。
```

1.2.0 实际填写内容：

```
首个 Firefox 移植版本，基于上游 BiliPlus v1.2.0。

变更内容：
- 后台由 Service Worker 改为事件页（background.scripts），适配火狐 MV3
- 新增 chrome.* → Promise 兼容层：修复火狐上 await chrome.storage.* 返回 undefined
- 修复火狐 WebIDL 校验导致的 requestAnimationFrame / getComputedStyle 报错
- 设置页新增「允许访问 B 站」一键授权入口（火狐不会在安装时自动授权站点）
- 打包时版本号自动与上游 manifest.json 同步
```

## 给审核员的备注模板（英文，审核者阅读）

```
Firefox port of the MIT-licensed project 0xlau/biliplus.
Source: https://github.com/aboluo12138/biliplus (archived commit is included in the
uploaded source archive).

Build: `node tools/build-firefox.cjs` (Node.js 20 or newer; only Node built-in
modules are used, so no `npm install` step and no third-party dependencies).
Requirements and step-by-step details: SOURCE_BUILD.md in the source archive.
Verification: `node tests/firefox-port.test.js`.

Third-party code: scripts/common/md5.min.js is a vendored minified build of
js-md5 v0.8.0 (MIT, https://github.com/emn178/js-md5) — unminified sources are
available there. img/icon-*.png are resized copies of the repository's logo.png.

Validator warnings: the five "Unsafe assignment to innerHTML/outerHTML" warnings
are three static HTML templates without interpolation, plus two places where the
values are already escaped or come from the same-origin bilibili API.

No data collection: data_collection_permissions.required = ["none"].
Testing without an account is possible for the core features; "AI video summary"
needs a bilibili login and can be skipped.
```

## 若以后要公开发布（listed）时的描述草稿

```markdown
### 说明（Firefox 版）
- 本扩展是 MIT 协议项目 [0xlau/biliplus](https://github.com/0xlau/biliplus) 的 Firefox 移植版，
  与上游 Chrome 版功能一致；源码：https://github.com/aboluo12138/biliplus
- **火狐不会在安装时自动授予站点权限**：装好后请在扩展的完整设置页点「允许访问 B 站」
  （或在 about:addons → 权限里开启），否则增强脚本不会注入。
- **功能默认全部关闭**：需要先在弹窗打开总开关，再到设置页逐个开启要用的功能。

### 功能
首页清爽模式 / 隐藏直播与广告卡片 / "换一换"历史 / 无缝变速 /
搜索净化 / 失效视频标题与封面恢复 / 封面 AI 总结（需登录）等。
```

分类建议：外观（Appearance）+ 其他；许可：MIT。

## 发新版本的流程

1. 合并上游：`git fetch upstream && git merge upstream/main`，`node tools/build-firefox.cjs` 校验
2. 确认 `manifest.json` 的版本号（打包时会自动同步进火狐包）
3. `git tag ff-v<版本> && git push origin ff-v<版本>`（或手动触发 workflow）
4. 到 AMO 开发者中心「上传新版本」，选 Release 里的 zip
5. 若配了 `AMO_JWT_ISSUER` / `AMO_JWT_SECRET` 两个 secret，第 3 步会自动签好并附到 Release，
   连第 4 步都省了
