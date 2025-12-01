'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Song {
  id: number;
  title: string;
  artist: string;
  cover: string;
}

interface MusicPlayerProps {
  song: Song;
}

export default function MusicPlayer({ song }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(25);

  return (
    <div className="w-full max-w-[547px] h-[120px] bg-[#080808] rounded-xl p-[15px] flex items-center gap-4 relative">
      {/* 歌曲封面 */}
      <div className="w-[90px] h-[90px] bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 overflow-hidden relative">
        {song.cover && song.cover !== '/images/demo-cover.jpg' ? (
          <Image 
            src={song.cover} 
            alt={song.title}
            fill
            className="object-cover"
          />
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
            onClick={() => setIsPlaying(!isPlaying)}
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
          <div className="relative flex-1">
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
    </div>
  );
}

