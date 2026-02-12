# VJ Display - Windows 使用指南

## 🚀 快速开始

### 方式一：双击启动（推荐）

#### 开发模式（推荐新手）
双击 `开发模式启动.bat` 文件
- ✅ 自动安装依赖
- ✅ 支持热重载（修改代码自动刷新）
- ✅ 适合开发和测试

#### 生产模式（性能更好）
双击 `启动服务器.bat` 文件
- ✅ 自动安装依赖
- ✅ 自动构建项目
- ✅ 性能优化
- ✅ 适合日常使用

### 方式二：命令行启动

打开 PowerShell 或 CMD，进入项目目录：

```bash
cd d:\vj-project\vj-disp-fe
```

#### 开发模式
```bash
npm run dev
```

#### 生产模式
```bash
npm run build
npm run start
```

## 🌐 使用方法

启动成功后，在浏览器中打开：

```
http://localhost:3000
```

### 局域网访问

如果想让同一网络的其他设备访问，找到终端输出中的 Network 地址，例如：

```
- Local:   http://localhost:3000
- Network: http://192.168.1.100:3000
```

其他设备可以通过 Network 地址访问。

## ⚙️ 端口被占用？

如果 3000 端口被占用，可以指定其他端口：

### 开发模式
```bash
npm run dev -- -p 3001
```

### 生产模式
编辑 `package.json`，修改 start 脚本：
```json
"start": "next start -p 3001"
```

## 🛑 停止服务器

在命令行窗口按 `Ctrl + C`，然后按 `Y` 确认。

## 📁 文件说明

- `启动服务器.bat` - 生产模式启动脚本
- `开发模式启动.bat` - 开发模式启动脚本
- `public/template/` - 风格模板图片文件夹
- `public/music/` - 音乐文件夹

## ⚠️ 注意事项

1. **首次运行**会自动安装依赖，需要等待几分钟
2. **需要联网**才能安装依赖
3. **不要关闭命令行窗口**，关闭会停止服务器
4. 使用完毕后记得停止服务器（Ctrl+C）

## 🔧 故障排除

### 依赖安装失败
手动安装：
```bash
npm install
```

### 构建失败
清除缓存重新构建：
```bash
rmdir /s /q .next
npm run build
```

### 端口被占用
更换端口或关闭占用 3000 端口的程序：
```bash
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F
```

## 📞 需要帮助？

如果遇到问题，请检查命令行窗口的错误信息。
