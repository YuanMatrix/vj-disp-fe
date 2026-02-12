'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  generateTaskId, 
  addTask, 
  updateTask, 
  VideoTask,
  DEFAULT_THUMBNAIL,
  hasRunningTask,
  getNextPendingTask,
  getPendingTaskCount,
} from '@/data/tasks';
import { generateConfig } from '@/config/generate';

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
  const [statusText, setStatusText] = useState('正在准备...');
  const [estimatedTime, setEstimatedTime] = useState(generateConfig.progress.estimatedTimeSeconds);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 错误弹窗
  
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

  // 获取选中风格的图片列表
  const getStyleImages = useCallback(async (styleName: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/templates/${encodeURIComponent(styleName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch style images');
      }
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('Error fetching style images:', error);
      return [];
    }
  }, []);

  // 上传文件到 ComfyUI
  const uploadFile = useCallback(async (
    filePath: string, 
    taskId: string, 
    fileType: 'audio' | 'image'
  ): Promise<string | null> => {
    try {
      // 首先获取文件内容
      console.log(`Fetching file: ${filePath}`);
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`无法获取文件: ${filePath} (HTTP ${response.status})`);
      }
      
      const blob = await response.blob();
      const localFileName = filePath.split('/').pop() || 'file';
      const file = new File([blob], localFileName, { type: blob.type });

      console.log(`Uploading ${fileType}: ${localFileName}, size: ${file.size}`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);
      formData.append('fileType', fileType);

      const uploadResponse = await fetch('/api/comfyui/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        throw new Error(result.error || `上传失败 (HTTP ${uploadResponse.status})`);
      }

      return result.relativePath;
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      throw error; // 重新抛出错误以便上层捕获
    }
  }, []);

  // 检查并启动下一个待处理任务（在当前页面不执行，由 works 页面处理）
  const checkAndStartNextTask = useCallback(() => {
    const nextTask = getNextPendingTask();
    if (nextTask) {
      console.log('Queue has pending task:', nextTask.id);
      // 这里不自动启动，让用户在 works 页面查看
    }
  }, []);

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (generationTaskId: string, localTaskId: string) => {
    const maxWaitSeconds = generateConfig.task.timeoutSeconds; // 最多等待 1 小时
    const startTime = Date.now();
    
    const poll = async () => {
      if ((Date.now() - startTime) / 1000 > maxWaitSeconds) {
        updateTask(localTaskId, { 
          status: 'failed', 
          error: '任务超时（超过1小时）' 
        });
        setIsGenerating(false);
        // 检查并启动下一个待处理任务
        checkAndStartNextTask();
        return;
      }

      try {
        const response = await fetch(`/api/comfyui/status/${generationTaskId}`);
        const result = await response.json();

        // 如果返回错误状态码（404、500等）或任务不存在，直接标记为失败
        if (!response.ok || !result.success) {
          const errorMsg = result.error || (response.status === 404 ? '任务不存在或已被删除' : `服务器错误 (${response.status})`);
          updateTask(localTaskId, {
            status: 'failed',
            error: errorMsg,
          });
          setIsGenerating(false);
          setStatusText(`错误: ${errorMsg}`);
          checkAndStartNextTask();
          return;
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const estimatedTotal = generateConfig.progress.estimatedTimeSeconds;
        const newProgress = Math.min(95, Math.floor((elapsed / estimatedTotal) * 100));
        setProgress(newProgress);
        setEstimatedTime(Math.max(0, estimatedTotal - Math.floor(elapsed)));

        if (result.status === 'completed') {
          // 生成完成
          const rawVideoPath = result.videoPath || (result.outputFiles?.[0]?.path);
          
          // 将 ComfyUI 绝对路径转换为代理 API URL
          // 例如: /Users/coco/coco-code/ComfyUI/output/vj/xxx.mp4 -> /api/comfyui/output/vj/xxx.mp4
          // 或: C:\Users\...\ComfyUI\output\vj\xxx.mp4 -> /api/comfyui/output/vj/xxx.mp4
          const convertToProxyUrl = (absolutePath: string) => {
            if (!absolutePath) return '';
            
            // 处理 Unix 路径
            const outputIndex = absolutePath.indexOf('/output/');
            if (outputIndex !== -1) {
              const relativePath = absolutePath.substring(outputIndex + 8); // 8 = '/output/'.length
              return `/api/comfyui/output/${relativePath}`;
            }
            
            // 处理 Windows 路径
            const outputIndexWin = absolutePath.indexOf('\\output\\');
            if (outputIndexWin !== -1) {
              const relativePath = absolutePath.substring(outputIndexWin + 8).replace(/\\/g, '/');
              return `/api/comfyui/output/${relativePath}`;
            }
            
            return absolutePath;
          };
          
          const videoProxyUrl = convertToProxyUrl(rawVideoPath);
          // 使用默认封面图（ComfyUI 可能不生成缩略图）
          // 后续可以通过 ffmpeg 从视频提取第一帧作为缩略图
          
          updateTask(localTaskId, {
            status: 'completed',
            videoUrl: videoProxyUrl,
            thumbnail: DEFAULT_THUMBNAIL,
          });

          setProgress(100);
          setStatusText('生成完成！');
          
          setTimeout(() => {
            // 跳转到 generate 页面播放
            const params = new URLSearchParams();
            params.set('title', songTitle);
            params.set('video', videoProxyUrl || videoUrl);
            params.set('taskId', localTaskId);
            router.push(`/generate?${params.toString()}`);
          }, 1000);
        } else if (result.status === 'failed') {
          updateTask(localTaskId, {
            status: 'failed',
            error: result.error || '生成失败',
          });
          setIsGenerating(false);
          setStatusText('生成失败');
          // 检查并启动下一个待处理任务
          checkAndStartNextTask();
        } else {
          // 继续轮询
          setStatusText(result.status === 'processing' ? '正在生成画面...' : '等待处理...');
          setTimeout(poll, generateConfig.task.pollIntervalMs); // 每 5 秒检查一次
        }
      } catch (error) {
        console.error('Poll error:', error);
        // 继续轮询，除非超过最大等待时间
        setTimeout(poll, generateConfig.task.pollIntervalMs);
      }
    };

    poll();
  }, [router, songTitle, videoUrl, checkAndStartNextTask]);

  const handlePrev = () => {
    setStartIndex(Math.max(0, startIndex - 1));
  };

  const handleNext = () => {
    setStartIndex(Math.min(maxStartIndex, startIndex + 1));
  };

  const handleGenerate = async () => {
    if (!selectedStyle) {
      return;
    }
    
    setProgress(0);
    setEstimatedTime(generateConfig.progress.estimatedTimeSeconds);
    setStatusText('正在准备...');
    setIsGenerating(true);

    const taskId = generateTaskId();

    // 创建任务记录
    const newTask: VideoTask = {
      id: taskId,
      title: songTitle,
      style: selectedStyle,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnail: DEFAULT_THUMBNAIL,
    };
    addTask(newTask);

    try {
      // 步骤 1: 上传音频文件
      setStatusText('正在上传音频...');
      setProgress(5);
      
      // 构建音频文件路径
      const audioPath = `/music/${fileName}`;
      console.log('Audio file path:', audioPath, 'fileName:', fileName);
      
      const uploadedAudioPath = await uploadFile(audioPath, taskId, 'audio');
      
      if (!uploadedAudioPath) {
        throw new Error('音频上传失败');
      }

      updateTask(taskId, { audioPath: uploadedAudioPath, status: 'processing' });
      setProgress(generateConfig.progress.afterAudioUpload);

      // 步骤 2: 获取并上传风格图片
      setStatusText('正在检查风格图片...');
      
      const styleImages = await getStyleImages(selectedStyle);
      
      // 检查图片数量是否在配置范围内
      const { minCount, maxCount } = generateConfig.styleImages;
      if (styleImages.length < minCount || styleImages.length > maxCount) {
        const errorMsg = styleImages.length < minCount 
          ? `风格「${selectedStyle}」只有 ${styleImages.length} 张图片，需要至少 ${minCount} 张图片才能生成视频`
          : `风格「${selectedStyle}」有 ${styleImages.length} 张图片，最多只能使用 ${maxCount} 张图片`;
        
        // 取消任务
        updateTask(taskId, { status: 'failed', error: errorMsg });
        setIsGenerating(false);
        setErrorMessage(errorMsg);
        return;
      }

      setStatusText('正在上传风格图片...');
      
      // 上传图片（根据配置限制数量）
      const imagesToUpload = styleImages.slice(0, maxCount);
      const uploadedImages: string[] = [];
      
      // 固定输出尺寸：长宽比 1.6:1（高:宽），高度 480
      const outputHeight = 480;
      const outputWidth = Math.round(outputHeight / 1.6); // 480 / 1.6 = 300
      
      console.log(`Output resolution: ${outputWidth}x${outputHeight} (aspect ratio 1.6:1)`);
      
      for (let i = 0; i < imagesToUpload.length; i++) {
        const imagePath = imagesToUpload[i];
        const uploadedPath = await uploadFile(imagePath, taskId, 'image');
        if (uploadedPath) {
          uploadedImages.push(uploadedPath);
        }
        const progressRange = generateConfig.progress.afterImageUpload - generateConfig.progress.afterAudioUpload;
        setProgress(generateConfig.progress.afterAudioUpload + Math.floor((i + 1) / imagesToUpload.length * progressRange));
      }

      if (uploadedImages.length === 0) {
        throw new Error('图片上传失败');
      }

      updateTask(taskId, { images: uploadedImages });
      setProgress(generateConfig.progress.afterImageUpload);

      // 步骤 3: 启动视频生成
      setStatusText('正在启动视频生成...');
      
      const generateResponse = await fetch('/api/comfyui/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioPath: uploadedAudioPath,
          images: uploadedImages,
          numFrames: Math.round((parseFloat(endTime) - parseFloat(startTime)) * generateConfig.video.fps), // 秒数 * fps
          width: outputWidth,
          height: outputHeight,
          fps: generateConfig.video.fps,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || '生成请求失败');
      }

      const generateResult = await generateResponse.json();
      const generationTaskId = generateResult.taskId;

      updateTask(taskId, { generationTaskId });
      setProgress(generateConfig.progress.afterGenerateStart);
      setStatusText('正在生成画面...');

      // 步骤 4: 轮询任务状态
      pollTaskStatus(generationTaskId, taskId);

    } catch (error) {
      console.error('Generate error:', error);
      updateTask(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误',
      });
      setStatusText(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => {
        setIsGenerating(false);
      }, generateConfig.task.errorDisplayMs);
    }
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
      
      {/* 错误弹窗 */}
      {errorMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
          <div 
            className="flex flex-col items-center"
            style={{
              padding: '40px 60px',
              background: 'rgba(18, 18, 18, 0.95)',
              borderRadius: '24px',
              maxWidth: '500px',
            }}
          >
            {/* 警告图标 */}
            <div className="text-5xl mb-4">⚠️</div>
            
            {/* 标题 */}
            <h2
              className="text-white font-bold text-center"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '24px',
                marginBottom: '16px',
              }}
            >
              图片数量不符合要求
            </h2>
            
            {/* 错误信息 */}
            <p
              className="text-center"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '16px',
                color: '#929292',
                marginBottom: '12px',
                lineHeight: '1.6',
              }}
            >
              {errorMessage}
            </p>
            
            {/* 要求说明 */}
            <p
              className="text-center"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '14px',
                color: '#DAB2FF',
                marginBottom: '30px',
              }}
            >
              生成视频需要 4-10 张风格图片
            </p>
            
            {/* 确定按钮 */}
            <button
              onClick={() => setErrorMessage(null)}
              className="flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              style={{
                width: '120px',
                height: '48px',
                borderRadius: '24px',
                background: 'linear-gradient(90deg, #AD46FF 0%, #F6339A 100%)',
              }}
            >
              <span
                className="text-white font-bold"
                style={{
                  fontFamily: 'Source Han Sans CN, sans-serif',
                  fontSize: '18px',
                }}
              >
                确定
              </span>
            </button>
          </div>
        </div>
      )}
      
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
              {statusText}
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
                marginBottom: '30px',
              }}
            >
              预计时间 {estimatedTime} s
            </p>
            
            {/* 后台运行按钮 */}
            <button
              onClick={() => {
                setIsGenerating(false);
                router.push('/works');
              }}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                padding: '12px 32px',
                borderRadius: '24px',
                border: '2px solid #DAB2FF',
              }}
            >
              <span
                style={{
                  fontFamily: 'Source Han Sans CN, sans-serif',
                  fontSize: '16px',
                  color: '#DAB2FF',
                }}
              >
                后台运行，稍后查看
              </span>
            </button>
            
            <p
              className="text-center"
              style={{
                fontFamily: 'Source Han Sans CN, sans-serif',
                fontSize: '14px',
                color: '#666',
                marginTop: '12px',
              }}
            >
              任务将继续在后台运行，可在「我的作品」中查看进度
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
          <div className="flex justify-end">
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
