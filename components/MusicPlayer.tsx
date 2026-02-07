'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Song {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string; // 音频文件路径
  videoUrl?: string; // 视频文件路径
}

interface MusicPlayerProps {
  song: Song;
}

export default function MusicPlayer({ song }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 默认音量设置为 100%
  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  // 处理双击跳转到片段选择页面
  const handleDoubleClick = () => {
    if (song.audioUrl) {
      // 从 audioUrl 提取文件名，如 /music/demo1.flac -> demo1.flac
      const fileName = song.audioUrl.split('/').pop() || '';
      const params = new URLSearchParams();
      params.set('file', fileName);
      params.set('title', song.title);
      if (song.videoUrl) {
        params.set('video', song.videoUrl);
      }
      router.push(`/select?${params.toString()}`);
    }
  };

  // 处理单击选中
  const handleClick = () => {
    setIsSelected(true);
  };

  // 设置音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 处理播放/暂停
  useEffect(() => {
    if (!audioRef.current || !song.audioUrl) return;

    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, song.audioUrl]);

  // 更新进度
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(currentProgress || 0);
  };

  // 加载音频元数据
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  // 点击进度条跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    const newTime = (newProgress / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(newProgress);
  };

  // 音频播放结束
  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div 
      className={`w-full max-w-[547px] h-[120px] bg-[#080808] rounded-xl p-[15px] flex items-center gap-4 relative cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-4 ring-[#F6339A]' : 'hover:ring-2 hover:ring-[#DAB2FF]'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover 提示 */}
      {isHovered && !isSelected && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-10 pointer-events-none"
        >
          <span 
            className="text-white font-bold"
            style={{
              fontFamily: 'Source Han Sans CN, sans-serif',
              fontSize: '16px',
            }}
          >
            双击进入片段选择
          </span>
        </div>
      )}
      {/* 歌曲封面 */}
      <div 
        className="w-[90px] h-[90px] bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 overflow-hidden relative"
      >
        {song.cover && song.cover !== '/images/demo-cover.jpg' ? (
          song.cover.includes('?') ? (
            // 使用普通 img 标签处理带查询参数的图片
            <img 
              src={song.cover} 
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            // 使用 Next.js Image 组件处理普通图片
            <Image 
              src={song.cover} 
              alt={song.title}
              fill
              className="object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
        )}
      </div>

      {/* 歌曲信息和播放控件 */}
      <div className="flex-1 flex flex-col justify-between h-[90px]">
        {/* 歌曲名 */}
        <div
          className="text-white text-base font-bold leading-[18px]"
          style={{ fontFamily: 'Source Han Sans CN, sans-serif' }}
        >
          {song.title}
        </div>

        {/* 播放控件和进度条 */}
        <div className="flex items-center gap-5">
          {/* 播放/暂停按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? (
              <Image 
                src="/icons/plause.svg" 
                alt="pause" 
                width={20}
                height={20}
              />
            ) : (
              <Image 
                src="/icons/play.svg" 
                alt="play" 
                width={20}
                height={20}
              />
            )}
          </button>

          {/* 进度条容器 */}
          <div 
            className="relative flex-1 cursor-pointer"
            onClick={handleProgressClick}
          >
            {/* 进度条背景 */}
            <div className="w-full h-[10px] bg-[#766288] rounded-[20px]" />
            
            {/* 进度条（已播放） */}
            <div
              className="absolute top-0 left-0 h-[10px] bg-[#DAB2FF] rounded-[20px] transition-all"
              style={{ width: `${progress}%` }}
            />
            
            {/* 拖拽按钮 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-[30px] h-[30px] bg-[#DAB2FF] rounded-full cursor-pointer hover:scale-110 transition-transform"
              style={{ left: `calc(${progress}% - 15px)` }}
            />
          </div>
        </div>

        {/* 歌手名 */}
        <div
          className="text-[#766288] text-base font-medium leading-6"
          style={{ fontFamily: 'Source Han Sans CN, sans-serif' }}
        >
          {song.artist}
        </div>
      </div>

      {/* 音频元素 */}
      {song.audioUrl && (
        <audio
          ref={audioRef}
          src={song.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}
    </div>
  );
}

