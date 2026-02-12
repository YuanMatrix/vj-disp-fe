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
  const [canGoBackground, setCanGoBackground] = useState(false); // 准备完成后才允许后台运行
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

  // 截取音频片段
  const trimAudio = useCallback(async (
    audioPath: string,
    startTime: number,
    endTime: number
  ): Promise<Blob> => {
    try {
      console.log(`Trimming audio: ${audioPath} from ${startTime}s to ${endTime}s`);
      
      // 获取音频文件
      const response = await fetch(audioPath);
      const arrayBuffer = await response.arrayBuffer();
      
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`Original audio: ${audioBuffer.duration.toFixed(2)}s, sampleRate: ${audioBuffer.sampleRate}`);
      
      // 计算截取的样本范围
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const duration = endSample - startSample;
      
      console.log(`Sample range: ${startSample} to ${endSample}, duration: ${duration} samples (${(duration/sampleRate).toFixed(2)}s)`);
      
      // 边界检查
      if (startSample < 0 || endSample > audioBuffer.length || startSample >= endSample) {
        throw new Error(`无效的截取范围: ${startTime}s - ${endTime}s`);
      }
      
      // 创建新的音频缓冲区
      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        duration,
        sampleRate
      );
      
      // 复制音频数据
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel);
        const targetData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < duration; i++) {
          targetData[i] = sourceData[startSample + i];
        }
      }
      
      console.log(`Trimmed buffer created: ${trimmedBuffer.duration.toFixed(2)}s`);
      
      // 将音频缓冲区转换为 WAV Blob
      const wavBlob = await audioBufferToWav(trimmedBuffer);
      
      console.log(`Audio trimmed successfully: ${wavBlob.size} bytes`);
      return wavBlob;
      
    } catch (error) {
      console.error('Error trimming audio:', error);
      throw error;
    }
  }, []);

  // 将 AudioBuffer 转换为 WAV Blob
  const audioBufferToWav = useCallback((buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const numberOfChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;
      
      const bytesPerSample = bitDepth / 8;
      const blockAlign = numberOfChannels * bytesPerSample;
      
      const data = [];
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = buffer.getChannelData(channel)[i];
          const int16 = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
          data.push(int16 < 0 ? int16 + 0x10000 : int16);
        }
      }
      
      const dataLength = data.length * bytesPerSample;
      const arrayBuffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(arrayBuffer);
      
      // WAV 文件头
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(36, 'data');
      view.setUint32(40, dataLength, true);
      
      // 写入音频数据
      let offset = 44;
      for (let i = 0; i < data.length; i++) {
        view.setInt16(offset, data[i], true);
        offset += 2;
      }
      
      resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
    });
  }, []);

  // 上传 Blob 到 ComfyUI
  const uploadAudioBlob = useCallback(async (
    blob: Blob,
    taskId: string
  ): Promise<string | null> => {
    try {
      const fileName = `trimmed_${taskId}.wav`;
      const file = new File([blob], fileName, { type: 'audio/wav' });

      console.log(`Uploading trimmed audio: ${fileName}, size: ${file.size}`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);
      formData.append('fileType', 'audio');

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
      console.error('Error uploading audio blob:', error);
      throw error;
    }
  }, []);

  // 处理图片：缩放并裁剪到 480x300（宽x高）
  // 1. 按覆盖策略缩放，确保宽>=480且高>=300
  // 2. 居中裁剪到 480x300
  const processImage = useCallback(async (
    imagePath: string,
    targetWidth: number,   // 目标宽度 480
    targetHeight: number   // 目标高度 300
  ): Promise<Blob> => {
    try {
      console.log(`Processing image: ${imagePath}`);
      
      // 加载图片
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = imagePath;
      });
      
      console.log(`Original size: ${img.width}x${img.height} (宽x高)`);
      
      // 步骤1：覆盖缩放 - 取较大的缩放比，确保两个方向都够大
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const scaledWidth = Math.round(img.width * scale);
      const scaledHeight = Math.round(img.height * scale);
      
      console.log(`Step1 覆盖缩放 (scale=${scale.toFixed(4)}): ${scaledWidth}x${scaledHeight} (宽x高)`);
      
      // 创建 canvas 进行缩放
      const scaleCanvas = document.createElement('canvas');
      scaleCanvas.width = scaledWidth;
      scaleCanvas.height = scaledHeight;
      const scaleCtx = scaleCanvas.getContext('2d');
      
      if (!scaleCtx) {
        throw new Error('无法创建 canvas context');
      }
      
      scaleCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      
      // 步骤2：居中裁剪到目标尺寸 480x300
      const cropX = Math.max(0, Math.floor((scaledWidth - targetWidth) / 2));
      const cropY = Math.max(0, Math.floor((scaledHeight - targetHeight) / 2));
      
      console.log(`Step2 居中裁剪到 ${targetWidth}x${targetHeight}: cropX=${cropX}, cropY=${cropY}`);
      
      // 创建最终的 canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const finalCtx = finalCanvas.getContext('2d');
      
      if (!finalCtx) {
        throw new Error('无法创建最终 canvas context');
      }
      
      finalCtx.drawImage(
        scaleCanvas,
        cropX, cropY, targetWidth, targetHeight,
        0, 0, targetWidth, targetHeight
      );
      
      // 转换为 Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('无法转换为 Blob'));
        }, 'image/jpeg', 0.95);
      });
      
      console.log(`最终图片: ${targetWidth}x${targetHeight} (宽x高), ${blob.size} bytes`);
      return blob;
      
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }, []);

  // 上传处理后的图片 Blob
  const uploadImageBlob = useCallback(async (
    blob: Blob,
    taskId: string,
    index: number
  ): Promise<string | null> => {
    try {
      const fileName = `processed_${taskId}_${index}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      console.log(`Uploading processed image: ${fileName}, size: ${file.size}`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);
      formData.append('fileType', 'image');

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
      console.error('Error uploading image blob:', error);
      throw error;
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
  }, [router, songTitle, videoUrl]);

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
    setCanGoBackground(false); // 准备阶段不允许离开

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
      
      // 步骤 1: 上传音频参数（包含截取信息）
      setStatusText('正在准备音频...');
      
      // 构建音频文件路径（通过 API 路由访问）
      const audioPath = `/api/music/${encodeURIComponent(fileName)}`;
      console.log('Audio file path:', audioPath, 'fileName:', fileName);
      
      const startTimeSec = parseFloat(startTime);
      const endTimeSec = parseFloat(endTime);
      
      console.log('========== 音频截取参数 ==========');
      console.log('开始时间 (startTime):', startTimeSec, '秒');
      console.log('结束时间 (endTime):', endTimeSec, '秒');
      console.log('片段时长:', endTimeSec - startTimeSec, '秒');
      console.log('================================');
      
      setStatusText('正在截取音频...');
      
      // 截取音频
      const audioBlob = await trimAudio(audioPath, startTimeSec, endTimeSec);
      
      setStatusText('正在上传音频...');
      
      // 上传截取后的音频
      const uploadedAudioPath = await uploadAudioBlob(audioBlob, taskId);
      
      if (!uploadedAudioPath) {
        throw new Error('音频上传失败');
      }

      updateTask(taskId, { audioPath: uploadedAudioPath });
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

      setStatusText('正在处理风格图片...');
      
      // 上传图片（根据配置限制数量）
      const imagesToUpload = styleImages.slice(0, maxCount);
      const uploadedImages: string[] = [];
      
      // 图片处理参数：裁剪到 480x300（宽x高）
      const imgTargetWidth = 480;
      const imgTargetHeight = 300;
      
      console.log(`Processing images: target ${imgTargetWidth}x${imgTargetHeight} (宽x高)`);
      
      for (let i = 0; i < imagesToUpload.length; i++) {
        const imagePath = imagesToUpload[i];
        
        // 处理图片
        setStatusText(`正在处理图片 ${i + 1}/${imagesToUpload.length}...`);
        const processedBlob = await processImage(imagePath, imgTargetWidth, imgTargetHeight);
        
        // 上传处理后的图片
        const uploadedPath = await uploadImageBlob(processedBlob, taskId, i);
        if (uploadedPath) {
          uploadedImages.push(uploadedPath);
        }
        const progressRange = generateConfig.progress.afterImageUpload - generateConfig.progress.afterAudioUpload;
        setProgress(generateConfig.progress.afterAudioUpload + Math.floor((i + 1) / imagesToUpload.length * progressRange));
      }

      if (uploadedImages.length === 0) {
        throw new Error('图片上传失败');
      }

      // 固定输出尺寸：宽度480，高度300
      const outputWidth = 480;
      const outputHeight = 300;
      
      // 构建生成参数
      const generateParams = {
        audioPath: uploadedAudioPath,
        images: uploadedImages,
        numFrames: Math.round((parseFloat(endTime) - parseFloat(startTime)) * generateConfig.video.fps),
        width: outputWidth,
        height: outputHeight,
        fps: generateConfig.video.fps,
      };

      updateTask(taskId, { images: uploadedImages });
      setProgress(generateConfig.progress.afterImageUpload);

      // 步骤 3: 提交到 ComfyUI
      setStatusText('正在启动视频生成...');
      
      const generateResponse = await fetch('/api/comfyui/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateParams),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || '生成请求失败');
      }

      const generateResult = await generateResponse.json();
      const generationTaskId = generateResult.taskId;

      updateTask(taskId, { status: 'processing', generationTaskId });

      setProgress(generateConfig.progress.afterGenerateStart);
      setStatusText('正在生成画面...');
      setCanGoBackground(true); // 已提交到 ComfyUI，可以后台运行了

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
            
            {/* 后台运行按钮 - 准备完成后才显示 */}
            {canGoBackground && (
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
            )}
            
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
