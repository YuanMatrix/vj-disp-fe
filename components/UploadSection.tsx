'use client';

import { Upload } from 'lucide-react';
import MusicPlayer from './MusicPlayer';

export default function UploadSection() {
  const demoSongs = [
    { id: 1, title: '歌曲名称...', artist: '歌手...', cover: '/images/demo-cover.jpg' },
    { id: 2, title: '歌曲名称...', artist: '歌手...', cover: '/images/demo-cover.jpg' },
    { id: 3, title: '歌曲名称...', artist: '歌手...', cover: '/images/demo-cover.jpg' },
    { id: 4, title: '歌曲名称...', artist: '歌手...', cover: '/images/demo-cover.jpg' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-80px)] overflow-x-hidden" style={{ padding: '142px 80px 80px 160px' }}>
      {/* 标题区域 */}
      <div className="mb-10 lg:mb-14">
        <h1
          className="text-white font-bold text-2xl lg:text-[32px] leading-tight lg:leading-[48px] mb-2"
          style={{ fontFamily: 'Source Han Sans CN, sans-serif' }}
        >
          选择您的音乐
        </h1>
        <p
          className="font-medium text-lg lg:text-2xl leading-normal lg:leading-9"
          style={{ 
            fontFamily: 'Source Han Sans CN, sans-serif',
            color: '#929292',
          }}
        >
          上传您的音乐至创作平台
        </p>
      </div>

      {/* 上传按钮 */}
      <div className="mb-16 lg:mb-20 flex justify-center">
        <button className="relative group w-full max-w-[418px]">
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
            className="relative flex items-center justify-center gap-2 h-[80px] lg:h-[102px] rounded-3xl hover:scale-105 active:scale-95 transition-transform"
          >
            {/* 图标背景 */}
            <div 
              className="flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9 bg-white rounded-md"
            >
              <Upload className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
            </div>
            
            {/* 文字 */}
            <span
              className="text-white font-bold text-xl lg:text-[32px]"
              style={{ fontFamily: 'Source Han Sans CN, sans-serif' }}
            >
              上传我的音乐
            </span>
          </div>
        </button>
      </div>

      {/* 示例音乐区域 */}
      <div className="flex-1">
        {/* 小标题 */}
        <div className="flex items-center gap-2 mb-5">
          <h2
            className="font-medium text-xl lg:text-2xl"
            style={{ 
              fontFamily: 'Source Han Sans CN, sans-serif',
              color: '#DAB2FF',
            }}
          >
            示例音乐
          </h2>
          
          {/* DEMO标签 */}
          <div 
            className="flex items-center justify-center px-3 py-1 rounded-full"
            style={{ 
              background: 'linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)',
            }}
          >
            <span
              className="text-white font-bold text-sm lg:text-base"
              style={{ fontFamily: 'Source Han Sans CN, sans-serif' }}
            >
              DEMO
            </span>
          </div>
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
