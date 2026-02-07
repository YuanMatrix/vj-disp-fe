'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getAllTasks, 
  updateTask, 
  VideoTask, 
  DEFAULT_THUMBNAIL,
  formatDateTime 
} from '@/data/tasks';
import { worksData, Work } from '@/data/works';

// 合并的作品类型
interface DisplayWork {
  id: string;
  title: string;
  style: string;
  videoUrl: string;
  thumbnail: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  error?: string;
  generationTaskId?: string;
}

export default function WorksPage() {
  const router = useRouter();
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [works, setWorks] = useState<DisplayWork[]>([]);
  
  const visibleCount = 4; // 每行显示4个
  const rowCount = 2; // 显示2行
  const totalVisible = visibleCount * rowCount;
  const maxStartIndex = Math.max(0, works.length - totalVisible);

  // 将 ComfyUI 绝对路径转换为代理 API URL
  const convertToProxyUrl = useCallback((absolutePath: string) => {
    if (!absolutePath) return '';
    // 如果已经是代理 URL，直接返回
    if (absolutePath.startsWith('/api/comfyui/output/')) {
      return absolutePath;
    }
    // 提取 output 后面的相对路径
    const outputIndex = absolutePath.indexOf('/output/');
    if (outputIndex !== -1) {
      const relativePath = absolutePath.substring(outputIndex + 8);
      return `/api/comfyui/output/${relativePath}`;
    }
    return absolutePath;
  }, []);

  // 加载作品数据
  const loadWorks = useCallback(() => {
    // 获取动态任务
    const tasks = getAllTasks();
    const taskWorks: DisplayWork[] = tasks.map(task => {
      const videoUrl = convertToProxyUrl(task.videoUrl || '');
      const thumbnail = task.status === 'completed' && task.thumbnail 
        ? convertToProxyUrl(task.thumbnail)
        : '/images/default-thumbnail.png';
      
      return {
        id: task.id,
        title: task.title,
        style: task.style,
        videoUrl,
        thumbnail,
        createdAt: formatDateTime(task.createdAt),
        status: task.status,
        error: task.error,
        generationTaskId: task.generationTaskId,
      };
    });

    // 合并静态演示数据
    const staticWorks: DisplayWork[] = worksData.map(work => ({
      id: work.id,
      title: work.title,
      style: work.style,
      videoUrl: work.videoUrl,
      thumbnail: work.thumbnail,
      createdAt: work.createdAt,
      status: 'completed' as const,
    }));

    // 动态任务在前，静态数据在后
    setWorks([...taskWorks, ...staticWorks]);
  }, [convertToProxyUrl]);

  // 检查进行中任务的状态
  const checkPendingTasks = useCallback(async () => {
    const tasks = getAllTasks();
    const pendingTasks = tasks.filter(
      task => task.status === 'processing' || task.status === 'pending'
    );

    for (const task of pendingTasks) {
      if (!task.generationTaskId) continue;

      try {
        const response = await fetch(`/api/comfyui/status/${task.generationTaskId}`);
        const result = await response.json();

        if (!result.success) continue;

        if (result.status === 'completed') {
          const rawVideoPath = result.videoPath || (result.outputFiles?.[0]?.path);
          
          // 将 ComfyUI 绝对路径转换为代理 API URL
          const convertToProxyUrl = (absolutePath: string) => {
            if (!absolutePath) return '';
            const outputIndex = absolutePath.indexOf('/output/');
            if (outputIndex !== -1) {
              const relativePath = absolutePath.substring(outputIndex + 8);
              return `/api/comfyui/output/${relativePath}`;
            }
            return absolutePath;
          };
          
          const videoProxyUrl = convertToProxyUrl(rawVideoPath);
          const thumbnailProxyUrl = videoProxyUrl ? videoProxyUrl.replace('.mp4', '_thumb.png') : DEFAULT_THUMBNAIL;
          
          updateTask(task.id, {
            status: 'completed',
            videoUrl: videoProxyUrl,
            thumbnail: thumbnailProxyUrl,
          });
        } else if (result.status === 'failed') {
          updateTask(task.id, {
            status: 'failed',
            error: result.error || '生成失败',
          });
        }
      } catch (error) {
        console.error('Error checking task status:', error);
      }
    }

    // 重新加载数据
    loadWorks();
  }, [loadWorks]);

  // 初始加载和定时检查
  useEffect(() => {
    loadWorks();

    // 每 5 秒检查一次进行中的任务
    const interval = setInterval(() => {
      checkPendingTasks();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadWorks, checkPendingTasks]);

  const handlePrev = () => {
    setStartIndex(Math.max(0, startIndex - visibleCount));
  };

  const handleNext = () => {
    setStartIndex(Math.min(maxStartIndex, startIndex + visibleCount));
  };

  // 双击进入播放页面
  const handleDoubleClick = (work: DisplayWork) => {
    if (work.status !== 'completed' || !work.videoUrl) {
      return; // 未完成的任务不能播放
    }
    const url = `/generate?video=${encodeURIComponent(work.videoUrl)}&title=${encodeURIComponent(work.title)}`;
    router.push(url);
  };

  const visibleWorks = works.slice(startIndex, startIndex + totalVisible);

  // 获取状态显示文字
  const getStatusText = (status: DisplayWork['status']) => {
    switch (status) {
      case 'processing':
      case 'pending':
        return '生成中...';
      case 'failed':
        return '生成失败';
      default:
        return null;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: DisplayWork['status']) => {
    switch (status) {
      case 'processing':
      case 'pending':
        return '#DAB2FF';
      case 'failed':
        return '#FF6B6B';
      default:
        return null;
    }
  };

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
                  } ${work.status !== 'completed' ? 'opacity-80' : ''}`}
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

                  {/* 状态遮罩层（进行中/失败） */}
                  {work.status !== 'completed' && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      <div className="text-center">
                        {work.status === 'processing' || work.status === 'pending' ? (
                          <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full mx-auto mb-2" style={{ borderColor: '#DAB2FF', borderTopColor: 'transparent' }} />
                        ) : (
                          <div className="text-4xl mb-2">⚠️</div>
                        )}
                        <p
                          style={{
                            fontFamily: 'Source Han Sans CN, sans-serif',
                            fontSize: '14px',
                            color: getStatusColor(work.status) || '#fff',
                          }}
                        >
                          {getStatusText(work.status)}
                        </p>
                      </div>
                    </div>
                  )}
                  
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
