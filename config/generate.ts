/**
 * 视频生成相关配置
 * 可以在这里修改默认参数
 */

export const generateConfig = {
  // 视频输出尺寸配置
  video: {
    maxSize: 1024,          // 视频最长边（px）
    defaultWidth: 960,     // 默认宽度
    defaultHeight: 600,    // 默认高度
    fps: 16,                // 帧率
  },
  
  // 风格图片数量限制
  styleImages: {
    // 最少需要的图片数量
    minCount: 4,
    
    // 最多使用的图片数量
    maxCount: 10,
  },
  
  // 任务相关配置
  task: {
    // 任务超时时间（秒）- 超过此时间任务会被标记为失败
    timeoutSeconds: 36000, // 10小时
    
    // 轮询间隔（毫秒）
    pollIntervalMs: 5000, // 5秒
    
    // 错误提示显示时间（毫秒）
    errorDisplayMs: 5000,
  },
  
  // 进度条相关配置
  progress: {
    // 上传音频后的进度
    afterAudioUpload: 15,
    
    // 上传图片后的进度
    afterImageUpload: 30,
    
    // 开始生成后的进度
    afterGenerateStart: 35,
    
    // 预计生成时间（秒）- 用于显示预估
    estimatedTimeSeconds: 360,
  },
};

// 导出类型，方便其他地方使用
export type GenerateConfig = typeof generateConfig;
