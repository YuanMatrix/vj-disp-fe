'use client';

import { useState } from 'react';

interface StepItem {
  title: string;
  subtitle: string;
  active: boolean;
}

export default function Sidebar() {
  const [mode, setMode] = useState<'create' | 'display'>('create');

  const steps: StepItem[] = [
    { title: '上传音乐', subtitle: '支持多曲风输入', active: true },
    { title: '选择片段', subtitle: '选择播放部分', active: false },
    { title: '输入描述', subtitle: '选择对应风格\n输入场景提示词', active: false },
    { title: '画面生成', subtitle: '生成AI VJ画面', active: false },
    { title: '画面展示', subtitle: '播放AI VJ画面', active: false },
  ];

  return (
    <aside 
      className="w-[170px] bg-[#080808] fixed left-0 flex flex-col justify-between"
      style={{ 
        top: '80px',
        height: 'calc(100vh - 80px)',
        paddingTop: '94.31px',
        paddingBottom: '40.88px',
        paddingLeft: '35px',
      }}
    >
      {/* 步骤列表 */}
      <div className="flex flex-col">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            {/* 连接线 - 在圆点下方 */}
            {index < steps.length - 1 && (
              <div
                className="absolute w-[3px] rounded-[20px]"
                style={{
                  height: '70px',
                  left: '4px',
                  top: '24px',
                  background: step.active ? '#F6339A' : '#575757',
                }}
              />
            )}
            
            {/* 步骤内容 */}
            <div className="flex items-start gap-[14px]" style={{ marginBottom: index < steps.length - 1 ? '46px' : '0' }}>
              {/* 圆点 */}
              <div
                className="rounded-full flex-shrink-0"
                style={{ 
                  width: '11.32px',
                  height: '11.32px',
                  marginTop: '6.34px',
                  background: step.active ? '#F6339A' : '#575757',
                }}
              />
              
              {/* 文字 */}
              <div className="flex flex-col">
                <div
                  className="font-bold text-base leading-6"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    color: step.active ? '#FFFFFF' : '#575757',
                  }}
                >
                  {step.title}
                </div>
                <div
                  className="text-xs leading-[18px] whitespace-pre-line mt-0.5"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    color: step.active ? '#F6339A' : '#575757',
                  }}
                >
                  {step.subtitle}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 模式切换 */}
      <div className="relative" style={{ width: '97.68px', height: '74.99px' }}>
        {/* 切换背景边框 */}
        <div
          className="absolute"
          style={{
            width: '24px',
            height: '70.99px',
            left: '0px',
            top: '0px',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(#302A35, #302A35), linear-gradient(135deg, #AD46FF 0%, #F6339A 100%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            borderRadius: '16px',
            transform: 'rotate(-180deg)',
          }}
        />
        
        {/* 切换圆点 */}
        <div
          className="absolute rounded-full transition-all duration-300"
          style={{
            width: '20px',
            height: '20px',
            left: '2px',
            top: mode === 'create' ? '2.42px' : '48.57px',
            background: '#DAB2FF',
            transform: 'rotate(-180deg)',
          }}
        />
        
        {/* 创作模式文字 */}
        <button
          onClick={() => setMode('create')}
          className="absolute text-left"
          style={{
            fontFamily: 'Source Han Sans CN, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: '20px',
            width: '64px',
            height: '20px',
            left: '33.68px',
            top: '0px',
            color: mode === 'create' ? '#F6339A' : '#FFFFFF',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
        >
          创作模式
        </button>
        
        {/* 展演模式文字 */}
        <button
          onClick={() => setMode('display')}
          className="absolute text-left"
          style={{
            fontFamily: 'Source Han Sans CN, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: '20px',
            width: '64px',
            height: '20px',
            left: '33.68px',
            top: '54.99px',
            color: mode === 'display' ? '#F6339A' : '#FFFFFF',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
        >
          展演模式
        </button>
      </div>
    </aside>
  );
}
