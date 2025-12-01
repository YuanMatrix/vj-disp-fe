'use client';

import Image from 'next/image';
import MusicPlayer from './MusicPlayer';

export default function UploadSection() {
  const demoSongs = [
    { id: 1, title: '一步之遥', artist: 'Thomas Newman', cover: '/images/music1.svg' },
    { id: 2, title: '歌曲名称...', artist: '歌手...', cover: '/images/demo-cover.jpg' },
    { id: 3, title: '歌曲名称...', artist: '歌手...', cover: '/images/demo-cover.jpg' },
    { id: 4, title: '歌曲名称...', artist: '歌手...', cover: '/images/demo-cover.jpg' },
  ];

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
              上传我的音乐
            </span>
          </div>
        </button>
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
