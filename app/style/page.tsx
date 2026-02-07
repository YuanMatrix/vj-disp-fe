'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TemplateStyle {
  name: string;
  imageCount: number;
  coverImage: string | null;
}

// Demo 歌曲到默认风格的映射
const demoStyleMap: Record<string, string> = {
  'demo1': '水墨风格',
  'demo2': '油画风格',
  'demo3': '赛博风格',
  'demo4': '喜：琥珀金+暖白',
};

function StylePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从 URL 获取歌曲信息
  const songTitle = searchParams.get('title') || '画面展示';
  const fileName = searchParams.get('file') || '';
  const videoUrl = searchParams.get('video') || '';
  const startTime = searchParams.get('start') || '0';
  const endTime = searchParams.get('end') || '30';
  
  const [styles, setStyles] = useState<TemplateStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(120); // 预计时间（秒）
  
  const visibleCount = 4; // 一次显示4个风格
  const maxStartIndex = Math.max(0, styles.length - visibleCount);

  // 从 API 获取风格数据
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        if (data.templates) {
          setStyles(data.templates);
          
          // 根据 demo 文件名设置默认风格
          const demoKey = fileName.replace(/\.[^/.]+$/, ''); // 去掉扩展名
          const defaultStyle = demoStyleMap[demoKey];
          if (defaultStyle) {
            // 查找匹配的风格及其索引
            const styleIndex = data.templates.findIndex((s: TemplateStyle) => 
              s.name === defaultStyle || s.name.includes(defaultStyle.split('：')[0])
            );
            if (styleIndex !== -1) {
              setSelectedStyle(data.templates[styleIndex].name);
              // 让选中的风格显示在第2个位置（索引1）
              const newStartIndex = Math.max(0, Math.min(styleIndex - 1, data.templates.length - visibleCount));
              setStartIndex(newStartIndex);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [fileName]);

  // 模拟生成进度
  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // 传递歌曲信息到 generate 页面
            const params = new URLSearchParams();
            params.set('title', songTitle);
            if (videoUrl) {
              params.set('video', videoUrl);
            }
            params.set('start', startTime);
            params.set('end', endTime);
            if (selectedStyle) {
              params.set('style', selectedStyle);
            }
            router.push(`/generate?${params.toString()}`);
          }, 500);
          return 100;
        }
        return prev + 2;
      });
      
      setEstimatedTime(prev => Math.max(0, prev - 2));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isGenerating, router, songTitle, videoUrl, startTime, endTime, selectedStyle]);

  const handlePrev = () => {
    setStartIndex(Math.max(0, startIndex - 1));
  };

  const handleNext = () => {
    setStartIndex(Math.min(maxStartIndex, startIndex + 1));
  };

  // 返回到片段选择页面，保留时间参数
  const handleBack = () => {
    const params = new URLSearchParams();
    params.set('title', songTitle);
    params.set('file', fileName);
    if (videoUrl) {
      params.set('video', videoUrl);
    }
    params.set('start', startTime);
    params.set('end', endTime);
    router.push(`/select?${params.toString()}`);
  };

  const handleGenerate = () => {
    if (!selectedStyle) {
      return;
    }
    setProgress(0);
    setEstimatedTime(120);
    setIsGenerating(true);
  };

  const visibleStyles = styles.slice(startIndex, startIndex + visibleCount);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#121212] overflow-x-hidden">
        <Header />
        <div className="flex pt-20">
          <Sidebar />
          <div 
            className="flex-1 flex items-center justify-center" 
            style={{ marginLeft: '170px' }}
          >
            <span className="text-white text-xl">加载中...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] overflow-x-hidden">
      <Header />
      
      {/* 生成中弹窗 */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
          <div 
            className="flex flex-col items-center"
            style={{
              padding: '60px 80px',
              background: 'rgba(18, 18, 18, 0.95)',
              borderRadius: '24px',
              minWidth: '500px',
            }}
          >
            {/* 图标 */}
            <div className="mb-6">
              <svg width="101" height="102" viewBox="0 0 101 102" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M99 34C100.105 34 101 34.8954 101 36V100C101 101.105 100.105 102 99 102H2C0.895431 102 4.02665e-09 101.105 0 100V36C1.03082e-06 34.8954 0.895431 34 2 34H99ZM41.4785 50.918C40.8119 50.5335 39.9795 51.0146 39.9795 51.7842V82.3203C39.9795 83.0899 40.8119 83.5709 41.4785 83.1865L67.9365 67.918C68.6033 67.5331 68.6033 66.5714 67.9365 66.1865L41.4785 50.918Z" fill="white"/>
                <rect x="4.20825" y="17" width="92.5833" height="8.5" rx="1" fill="white"/>
                <rect x="8.41675" width="84.1667" height="8.5" rx="1" fill="white"/>
              </svg>
            </div>
            
            {/* 标题 */}
            <h2
              className="text-white font-bold text-center"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '36px',
                marginBottom: '16px',
              }}
            >
              画面生成中...
            </h2>
            
            {/* 副标题 */}
            <p
              className="text-center"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '18px',
                color: '#929292',
                marginBottom: '40px',
              }}
            >
              正在生成画面...
            </p>
            
            {/* 进度条 */}
            <div 
              className="w-full rounded-full overflow-hidden"
              style={{
                height: '8px',
                background: 'rgba(218, 178, 255, 0.3)',
                marginBottom: '20px',
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)',
                }}
              />
            </div>
            
            {/* 预计时间 */}
            <p
              className="text-center"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '16px',
                color: '#DAB2FF',
              }}
            >
              预计时间 {estimatedTime} s
            </p>
          </div>
        </div>
      )}
      
      <div className="flex pt-20">
        <Sidebar />
        
        {/* 主内容区域 */}
        <div 
          className="flex-1 flex flex-col overflow-x-hidden" 
          style={{ 
            marginLeft: '170px',
            width: 'calc(100vw - 170px)',
            paddingTop: 'clamp(60px, 7.4vw, 142px)',
            paddingBottom: 'clamp(40px, 4.2vw, 80px)',
            paddingLeft: 'clamp(30px, 5.2vw, 99px)',
            paddingRight: 'clamp(30px, 5.2vw, 99px)',
          }}
        >
          {/* 标题区域 */}
          <div className="flex justify-between items-start" style={{ marginBottom: '40px' }}>
            <div>
              <h1
                className="text-white font-bold"
                style={{ 
                  fontFamily: 'Source Han Sans CN, sans-serif',
                  fontSize: '32px',
                  lineHeight: '48px',
                  marginBottom: '8.27px',
                }}
              >
                您想生成什么样的画面
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
                选择画面风格
              </p>
            </div>
            
            {/* 训练其它风格链接 */}
            <button
              onClick={() => router.push('/training')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '20px',
                color: '#DAB2FF',
              }}
            >
              <span>🎨</span>
              <span>训练其它风格</span>
            </button>
          </div>

          {/* 风格选择区域 */}
          <div className="relative flex items-center" style={{ marginBottom: '60px' }}>
            {/* 左箭头 */}
            <button
              onClick={handlePrev}
              disabled={startIndex === 0}
              className="w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-[rgba(218,178,255,0.15)] transition-colors"
              style={{
                border: '2px solid #DAB2FF',
                marginRight: '20px',
              }}
            >
              <ChevronLeft className="w-6 h-6 text-[#DAB2FF]" />
            </button>

            {/* 风格卡片列表 */}
            <div className="flex-1 flex gap-6 items-stretch">
              {visibleStyles.map((style) => (
                <div
                  key={style.name}
                  onClick={() => setSelectedStyle(style.name)}
                  className={`flex-1 cursor-pointer transition-all duration-200 flex flex-col rounded-xl ${
                    selectedStyle === style.name ? 'ring-4 ring-[#F6339A]' : ''
                  }`}
                >
                  {/* 风格图片 */}
                  <div
                    className="w-full aspect-square bg-cover bg-center rounded-t-xl"
                    style={{
                      backgroundImage: style.coverImage ? `url(${style.coverImage})` : 'none',
                      backgroundColor: '#2a2a2a',
                    }}
                  />
                  
                  {/* 风格信息 */}
                  <div className="p-4 rounded-b-xl" style={{ background: '#1a1a1a', height: '100px' }}>
                    <h3
                      className="text-white font-bold text-center"
                      style={{
                        fontFamily: 'Source Han Sans CN, sans-serif',
                        fontSize: '18px',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {style.name}
                    </h3>
                    <p
                      className="text-center"
                      style={{
                        fontFamily: 'Source Han Sans CN, sans-serif',
                        fontSize: '14px',
                        color: '#929292',
                        lineHeight: '1.5',
                      }}
                    >
                      包含：{style.imageCount}张图片
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 右箭头 */}
            <button
              onClick={handleNext}
              disabled={startIndex >= maxStartIndex}
              className="w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-[rgba(218,178,255,0.15)] transition-colors"
              style={{
                border: '2px solid #DAB2FF',
                marginLeft: '20px',
              }}
            >
              <ChevronRight className="w-6 h-6 text-[#DAB2FF]" />
            </button>
          </div>

          {/* 按钮区域 */}
          <div className="flex justify-between">
            {/* 返回按钮 */}
            <button
              onClick={handleBack}
              className="relative group"
            >
              <div
                className="flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                style={{
                  width: '120px',
                  height: '58px',
                  borderRadius: '24px',
                  border: '2px solid #DAB2FF',
                }}
              >
                <span
                  className="font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                    color: '#DAB2FF',
                  }}
                >
                  返回
                </span>
              </div>
            </button>
            
            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={!selectedStyle || isGenerating}
              className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="relative flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                style={{
                  width: '200px',
                  height: '58px',
                  borderRadius: '24px',
                }}
              >
                <span
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '28px',
                    lineHeight: '20px',
                  }}
                >
                  {isGenerating ? '生成中...' : '生成画面'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function StylePage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div style={{ color: '#FFFFFF' }}>加载中...</div>
      </div>
    }>
      <StylePageContent />
    </Suspense>
  );
}
