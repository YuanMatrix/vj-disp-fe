'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoUrl = searchParams.get('video') || '/videos/demo1.mp4';
  const videoTitle = searchParams.get('title') || '画面展示';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const syncTimeRef = useRef(0); // 用于在展演模式和普通模式之间同步时间

  // 更新进度条 - 主视频
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(currentProgress || 0);
      syncTimeRef.current = video.currentTime;
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      syncTimeRef.current = 0;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 更新进度条 - 展演模式视频
  useEffect(() => {
    const video = fullscreenVideoRef.current;
    if (!video || !isFullscreen) return;

    const handleTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(currentProgress || 0);
      syncTimeRef.current = video.currentTime;
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      syncTimeRef.current = 0;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isFullscreen]);

  // 播放/暂停控制
  const togglePlay = () => {
    const video = isFullscreen ? fullscreenVideoRef.current : videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 进入展演模式时同步进度
  const enterFullscreen = () => {
    const mainVideo = videoRef.current;
    if (mainVideo) {
      // 暂停主视频
      mainVideo.pause();
      setIsPlaying(false);
      // 记录当前时间
      syncTimeRef.current = mainVideo.currentTime;
    }
    setIsFullscreen(true);
  };

  // 退出展演模式时同步进度回主视频
  const exitFullscreen = () => {
    const fullscreenVideo = fullscreenVideoRef.current;
    const mainVideo = videoRef.current;
    
    if (fullscreenVideo && mainVideo) {
      // 同步时间到主视频
      mainVideo.currentTime = fullscreenVideo.currentTime;
      syncTimeRef.current = fullscreenVideo.currentTime;
    }
    setIsFullscreen(false);
    setIsPlaying(false);
  };

  // 展演模式视频加载后设置初始时间并播放
  useEffect(() => {
    const video = fullscreenVideoRef.current;
    if (!video || !isFullscreen) return;

    const handleCanPlay = () => {
      video.currentTime = syncTimeRef.current;
      video.play();
      setIsPlaying(true);
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [isFullscreen]);

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
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

        {/* 按钮区域 */}
        <div className="flex justify-between items-center shrink-0" style={{ width: '100%', maxWidth: '1238px' }}>
          {/* 返回按钮 */}
          <button className="relative group" onClick={() => router.back()}>
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
                width: 'clamp(100px, 10vw, 150px)',
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
                返回
              </span>
            </div>
          </button>

          {/* 切换展演模式按钮 */}
          <button className="relative group" onClick={enterFullscreen}>
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
            ref={fullscreenVideoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
          />
          {/* 退出全屏按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              exitFullscreen();
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

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div style={{ color: '#FFFFFF' }}>加载中...</div>
      </div>
    }>
      <GeneratePageContent />
    </Suspense>
  );
}
