'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { worksData, Work } from '@/data/works';

export default function WorksPage() {
  const router = useRouter();
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  
  const visibleCount = 4; // 每行显示4个
  const rowCount = 2; // 显示2行
  const totalVisible = visibleCount * rowCount;
  const maxStartIndex = Math.max(0, worksData.length - totalVisible);

  const handlePrev = () => {
    setStartIndex(Math.max(0, startIndex - visibleCount));
  };

  const handleNext = () => {
    setStartIndex(Math.min(maxStartIndex, startIndex + visibleCount));
  };

  // 双击进入播放页面
  const handleDoubleClick = (work: Work) => {
    const url = `/generate?video=${encodeURIComponent(work.videoUrl)}&title=${encodeURIComponent(work.title)}`;
    router.push(url);
  };

  const visibleWorks = worksData.slice(startIndex, startIndex + totalVisible);

  return (
    <main className="h-screen bg-[#121212] overflow-hidden">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧空白区域（与Sidebar同宽但不显示内容） */}
        <div 
          className="shrink-0"
          style={{ width: '170px' }}
        />
        
        {/* 主内容区域 */}
        <div 
          className="flex-1 flex flex-col overflow-hidden relative" 
          style={{ 
            width: 'calc(100vw - 170px)',
            padding: '30px 80px',
          }}
        >
          {/* 标题区域 */}
          <div className="shrink-0" style={{ marginBottom: '20px' }}>
            <h1
              className="text-white font-bold"
              style={{ 
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: 'clamp(24px, 2vw, 32px)',
                lineHeight: '1.4',
                marginBottom: '6px',
              }}
            >
              我的作品
            </h1>
            <p
              className="font-medium"
              style={{ 
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: 'clamp(14px, 1.2vw, 18px)',
                lineHeight: '1.4',
                color: '#929292',
              }}
            >
              左右可切换查看更多作品
            </p>
          </div>

          {/* 作品展示区域 */}
          <div className="relative flex items-center flex-1 min-h-0">
            {/* 左箭头 */}
            <button
              onClick={handlePrev}
              disabled={startIndex === 0}
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-[rgba(218,178,255,0.15)] transition-colors absolute z-10"
              style={{
                border: '2px solid #DAB2FF',
                left: '-50px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <ChevronLeft className="w-5 h-5 text-[#DAB2FF]" />
            </button>

            {/* 作品卡片网格 - 使用 grid 布局实现正方形 */}
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                height: '100%',
                aspectRatio: '2 / 1', // 4列2行，每个格子正方形
                maxHeight: '100%',
              }}
            >
              {visibleWorks.map((work) => (
                <div
                  key={work.id}
                  onClick={() => setSelectedWork(work.id)}
                  onDoubleClick={() => handleDoubleClick(work)}
                  className={`cursor-pointer transition-all duration-200 relative ${
                    selectedWork === work.id ? 'ring-4 ring-[#F6339A]' : ''
                  }`}
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* 作品图片 */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${work.thumbnail})`,
                      backgroundColor: '#2a2a2a',
                    }}
                  />
                  
                  {/* 作品信息 - 底部悬浮 */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 py-2 px-3"
                    style={{ 
                      background: 'linear-gradient(180deg, rgba(50, 40, 60, 0.9) 0%, rgba(30, 25, 35, 0.95) 100%)',
                    }}
                  >
                    <h3
                      className="text-white font-bold text-center"
                      style={{
                        fontFamily: 'Source Han Sans CN, sans-serif',
                        fontSize: 'clamp(12px, 1vw, 16px)',
                        marginBottom: '4px',
                      }}
                    >
                      {work.style}
                    </h3>
                    <p
                      className="text-center"
                      style={{
                        fontFamily: 'Source Han Sans CN, sans-serif',
                        fontSize: 'clamp(10px, 0.8vw, 12px)',
                        color: '#929292',
                      }}
                    >
                      创建时间 {work.createdAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 右箭头 */}
            <button
              onClick={handleNext}
              disabled={startIndex >= maxStartIndex}
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-[rgba(218,178,255,0.15)] transition-colors absolute z-10"
              style={{
                border: '2px solid #DAB2FF',
                right: '-50px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <ChevronRight className="w-5 h-5 text-[#DAB2FF]" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

