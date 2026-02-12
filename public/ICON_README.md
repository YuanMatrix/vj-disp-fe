# 应用图标

为了使打包的桌面应用有合适的图标，请在此目录放置以下图标文件：

## 图标文件要求

### Windows
- 文件名: `icon.ico`
- 格式: ICO
- 推荐尺寸: 256x256 像素（可包含多个尺寸）
- 在线生成工具: https://www.icoconverter.com/

### macOS
- 文件名: `icon.icns`
- 格式: ICNS
- 推荐尺寸: 512x512 像素或 1024x1024 像素
- 在线生成工具: https://cloudconvert.com/png-to-icns

### Linux
- 文件名: `icon.png`
- 格式: PNG
- 推荐尺寸: 512x512 像素

## 快速生成图标

1. 准备一张 1024x1024 的 PNG 图片
2. 使用在线工具转换为各平台所需格式
3. 将生成的图标文件放在此目录

## 临时使用默认图标

如果暂时没有自定义图标，可以注释掉 `package.json` 中的图标配置，Electron 会使用默认图标。
