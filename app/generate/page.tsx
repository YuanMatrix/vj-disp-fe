'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('video') || '/videos/demo1.mp4';
  const videoTitle = searchParams.get('title') || '画面展示';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 更新进度条
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(currentProgress || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 播放/暂停控制
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: '#121212' }}
    >
      {/* 导航栏 */}
      <Header />
      
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 - 使用flex布局 */}
      <div
        className="flex flex-col items-center"
        style={{
          marginLeft: '170px',
          marginTop: '80px',
          width: 'calc(100vw - 170px)',
          height: 'calc(100vh - 80px)',
          overflow: 'hidden',
          paddingTop: 'clamp(20px, 3vh, 40px)',
          paddingLeft: 'clamp(40px, 5vw, 100px)',
          paddingRight: 'clamp(40px, 5vw, 100px)',
          paddingBottom: 'clamp(30px, 4vh, 50px)',
        }}
      >
        {/* 标题 */}
        <h1
          className="shrink-0"
          style={{
            fontFamily: 'Source Han Sans CN, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(24px, 1.67vw, 32px)',
            lineHeight: '48px',
            color: '#FFFFFF',
            marginBottom: 'clamp(15px, 2vh, 30px)',
            width: '100%',
            maxWidth: '1238px',
          }}
        >
          {videoTitle}
        </h1>

        {/* 视频预览区域 - 自适应剩余空间 */}
        <div
          className="relative flex-1 min-h-0"
          style={{
            width: '100%',
            maxWidth: '1238px',
            marginBottom: 'clamp(10px, 1.5vh, 15px)',
          }}
        >
          {/* 视频播放器 */}
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              borderRadius: '12px 12px 0px 0px',
              background: '#000',
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              playsInline
            />
            {/* 播放按钮 - 未播放时显示 */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
              >
                <img
                  src="/icons/play.svg"
                  alt="播放"
                  style={{
                    width: 'clamp(60px, 5vw, 100px)',
                    height: 'auto',
                  }}
                />
              </button>
            )}
            {/* 点击视频区域暂停 */}
            {isPlaying && (
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={togglePlay}
              />
            )}
          </div>
        </div>

        {/* 进度条 */}
        <div
          className="relative shrink-0"
          style={{
            width: '100%',
            maxWidth: '1238px',
            height: 'clamp(10px, 1.2vh, 14px)',
            marginBottom: 'clamp(15px, 2vh, 25px)',
          }}
        >
          {/* 进度条背景 */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#766288',
              borderRadius: '20px',
            }}
          />
          {/* 进度条填充 */}
          <div
            className="absolute top-0 left-0"
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #AF46FD 0%, #F5339D 100%)',
              borderRadius: '20px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* 切换展演模式按钮 */}
        <div className="flex justify-end shrink-0" style={{ width: '100%', maxWidth: '1238px' }}>
          <button className="relative group" onClick={() => setIsFullscreen(true)}>
            {/* 按钮阴影层 */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)',
                boxShadow: '0px 10px 15px -3px rgba(173, 70, 255, 0.5), 0px 4px 6px -4px rgba(173, 70, 255, 0.5)',
                borderRadius: '24px',
              }}
            />
            
            {/* 按钮内容 */}
            <div
              className="relative flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              style={{
                width: 'clamp(150px, 12vw, 200px)',
                height: 'clamp(40px, 5vh, 50px)',
                borderRadius: '24px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Source Han Sans CN, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 1.4vw, 24px)',
                  lineHeight: '20px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                切换展演模式
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 全屏展演模式 */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={togglePlay}
        >
          <video
            src={videoUrl}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
          />
          {/* 退出全屏按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            className="absolute top-6 right-6 text-white hover:scale-110 transition-transform"
            style={{
              fontFamily: 'Source Han Sans CN, sans-serif',
              fontSize: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            退出全屏 (ESC)
          </button>
        </div>
      )}
    </div>
  );
}
