'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* 背景图片 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/hero-bg.png)',
        }}
      />
      
      {/* 黑色半透明遮罩 - 从导航栏下方开始 */}
      <div 
        className="absolute left-0 w-full bg-black/50"
        style={{
          top: '80px',
          height: '1000px',
        }}
      />

      {/* 内容区域 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center" style={{ gap: '24px' }}>
          {/* 主标题 */}
          <h1 
            className="text-white text-[64px] md:text-[64px] sm:text-[48px] font-bold text-center"
            style={{ 
              fontFamily: 'Source Han Sans CN, -apple-system, sans-serif',
              lineHeight: '1.2',
              margin: 0
            }}
          >
            AIGC音乐创作平台
          </h1>
          
          {/* 副标题 */}
          <p 
            className="text-[#DAB2FF] text-[32px] md:text-[32px] sm:text-[24px] font-medium text-center"
            style={{ 
              fontFamily: 'Source Han Sans CN, -apple-system, sans-serif',
              lineHeight: '1.2',
              margin: 0
            }}
          >
            将您的音乐转变为VJ画面
          </p>

          {/* CTA 按钮 */}
          <div style={{ marginTop: '40px' }}>
            <Link href="/studio">
              <button className="group relative">
                {/* 按钮阴影层 */}
                <div className="absolute inset-0 top-[10.87px] bg-gradient-to-r from-[#AD46FF] to-[#F6339A] rounded-[50px] shadow-[0_4px_6px_-4px_rgba(172.87,70.37,255,0.5)] blur-sm" />
                
                {/* 按钮主体 */}
                <div className="relative w-[260px] h-[87px] rounded-[50px] bg-gradient-to-r from-[#AD46FF] to-[#F6339A] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                  <span 
                    className="text-white text-[40px] font-bold"
                    style={{ 
                      fontFamily: 'Source Han Sans CN, -apple-system, sans-serif',
                      lineHeight: '1'
                    }}
                  >
                    开始创作
                  </span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 装饰性渐变光效 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>
    </section>
  );
}

