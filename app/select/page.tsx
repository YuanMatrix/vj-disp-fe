'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

function SelectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 从 URL 参数获取保存的时间（用于返回时恢复）
  const savedStart = searchParams.get('start');
  const savedEnd = searchParams.get('end');
  
  // 解析保存的时间
  const getInitialTime = (savedTime: string | null, defaultMinute: string, defaultSecond: string) => {
    if (savedTime) {
      const totalSeconds = parseInt(savedTime);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return {
        minute: String(mins).padStart(2, '0'),
        second: String(secs).padStart(2, '0'),
      };
    }
    return { minute: defaultMinute, second: defaultSecond };
  };
  
  const initialStart = getInitialTime(savedStart, '00', '00');
  const initialEnd = getInitialTime(savedEnd, '00', '30');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [startMinute, setStartMinute] = useState(initialStart.minute);
  const [startSecond, setStartSecond] = useState(initialStart.second);
  const [endMinute, setEndMinute] = useState(initialEnd.minute);
  const [endSecond, setEndSecond] = useState(initialEnd.second);
  const [duration, setDuration] = useState(savedStart && savedEnd ? parseInt(savedEnd) - parseInt(savedStart) : 30.0);
  const [totalDuration, setTotalDuration] = useState(0); // 歌曲总时长（秒）
  const [errorMessage, setErrorMessage] = useState(''); // 错误提示
  const [waveformData, setWaveformData] = useState<number[]>([]); // 波形数据
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null); // 拖拽状态
  const waveformRef = useRef<HTMLDivElement>(null); // 波形容器引用
  const [hasInitialized, setHasInitialized] = useState(!!savedStart); // 是否已有保存的时间
  
  const MAX_DURATION = 60; // 最大选区时长（秒）
  const WAVEFORM_BARS = 80; // 波形条数量
  
  const fileName = searchParams.get('file') || 'demo1.flac';
  const songTitle = searchParams.get('title') || fileName.replace(/\.[^/.]+$/, ''); // 歌曲标题
  const videoUrl = searchParams.get('video') || ''; // 视频地址
  const audioUrl = `/music/${fileName}`;

  // 格式化时间显示 (秒 -> m:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 显示错误提示
  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // 获取音频波形数据
  useEffect(() => {
    const fetchWaveformData = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // 获取音频数据
        const channelData = audioBuffer.getChannelData(0);
        const samples = channelData.length;
        const blockSize = Math.floor(samples / WAVEFORM_BARS);
        
        const waveform: number[] = [];
        
        for (let i = 0; i < WAVEFORM_BARS; i++) {
          const start = i * blockSize;
          const end = start + blockSize;
          
          // 计算这个区块的平均振幅
          let sum = 0;
          for (let j = start; j < end; j++) {
            sum += Math.abs(channelData[j]);
          }
          const average = sum / blockSize;
          
          // 归一化到 20-120 的高度范围
          const height = Math.max(20, Math.min(120, average * 400 + 20));
          waveform.push(height);
        }
        
        setWaveformData(waveform);
        audioContext.close();
      } catch (error) {
        console.error('获取波形数据失败:', error);
        // 如果失败，使用默认的伪随机波形
        const defaultWaveform = Array.from({ length: WAVEFORM_BARS }, (_, i) => 
          20 + ((i * 7 + 13) % 100)
        );
        setWaveformData(defaultWaveform);
      }
    };

    fetchWaveformData();
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      const handleLoadedMetadata = () => {
        const audioDuration = audioRef.current?.duration || 0;
        setTotalDuration(audioDuration);
        
        // 只有在没有保存的时间时，才设置默认选区为歌曲中间的30秒（或更短）
        if (!hasInitialized) {
          const selectDuration = Math.min(MAX_DURATION, audioDuration);
          const startTime = Math.floor((audioDuration - selectDuration) / 2);
          const endTime = startTime + selectDuration;
          
          const startMins = Math.floor(startTime / 60);
          const startSecs = Math.floor(startTime % 60);
          const endMins = Math.floor(endTime / 60);
          const endSecs = Math.floor(endTime % 60);
          
          setStartMinute(String(startMins).padStart(2, '0'));
          setStartSecond(String(startSecs).padStart(2, '0'));
          setEndMinute(String(endMins).padStart(2, '0'));
          setEndSecond(String(endSecs).padStart(2, '0'));
          setDuration(selectDuration);
        }
      };
      
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [hasInitialized]);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // 从开始时间播放到结束时间
        const startTime = parseInt(startMinute) * 60 + parseInt(startSecond);
        audioRef.current.currentTime = startTime;
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const adjustStartTime = (seconds: number) => {
    let newStartTotal = parseInt(startMinute) * 60 + parseInt(startSecond) + seconds;
    const endTotal = parseInt(endMinute) * 60 + parseInt(endSecond);
    
    // 边界检查
    if (newStartTotal < 0) newStartTotal = 0;
    if (newStartTotal >= endTotal) {
      showError('开始时间不能大于或等于结束时间');
      return;
    }
    
    // 检查是否超过最大时长
    const newDuration = endTotal - newStartTotal;
    if (newDuration > MAX_DURATION) {
      showError(`选区时长不能超过${MAX_DURATION}秒`);
      return;
    }
    
    const newMinute = Math.floor(newStartTotal / 60);
    const newSecond = newStartTotal % 60;
    
    setStartMinute(String(newMinute).padStart(2, '0'));
    setStartSecond(String(newSecond).padStart(2, '0'));
    setDuration(newDuration);
  };

  const adjustEndTime = (seconds: number) => {
    let newEndTotal = parseInt(endMinute) * 60 + parseInt(endSecond) + seconds;
    const startTotal = parseInt(startMinute) * 60 + parseInt(startSecond);
    
    // 边界检查
    if (newEndTotal < 0) newEndTotal = 0;
    if (newEndTotal > totalDuration && totalDuration > 0) {
      newEndTotal = Math.floor(totalDuration);
    }
    if (newEndTotal <= startTotal) {
      showError('结束时间不能小于或等于开始时间');
      return;
    }
    
    // 检查是否超过最大时长
    const newDuration = newEndTotal - startTotal;
    if (newDuration > MAX_DURATION) {
      showError(`选区时长不能超过${MAX_DURATION}秒`);
      return;
    }
    
    const newMinute = Math.floor(newEndTotal / 60);
    const newSecond = newEndTotal % 60;
    
    setEndMinute(String(newMinute).padStart(2, '0'));
    setEndSecond(String(newSecond).padStart(2, '0'));
    setDuration(newDuration);
  };

  const handleNext = () => {
    const params = new URLSearchParams();
    params.set('title', songTitle);
    params.set('file', fileName); // 传递文件名用于默认风格选择
    if (videoUrl) {
      params.set('video', videoUrl);
    }
    // 传递选区的开始和结束时间
    const startTime = parseInt(startMinute) * 60 + parseInt(startSecond);
    const endTime = parseInt(endMinute) * 60 + parseInt(endSecond);
    params.set('start', String(startTime));
    params.set('end', String(endTime));
    router.push(`/style?${params.toString()}`);
  };

  // 拖拽开始
  const handleDragStart = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(side);
  };

  // 拖拽移动
  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !waveformRef.current || totalDuration <= 0) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTimeInSeconds = Math.floor(percentage * totalDuration);

    const startTotal = parseInt(startMinute) * 60 + parseInt(startSecond);
    const endTotal = parseInt(endMinute) * 60 + parseInt(endSecond);

    if (isDragging === 'left') {
      // 拖动左边界（调整开始时间）
      if (newTimeInSeconds >= endTotal) {
        return; // 不能超过结束时间
      }
      const newDuration = endTotal - newTimeInSeconds;
      if (newDuration > MAX_DURATION) {
        showError(`选区时长不能超过${MAX_DURATION}秒`);
        return;
      }
      const mins = Math.floor(newTimeInSeconds / 60);
      const secs = newTimeInSeconds % 60;
      setStartMinute(String(mins).padStart(2, '0'));
      setStartSecond(String(secs).padStart(2, '0'));
      setDuration(newDuration);
    } else {
      // 拖动右边界（调整结束时间）
      if (newTimeInSeconds <= startTotal) {
        return; // 不能小于开始时间
      }
      const newDuration = newTimeInSeconds - startTotal;
      if (newDuration > MAX_DURATION) {
        showError(`选区时长不能超过${MAX_DURATION}秒`);
        return;
      }
      const mins = Math.floor(newTimeInSeconds / 60);
      const secs = newTimeInSeconds % 60;
      setEndMinute(String(mins).padStart(2, '0'));
      setEndSecond(String(secs).padStart(2, '0'));
      setDuration(newDuration);
    }
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setIsDragging(null);
  };

  // 计算选区位置和宽度（百分比）
  const startTimeInSeconds = parseInt(startMinute) * 60 + parseInt(startSecond);
  const endTimeInSeconds = parseInt(endMinute) * 60 + parseInt(endSecond);
  const selectionLeft = totalDuration > 0 ? (startTimeInSeconds / totalDuration) * 100 : 0;
  const selectionWidth = totalDuration > 0 ? ((endTimeInSeconds - startTimeInSeconds) / totalDuration) * 100 : 30;

  return (
    <main className="min-h-screen bg-[#121212] overflow-x-hidden">
      <audio ref={audioRef} src={audioUrl} />
      
      {/* 导航栏 */}
      <Header />
      
      <div className="flex pt-20">
        {/* 使用 Sidebar 组件 */}
        <Sidebar />
        
        {/* 主内容区域 */}
        <div 
          className="flex-1 flex flex-col overflow-hidden" 
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
          <div style={{ marginBottom: '40px' }}>
            <h1
              className="text-white font-bold"
              style={{ 
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '32px',
                lineHeight: '48px',
                marginBottom: '8.27px',
              }}
            >
              选择您的音乐片段
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
              {songTitle} · 选择播放部分
            </p>
          </div>
          
          {/* 相对定位容器 - 用于其他元素 */}
          <div className="relative flex-1">

            {/* 错误提示 - 固定在顶部中央 */}
            {errorMessage && (
              <div 
                className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-[rgba(248,113,113,0.95)] rounded-lg shadow-lg animate-pulse"
                style={{ 
                  fontFamily: 'Source Han Sans CN, sans-serif',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}

            {/* 时间调整按钮区域 */}
            <div className="flex justify-around" style={{ marginBottom: '60px' }}>
              {/* 移动开始时间 */}
              <div className="flex flex-col items-center">
                <h3 
                  className="text-[#DAB2FF] font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                    letterSpacing: '2px',
                    marginBottom: '20px',
                  }}
                >
                  移动开始时间
                </h3>
                <button
                  onClick={() => adjustStartTime(-1)}
                  className="w-[100px] h-[50px] bg-[rgba(218,178,255,0.15)] rounded-xl hover:bg-[rgba(218,178,255,0.25)] transition-colors mb-[10px]"
                >
                  <span className="text-[#DAB2FF] font-bold text-2xl" style={{ fontFamily: 'Source Han Sans CN, sans-serif', lineHeight: '20px' }}>
                    ← -1s
                  </span>
                </button>
                <button
                  onClick={() => adjustStartTime(1)}
                  className="w-[100px] h-[50px] bg-[rgba(218,178,255,0.15)] rounded-xl hover:bg-[rgba(218,178,255,0.25)] transition-colors"
                >
                  <span className="text-[#DAB2FF] font-bold text-2xl" style={{ fontFamily: 'Source Han Sans CN, sans-serif', lineHeight: '20px' }}>
                    → +1s
                  </span>
                </button>
              </div>

              {/* 移动结束时间 */}
              <div className="flex flex-col items-center">
                <h3 
                  className="text-[#DAB2FF] font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                    letterSpacing: '2px',
                    marginBottom: '20px',
                  }}
                >
                  移动结束时间
                </h3>
                <button
                  onClick={() => adjustEndTime(-1)}
                  className="w-[100px] h-[50px] bg-[rgba(218,178,255,0.15)] rounded-xl hover:bg-[rgba(218,178,255,0.25)] transition-colors mb-[10px]"
                >
                  <span className="text-[#DAB2FF] font-bold text-2xl" style={{ fontFamily: 'Source Han Sans CN, sans-serif', lineHeight: '20px' }}>
                    ← -1s
                  </span>
                </button>
                <button
                  onClick={() => adjustEndTime(1)}
                  className="w-[100px] h-[50px] bg-[rgba(218,178,255,0.15)] rounded-xl hover:bg-[rgba(218,178,255,0.25)] transition-colors"
                >
                  <span className="text-[#DAB2FF] font-bold text-2xl" style={{ fontFamily: 'Source Han Sans CN, sans-serif', lineHeight: '20px' }}>
                    → +1s
                  </span>
                </button>
              </div>
            </div>

            {/* 波形区域 */}
            <div style={{ marginBottom: '60px' }}>
              <div className="flex items-center gap-4">
                {/* 播放按钮 */}
                <button
                  onClick={handlePlay}
                  className="flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
                  style={{
                    width: '50px',
                    height: '50px',
                  }}
                >
                  {isPlaying ? (
                    <div style={{ width: '16px', height: '16px', background: '#DAB2FF' }} />
                  ) : (
                    <svg width="24" height="28" viewBox="0 0 36 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M33.75 19.7568C34.0831 19.9493 34.0831 20.4296 33.75 20.6221L2.25 38.8086C1.91667 39.001 1.5 38.7609 1.5 38.376L1.5 2.00293C1.5 1.61803 1.91667 1.37786 2.25 1.57031L33.75 19.7568Z" stroke="#DAB2FF" strokeWidth="3"/>
                    </svg>
                  )}
                </button>

                {/* 音频波形区域 */}
                <div 
                  ref={waveformRef}
                  className="relative flex-1 overflow-hidden"
                  style={{ 
                    height: '145.71px',
                    cursor: isDragging ? 'grabbing' : 'default',
                  }}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                >
                  {/* 波形条 - 上下对称 */}
                  <div className="flex items-center justify-between h-full w-full" style={{ position: 'relative' }}>
                    {(waveformData.length > 0 ? waveformData : Array.from({ length: WAVEFORM_BARS }, (_, i) => 20 + ((i * 7 + 13) % 100))).map((height, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center shrink-0"
                        style={{ height: '100%', justifyContent: 'center' }}
                      >
                        {/* 上半部分 */}
                        <div
                          className="rounded-t-sm"
                          style={{
                            width: '3px',
                            height: `${height / 2}px`,
                            background: '#7F8285',
                          }}
                        />
                        {/* 下半部分 */}
                        <div
                          className="rounded-b-sm"
                          style={{
                            width: '3px',
                            height: `${height / 2}px`,
                            background: '#7F8285',
                          }}
                        />
                      </div>
                    ))}
                  </div>

                {/* 选择区域覆盖层 */}
                <div
                  className="absolute top-0 transition-all duration-200"
                  style={{
                    left: `${selectionLeft}%`,
                    width: `${selectionWidth}%`,
                    height: '145.71px',
                    background: 'rgba(173, 70, 255, 0.25)',
                    borderRadius: '2px',
                  }}
                >
                  {/* 左边界 - 可拖拽 */}
                  <div 
                    className="absolute left-0 top-0 w-[20px] h-full cursor-ew-resize z-10 flex items-center"
                    onMouseDown={handleDragStart('left')}
                  >
                    <div className="w-[6.45px] h-full bg-[#F6339A]" style={{ borderRadius: '2px 0px 0px 2px' }} />
                    <div className="w-[14.51px] h-full bg-[rgba(246,51,154,0.25)] flex items-center justify-center">
                      <div className="w-[9.16px] h-[16.51px] border-[3px] border-white" 
                           style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }} />
                    </div>
                  </div>
                  
                  {/* 右边界 - 可拖拽 */}
                  <div 
                    className="absolute right-0 top-0 w-[20px] h-full cursor-ew-resize z-10 flex items-center justify-end"
                    onMouseDown={handleDragStart('right')}
                  >
                    <div className="w-[14.51px] h-full bg-[rgba(246,51,154,0.25)] flex items-center justify-center">
                      <div className="w-[9.16px] h-[16.51px] border-[3px] border-white rotate-180" 
                           style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }} />
                    </div>
                    <div className="w-[6.45px] h-full bg-[#F6339A]" style={{ borderRadius: '0px 2px 2px 0px' }} />
                  </div>
                </div>
                </div>

                {/* 试听片段按钮 */}
                <button
                  onClick={handlePlay}
                  className="w-[140px] h-[50px] bg-[rgba(218,178,255,0.15)] rounded-xl hover:bg-[rgba(218,178,255,0.25)] transition-colors shrink-0"
                >
                  <span 
                    className="text-white font-bold text-center"
                    style={{ 
                      fontFamily: 'Source Han Sans CN, sans-serif',
                      fontSize: '24px',
                      lineHeight: '20px',
                    }}
                  >
                    试听片段
                  </span>
                </button>
              </div>
              
              {/* 时间标记 */}
              <div className="flex justify-between" style={{ marginLeft: '54px', marginRight: '154px', marginTop: '8px' }}>
                <span 
                  className="text-[#929292] font-medium"
                  style={{ 
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '14px',
                  }}
                >
                  0:00
                </span>
                <span 
                  className="text-[#929292] font-medium"
                  style={{ 
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '14px',
                  }}
                >
                  {formatTime(totalDuration)}
                </span>
              </div>
            </div>

            {/* 时间输入区域 */}
            <div className="flex items-center justify-center gap-8 flex-wrap" style={{ marginBottom: '60px' }}>
              {/* 开始时间 */}
              <div className="flex items-center gap-2">
                <span 
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                    letterSpacing: '2px',
                  }}
                >
                  开始时间
                </span>
                <input
                  type="text"
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="w-[60px] h-[35px] bg-white text-center"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '20px',
                    color: '#000000',
                  }}
                  maxLength={2}
                />
                <span 
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                  }}
                >
                  :
                </span>
                <input
                  type="text"
                  value={startSecond}
                  onChange={(e) => setStartSecond(e.target.value)}
                  className="w-[60px] h-[35px] bg-white text-center"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '20px',
                    color: '#000000',
                  }}
                  maxLength={2}
                />
              </div>

              {/* 结束时间 */}
              <div className="flex items-center gap-2">
                <span 
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                    letterSpacing: '2px',
                  }}
                >
                  结束时间
                </span>
                <input
                  type="text"
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="w-[60px] h-[35px] bg-white text-center"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '20px',
                    color: '#000000',
                  }}
                  maxLength={2}
                />
                <span 
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                  }}
                >
                  :
                </span>
                <input
                  type="text"
                  value={endSecond}
                  onChange={(e) => setEndSecond(e.target.value)}
                  className="w-[60px] h-[35px] bg-white text-center"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '20px',
                    color: '#000000',
                  }}
                  maxLength={2}
                />
              </div>

              {/* 总计时长 */}
              <div className="flex items-center gap-2">
                <span 
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                    letterSpacing: '2px',
                  }}
                >
                  总计时长
                </span>
                <span 
                  className="text-[#F6339A] font-bold"
                  style={{
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '24px',
                    lineHeight: '20px',
                  }}
                >
                  {duration.toFixed(1)}s
                </span>
              </div>
            </div>

            {/* 选择风格按钮 */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center justify-center rounded-3xl hover:scale-105 active:scale-95 transition-transform"
                style={{
                  width: '251.2px',
                  height: '57.85px',
                  background: 'linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)',
                  boxShadow: '0px 10px 15px -3px rgba(173, 70, 255, 0.5), 0px 4px 6px -4px rgba(173, 70, 255, 0.5)',
                }}
              >
                <span 
                  className="text-white font-bold text-center"
                  style={{ 
                    fontFamily: 'Source Han Sans CN, sans-serif',
                    fontSize: '32px',
                    lineHeight: '20px',
                  }}
                >
                  选择风格
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SelectPage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div style={{ color: '#FFFFFF' }}>加载中...</div>
      </div>
    }>
      <SelectPageContent />
    </Suspense>
  );
}
