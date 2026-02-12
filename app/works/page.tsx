'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getAllTasks, 
  updateTask, 
  DEFAULT_THUMBNAIL,
  formatDateTime,
  checkAndHandleTimeoutTasks,
  getPendingTaskCount,
} from '@/data/tasks';
import { generateConfig } from '@/config/generate';
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
  const [pendingCount, setPendingCount] = useState(0);
  
  const visibleCount = 4; // 每行显示4个
  const rowCount = 2; // 显示2行
  const totalVisible = visibleCount * rowCount;
  const maxStartIndex = Math.max(0, works.length - totalVisible);

  // 调试工具：在开发环境下暴露到 window 对象
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).debugTasks = () => {
        const tasks = getAllTasks();
        console.log(`共有 ${tasks.length} 个任务`);
        console.table(tasks.map((task: any) => ({
          id: task.id.substring(0, 20) + '...',
          title: task.title,
          status: task.status,
          comfyuiTaskId: task.comfyuiTaskId || task.generationTaskId || 'N/A',
          hasVideo: !!task.videoUrl,
          videoUrl: task.videoUrl?.substring(0, 50) || 'N/A',
          error: task.error || 'N/A',
          createdAt: new Date(task.createdAt).toLocaleString('zh-CN'),
        })));
        return tasks;
      };
      
      (window as any).checkTaskStatus = async (comfyuiTaskId: string) => {
        try {
          console.log(`检查任务状态: ${comfyuiTaskId}`);
          const response = await fetch(`/api/comfyui/status/${comfyuiTaskId}`);
          const result = await response.json();
          
          console.log('响应状态:', response.status);
          console.log('响应数据:', result);
          
          return result;
        } catch (error) {
          console.error('检查失败:', error);
        }
      };
      
      console.log('✅ 调试工具已加载！');
      console.log('使用 window.debugTasks() 查看所有任务');
      console.log('使用 window.checkTaskStatus("任务ID") 检查特定任务状态');
    }
  }, []);

  // 将 ComfyUI 绝对路径转换为代理 API URL
  const convertToProxyUrl = useCallback((absolutePath: string) => {
    if (!absolutePath) return '';
    // 如果已经是代理 URL，直接返回
    if (absolutePath.startsWith('/api/comfyui/output/')) {
      return absolutePath;
    }
    
    // 处理 Unix 路径: /path/to/ComfyUI/output/xxx
    const outputIndex = absolutePath.indexOf('/output/');
    if (outputIndex !== -1) {
      const relativePath = absolutePath.substring(outputIndex + 8);
      return `/api/comfyui/output/${relativePath}`;
    }
    
    // 处理 Windows 路径: C:\path\to\ComfyUI\output\xxx
    const outputIndexWin = absolutePath.indexOf('\\output\\');
    if (outputIndexWin !== -1) {
      const relativePath = absolutePath.substring(outputIndexWin + 8).replace(/\\/g, '/');
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
    
    // 更新队列中的任务数量
    setPendingCount(getPendingTaskCount());
  }, [convertToProxyUrl]);

  // 检查进行中任务的状态
  const checkPendingTasks = useCallback(async () => {
    // 首先检查并处理超时任务
    const timeoutTasks = checkAndHandleTimeoutTasks(generateConfig.task.timeoutSeconds);
    if (timeoutTasks.length > 0) {
      console.log('Timeout tasks:', timeoutTasks.map(t => t.id));
    }
    
    const tasks = getAllTasks();
    const processingTasks = tasks.filter(
      task => task.status === 'processing'
    );

    for (const task of processingTasks) {
      if (!task.generationTaskId) continue;

      try {
        const response = await fetch(`/api/comfyui/status/${task.generationTaskId}`);
        const result = await response.json();

        console.log(`[Task ${task.id}] Status check response:`, {
          ok: response.ok,
          status: response.status,
          result,
        });

        // 如果返回错误状态码（404、500等）或任务不存在，标记为失败
        if (!response.ok || !result.success) {
          const errorMsg = result.error || (response.status === 404 ? '任务不存在或已被删除' : `服务器错误 (${response.status})`);
          console.error(`[Task ${task.id}] Failed:`, errorMsg);
          updateTask(task.id, {
            status: 'failed',
            error: errorMsg,
          });
          continue;
        }

        if (result.status === 'completed') {
          const rawVideoPath = result.videoPath || (result.outputFiles?.[0]?.path);
          
          console.log(`[Task ${task.id}] Completed! Raw video path:`, rawVideoPath);
          console.log(`[Task ${task.id}] Output files:`, result.outputFiles);
          
          const videoProxyUrl = convertToProxyUrl(rawVideoPath);
          
          console.log(`[Task ${task.id}] Converted video URL:`, videoProxyUrl);
          
          if (!videoProxyUrl) {
            console.error(`[Task ${task.id}] Failed to convert video path, marking as failed`);
            updateTask(task.id, {
              status: 'failed',
              error: '无法解析视频路径',
            });
            continue;
          }
          
          updateTask(task.id, {
            status: 'completed',
            videoUrl: videoProxyUrl,
            thumbnail: DEFAULT_THUMBNAIL,
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
  }, [loadWorks, convertToProxyUrl]);

  // 页面加载时：只做状态同步，不主动清理任何任务
  const validateAndCleanupTasks = useCallback(async () => {
    const tasks = getAllTasks();
    
    // pending 任务不动，保持原样（可能正在上传中或排队中）
    
    // processing 任务：有 generationTaskId 的去查 ComfyUI 真实状态
    const processingTasks = tasks.filter(t => t.status === 'processing' && t.generationTaskId);
    
    for (const task of processingTasks) {
      try {
        const response = await fetch(`/api/comfyui/status/${task.generationTaskId}`);
        const result = await response.json();
        
        if (!response.ok || !result.success || result.status === 'failed') {
          console.log(`Task ${task.id} failed in ComfyUI, marking as failed`);
          updateTask(task.id, {
            status: 'failed',
            error: result.error || (response.status === 404 ? '任务不存在或已被删除' : `服务器错误 (${response.status})`),
          });
        } else if (result.status === 'completed') {
          const rawVideoPath = result.videoPath || (result.outputFiles?.[0]?.path);
          const videoProxyUrl = convertToProxyUrl(rawVideoPath);
          updateTask(task.id, {
            status: 'completed',
            videoUrl: videoProxyUrl,
            thumbnail: DEFAULT_THUMBNAIL,
          });
        }
        // processing 状态保持不变
      } catch (error) {
        console.error(`Error checking task ${task.id}:`, error);
        // 连接失败也不标记失败，等下次轮询再查
      }
    }

    // 重新加载数据
    loadWorks();
  }, [loadWorks, convertToProxyUrl]);

  // 初始加载和定时检查
  useEffect(() => {
    // 首次加载时验证任务状态
    validateAndCleanupTasks();

    // 按配置的间隔检查进行中的任务
    const interval = setInterval(() => {
      checkPendingTasks();
    }, generateConfig.task.pollIntervalMs);

    return () => clearInterval(interval);
  }, [validateAndCleanupTasks, checkPendingTasks]);

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
        return '生成中...';
      case 'pending':
        return '排队中...';
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
        return '#DAB2FF';
      case 'pending':
        return '#888888';
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
          <div className="shrink-0 flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <div>
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
                {pendingCount > 0 && (
                  <span style={{ marginLeft: '16px', color: '#DAB2FF' }}>
                    · 队列中有 {pendingCount} 个任务等待处理
                  </span>
                )}
              </p>
            </div>
            
            {/* 调试按钮（仅开发环境显示） */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).debugTasks) {
                    (window as any).debugTasks();
                    alert('任务详情已输出到浏览器控制台（按 F12 查看）');
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2a2a2a',
                  color: '#DAB2FF',
                  border: '1px solid #DAB2FF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'Source Han Sans CN, sans-serif',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#DAB2FF';
                  e.currentTarget.style.color = '#121212';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                  e.currentTarget.style.color = '#DAB2FF';
                }}
              >
                🔍 查看任务详情
              </button>
            )}
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
                  {/* 作品预览：成功且有视频用 video 预览第一帧，否则用封面图 */}
                  {work.status === 'completed' && work.videoUrl ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={work.videoUrl}
                      muted
                      preload="metadata"
                      style={{ backgroundColor: '#2a2a2a' }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${work.thumbnail || '/images/default-thumbnail.png'})`,
                        backgroundColor: '#2a2a2a',
                      }}
                    />
                  )}

                  {/* 状态遮罩层（进行中/失败） */}
                  {work.status !== 'completed' && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                      }}
                      title={work.error || ''} // 鼠标悬停显示完整错误
                    >
                      <div className="text-center px-2">
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
                        {/* 显示错误详情 */}
                        {work.status === 'failed' && work.error && (
                          <p
                            style={{
                              fontFamily: 'Source Han Sans CN, sans-serif',
                              fontSize: '12px',
                              color: '#ff6b6b',
                              marginTop: '4px',
                              maxWidth: '180px',
                              wordBreak: 'break-word',
                            }}
                          >
                            {work.error}
                          </p>
                        )}
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
