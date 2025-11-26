# AIGC音乐创作平台

将您的音乐转变为VJ画面的沉浸式创作空间

## 🚀 技术栈

- **框架**: Next.js 16.0.4 (App Router)
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 4.x
- **图标**: Lucide React
- **部署**: Vercel (推荐)

## 📦 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
vj-disp/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── studio/            # 创作空间页面
│   ├── training/          # 风格训练页面
│   └── works/             # 我的作品页面
├── components/            # React 组件
│   ├── Header.tsx         # 顶部导航栏
│   └── Hero.tsx           # 首页主区域
├── public/                # 静态资源
│   └── images/            # 图片资源
└── package.json
```

## 🎨 主要功能

- ✅ **首页展示**: 精美的渐变效果和动画
- ✅ **响应式导航**: 支持多页面路由
- 🚧 **创作空间**: 开发中
- 🚧 **风格训练**: 开发中
- 🚧 **我的作品**: 开发中

## 🎯 页面路由

- `/` - 首页
- `/studio` - 创作空间
- `/training` - 风格训练
- `/works` - 我的作品

## 🛠️ 开发说明

### 自定义样式

项目使用 Tailwind CSS 4.x，自定义主题配置在 `app/globals.css` 中：

```css
--color-purple-light: #DAB2FF;
--color-gray-text: #99A1AF;
--gradient-primary: linear-gradient(90deg, #AD46FF 0%, #F6339A 100%);
```

### 添加新页面

在 `app/` 目录下创建新文件夹和 `page.tsx` 文件即可，Next.js 会自动处理路由。

### 组件开发

所有可复用组件放在 `components/` 目录下，使用 TypeScript 编写，确保类型安全。

## 📸 截图

![首页预览](public/images/hero-bg.jpg)

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

## 📝 License

MIT

---

**开发者**: AIGC团队  
**版本**: 0.1.0  
**更新日期**: 2025-11-26
