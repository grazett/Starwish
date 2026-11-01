# 小裴的星愿谷

React、TypeScript 和 Vite 制作的生日冒险游戏。此副本保留完整剧情、关卡、换装、背包和浏览器存档，使用优化后的网页素材。

## 本地运行

安装 Node.js 22 与 pnpm 10，运行 `pnpm install`、`pnpm dev`。

## 发布

在 GitHub 仓库 Settings → Pages 中选择 GitHub Actions。推送到 main 后会自动构建并发布。

GitHub Pages 地址为 https://grazett.github.io/Starwish/ 。

其他静态托管平台使用 `pnpm run build`，发布目录为 `dist`，不设置 `GITHUB_PAGES`。

照片已按网页尺寸优化；背景保持尺寸及比例，人物和衣物保留透明度。原始高分辨率素材保存在本机项目，不包含在此发布副本中。

存档保存在每位玩家自己的浏览器中。使用不同网址、浏览器或设备不会同步存档。

音乐和字体来源见 public/audio/ 和 public/fonts/ 内的说明及许可证。
