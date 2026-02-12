# ComfyUI 集成配置说明

## 问题说明

如果在"作品"页面看到视频无法加载，显示本地文件路径（如 `C:\Users\...`），这是因为浏览器无法直接访问本地文件系统。

## 解决方案

### 1. 配置 ComfyUI 输出路径

编辑项目根目录的 `.env.local` 文件（如果没有则创建），添加：

```env
COMFYUI_OUTPUT_BASE=C:\Users\admin\Downloads\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\ComfyUI\output
```

**注意：** 请将路径修改为您实际的 ComfyUI 安装路径。

### 2. 重启服务器

修改 `.env.local` 后，必须重启服务器才能生效：

1. 在命令行窗口按 `Ctrl + C` 停止服务器
2. 重新运行 `npm run dev` 或双击启动脚本

### 3. 验证配置

重启后，视频 URL 应该变成：

```
http://localhost:3000/api/comfyui/output/vj/xxx.mp4
```

而不是：

```
C:\Users\...\output\vj\xxx.mp4
```

## 工作原理

1. **ComfyUI 生成视频**时，返回的是服务器本地的绝对路径
2. **前端代码**会自动将绝对路径转换为代理 API URL
3. **后端 API** (`/api/comfyui/output/[...path]`) 读取本地文件并返回给浏览器
4. **浏览器**通过 HTTP 访问视频，而不是直接访问文件系统

## 路径转换示例

### Unix/Linux/Mac 路径
```
输入: /Users/coco/ComfyUI/output/vj/video.mp4
输出: /api/comfyui/output/vj/video.mp4
```

### Windows 路径
```
输入: C:\Users\admin\Downloads\ComfyUI\output\vj\video.mp4
输出: /api/comfyui/output/vj/video.mp4
```

## 故障排除

### 视频仍然无法加载

1. **检查 `.env.local` 路径是否正确**
   - 路径必须指向 ComfyUI 的 `output` 目录
   - Windows 路径可以使用 `\` 或 `/`

2. **检查文件是否存在**
   - 打开 ComfyUI 的 output 目录
   - 确认视频文件确实存在

3. **查看浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Network 标签，看是否有 404 或 403 错误

4. **查看服务器日志**
   - 命令行窗口会显示文件访问日志
   - 查看是否有 "Serving file:" 的输出

### API 返回 404

检查环境变量是否生效：

```javascript
// 在浏览器控制台运行
fetch('/api/comfyui/output/vj/test.mp4')
  .then(r => console.log(r.status))
```

如果返回 404，可能是：
- 文件不存在
- 路径配置错误
- 服务器未重启

## 开发调试

在浏览器控制台可以使用以下命令调试：

```javascript
// 查看所有任务
window.debugTasks()

// 检查特定任务状态
window.checkTaskStatus("任务ID")
```

这些命令会显示任务的详细信息，包括视频 URL。
