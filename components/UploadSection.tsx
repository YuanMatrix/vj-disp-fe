'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MusicPlayer from './MusicPlayer';

export default function UploadSection() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const demoSongs = [
    { 
      id: 1, 
      title: '彩云追月', 
      artist: '钢琴轻音乐', 
      cover: '/images/music1.png',
      audioUrl: '/api/music/demo1.flac',
      videoUrl: '/videos/demo1.mp4'
    },
    { id: 2, title: 'Remember', artist: 'Ólafur Arnalds', cover: '/images/music2.png?v=2', audioUrl: '/api/music/demo2.flac', videoUrl: '/videos/demo2.mp4' },
    { id: 3, title: '赛博空间', artist: 'cyberpunk', cover: '/images/music3.png', audioUrl: '/api/music/demo3.mp3', videoUrl: '/videos/demo3.mp4' },
    { id: 4, title: '动态空间', artist: 'dynamic', cover: '/images/music4.png?v=2', audioUrl: '/api/music/demo4.mp3', videoUrl: '/videos/demo4.mp4' },
  ];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件格式
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'flac' && fileExt !== 'mp3') {
      setUploadMessage('只支持 flac 和 mp3 格式');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setUploading(true);
    setUploadMessage('上传中...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadMessage(`上传成功：${result.fileName}`);
        // 清空文件选择
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 延迟跳转到选择片段页面
        setTimeout(() => {
          router.push(`/select?file=${encodeURIComponent(result.fileName)}`);
        }, 1000);
      } else {
        setUploadMessage(`上传失败：${result.error}`);
      }
    } catch (error) {
      console.error('上传错误:', error);
      setUploadMessage('上传失败，请重试');
    } finally {
      setUploading(false);
      // 3秒后清除消息
      setTimeout(() => setUploadMessage(''), 3000);
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col overflow-x-hidden" 
      style={{ 
        marginLeft: '170px',
        width: 'calc(100vw - 170px)',
        paddingTop: 'clamp(60px, 7.4vw, 142px)',
        paddingBottom: 'clamp(40px, 4.2vw, 80px)',
        paddingLeft: 'clamp(30px, 5.2vw, 99px)',
        paddingRight: 'clamp(30px, 4.2vw, 80px)',
      }}
    >
      {/* 标题区域 */}
      <div style={{ marginBottom: '99.69px' }}>
        <h1
          className="text-white font-bold"
          style={{ 
            fontFamily: 'Source Han Sans CN, sans-serif',
            fontSize: '32px',
            lineHeight: '48px',
            marginBottom: '8.27px',
          }}
        >
          选择您的音乐
        </h1>
        <p
          className="font-medium"
          style={{ 
            fontFamily: 'Source Han Sans CN, sans-serif',
            fontSize: '24px',
            lineHeight: '36px',
            color: '#929292',
          }}
        >
          上传您的音乐至创作平台
        </p>
      </div>

      {/* 上传按钮 */}
      <div className="mb-16 lg:mb-20 flex flex-col items-center gap-4">
        {/* 隐藏的文件输入框 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".flac,.mp3,audio/flac,audio/mpeg"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button 
          onClick={handleUploadClick}
          disabled={uploading}
          className="relative group w-full max-w-[418px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* 阴影层 */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)',
              boxShadow: '0px 10px 15px -3px rgba(173, 70, 255, 0.5), 0px 4px 6px -4px rgba(173, 70, 255, 0.5)',
            }}
          />
          
          {/* 按钮主体 */}
          <div
            className="relative flex items-center justify-center gap-2 h-[60px] lg:h-[103px] rounded-3xl hover:scale-105 active:scale-95 transition-transform"
          >
            {/* 图标 */}
            <Image 
              src="/icons/music-icon.svg" 
              alt="music" 
              width={36.36}
              height={36.36}
            />
            
            {/* 文字 */}
            <span
              className="text-white font-bold text-xl lg:text-[32px]"
              style={{ fontFamily: 'Source Han Sans CN, sans-serif' }}
            >
              {uploading ? '上传中...' : '上传我的音乐'}
            </span>
          </div>
        </button>

        {/* 上传状态消息 */}
        {uploadMessage && (
          <div 
            className="text-center font-medium text-lg"
            style={{ 
              fontFamily: 'Source Han Sans CN, sans-serif',
              color: uploadMessage.includes('成功') ? '#4ADE80' : uploadMessage.includes('失败') ? '#F87171' : '#DAB2FF'
            }}
          >
            {uploadMessage}
          </div>
        )}
      </div>

      {/* 示例音乐区域 */}
      <div className="flex-1">
        {/* 小标题容器 */}
        <div className="relative" style={{ width: '162.65px', height: '48.41px', marginBottom: '21.97px' }}>
          {/* DEMO标签 - 在顶部 */}
          <div 
            className="absolute flex items-center justify-center"
            style={{ 
              width: '64.7px',
              height: '24.78px',
              left: '97.91px',
              top: '0px',
              background: 'linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)',
              borderRadius: '24px',
            }}
          >
            <span
              className="text-white font-bold"
              style={{ 
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '16px',
                lineHeight: '20px',
              }}
            >
              DEMO
            </span>
          </div>
          
          {/* 示例音乐文字 - 在下方 */}
          <h2
            className="absolute font-medium"
            style={{ 
              fontFamily: 'Source Han Sans CN, sans-serif',
              fontSize: '24px',
              lineHeight: '36px',
              width: '96px',
              height: '36px',
              left: '0px',
              top: '12.41px',
              color: '#DAB2FF',
              whiteSpace: 'nowrap',
            }}
          >
            示例音乐
          </h2>
        </div>

        {/* 音乐列表 - 响应式网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-x-9 lg:gap-y-5">
          {demoSongs.map((song) => (
            <MusicPlayer key={song.id} song={song} />
          ))}
        </div>
      </div>
    </div>
  );
}
