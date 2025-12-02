# 音乐文件夹

## 📁 使用说明

将你的音乐文件（mp3, wav, ogg 等格式）放在这个文件夹中。

### 示例：

```
public/music/
  ├── song1.mp3
  ├── song2.mp3
  └── your-music.mp3
```

### 在代码中引用：

在 `components/UploadSection.tsx` 中添加歌曲信息：

```typescript
const demoSongs = [
  {
    id: 1,
    title: "歌曲名称",
    artist: "歌手名",
    cover: "/images/cover.jpg",
    audioUrl: "/music/song1.mp3", // 音频文件路径
  },
];
```

### 支持的音频格式：

- MP3
- WAV
- OGG
- M4A

### 注意事项：

1. 文件路径以 `/music/` 开头（不需要写 `public`）
2. 确保文件名不包含中文或特殊字符
3. 推荐使用 MP3 格式，兼容性最好
