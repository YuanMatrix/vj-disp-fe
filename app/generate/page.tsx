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
        className="flex flex-col"
        style={{
          marginLeft: '170px',
          marginTop: '80px',
          width: 'calc(100vw - 170px)',
          height: 'calc(100vh - 80px)',
          overflow: 'hidden',
          paddingTop: 'clamp(60px, 9.43vh, 94.31px)',
          paddingLeft: 'clamp(80px, 8.07vw, 141.29px)',
          paddingRight: 'clamp(80px, 7.74vw, 135.51px)',
          paddingBottom: 'clamp(40px, 5vh, 50px)',
        }}
      >
        {/* 标题 */}
        <h1
          style={{
            fontFamily: 'Source Han Sans CN, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(24px, 1.67vw, 32px)',
            lineHeight: '48px',
            color: '#FFFFFF',
            marginBottom: 'clamp(40px, 6.85vh, 68.47px)',
          }}
        >
          {videoTitle}
        </h1>

        {/* 视频预览区域 */}
        <div
          className="relative"
          style={{
            width: 'min(70.77vw, 1238.51px)',
            height: 'min(59.44vh, 594.43px)',
            marginBottom: 'clamp(15px, 2.05vh, 20.48px)',
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
                    width: 'clamp(80px, 6.88vw, 132px)',
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
          className="relative"
          style={{
            width: 'min(70.77vw, 1238.51px)',
            height: 'clamp(15px, 2vh, 20px)',
            marginBottom: 'clamp(30px, 4.97vh, 49.65px)',
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
        <div className="flex justify-end">
          <button className="relative group">
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
                width: 'clamp(200px, 13.08vw, 251.2px)',
                height: 'clamp(45px, 5.79vh, 57.85px)',
                borderRadius: '24px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Source Han Sans CN, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(20px, 1.67vw, 32px)',
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
    </div>
  );
}
