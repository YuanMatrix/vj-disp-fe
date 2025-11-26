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
      className="w-[170px] min-w-[170px] bg-[#080808] flex flex-col justify-between flex-shrink-0"
      style={{ 
        minHeight: 'calc(100vh - 80px)',
        paddingTop: '94px',
        paddingBottom: '94px',
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
                className="w-[11px] h-[11px] rounded-full flex-shrink-0 mt-[6px]"
                style={{ background: step.active ? '#F6339A' : '#575757' }}
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
      <div className="flex items-start gap-[10px]">
        {/* 切换背景和按钮 */}
        <div
          className="relative w-6 h-[71px] bg-[#302A35] rounded-2xl flex-shrink-0"
        >
          {/* 切换按钮 */}
          <div
            className="absolute w-5 h-5 bg-[#DAB2FF] rounded-full transition-all duration-300"
            style={{
              left: '2px',
              top: mode === 'create' ? '2px' : '49px',
            }}
          />
        </div>

        {/* 文字标签 */}
        <div className="flex flex-col justify-between h-[71px]">
          <button
            onClick={() => setMode('create')}
            className="text-base font-bold leading-5 text-left"
            style={{
              fontFamily: 'Source Han Sans CN, sans-serif',
              color: mode === 'create' ? '#F6339A' : '#FFFFFF',
            }}
          >
            创作模式
          </button>
          <button
            onClick={() => setMode('display')}
            className="text-base font-bold leading-5 text-left"
            style={{
              fontFamily: 'Source Han Sans CN, sans-serif',
              color: mode === 'display' ? '#F6339A' : '#FFFFFF',
            }}
          >
            展演模式
          </button>
        </div>
      </div>
    </aside>
  );
}
