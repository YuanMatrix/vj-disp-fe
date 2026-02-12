/**
 * 视频任务管理模块
 * 用于管理视频生成任务的状态和数据
 */

export const DEFAULT_THUMBNAIL = '/images/default-thumbnail.png';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VideoTask {
  id: string;
  title: string;
  style: string;
  status: TaskStatus;
  videoUrl?: string;
  thumbnail: string;
  createdAt: string;
  updatedAt?: string;
  error?: string;
  audioFile?: string;
  audioPath?: string;
  images?: string[];
  videoFile?: string;
  startTime?: number;
  endTime?: number;
  comfyuiTaskId?: string;
  generationTaskId?: string;
  // 生成参数（排队时保存，启动时使用）
  generateParams?: {
    audioPath: string;
    images: string[];
    numFrames: number;
    width: number;
    height: number;
    fps: number;
  };
}

// 本地存储的 key
const TASKS_STORAGE_KEY = 'video_tasks';
const TIMEOUT_MS = 60 * 60 * 1000; // 1小时超时

/**
 * 生成唯一的任务ID
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取所有任务
 */
export function getAllTasks(): VideoTask[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!tasksJson) return [];
    return JSON.parse(tasksJson);
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return [];
  }
}

/**
 * 保存所有任务
 */
function saveTasks(tasks: VideoTask[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks:', error);
  }
}

/**
 * 添加新任务
 */
export function addTask(task: VideoTask): void {
  const tasks = getAllTasks();
  tasks.unshift(task); // 添加到开头
  saveTasks(tasks);
}

/**
 * 更新任务
 */
export function updateTask(taskId: string, updates: Partial<VideoTask>): void {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveTasks(tasks);
  }
}

/**
 * 删除任务
 */
export function deleteTask(taskId: string): void {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);
}

/**
 * 获取任务
 */
export function getTask(taskId: string): VideoTask | undefined {
  const tasks = getAllTasks();
  return tasks.find(t => t.id === taskId);
}

/**
 * 检查是否有正在运行的任务
 */
export function hasRunningTask(): boolean {
  const tasks = getAllTasks();
  return tasks.some(t => t.status === 'processing');
}

/**
 * 获取下一个待处理任务
 */
export function getNextPendingTask(): VideoTask | undefined {
  const tasks = getAllTasks();
  return tasks.find(t => t.status === 'pending');
}

/**
 * 获取待处理任务数量
 */
export function getPendingTaskCount(): number {
  const tasks = getAllTasks();
  return tasks.filter(t => t.status === 'pending').length;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}分钟前`;
    }
    
    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    }
    
    // 小于7天
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }
    
    // 显示具体日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Failed to format date:', error);
    return isoString;
  }
}

/**
 * 检查并处理超时任务
 * @param timeoutSeconds 超时时间（秒），默认使用内置的 5 分钟超时
 * @returns 返回超时的任务数组
 */
export function checkAndHandleTimeoutTasks(timeoutSeconds?: number): VideoTask[] {
  const tasks = getAllTasks();
  const now = Date.now();
  const timeoutMs = timeoutSeconds ? timeoutSeconds * 1000 : TIMEOUT_MS;
  let hasChanges = false;
  const timeoutTasks: VideoTask[] = [];
  
  tasks.forEach(task => {
    if (task.status === 'processing') {
      const createdAt = new Date(task.createdAt).getTime();
      if (now - createdAt > timeoutMs) {
        task.status = 'failed';
        task.error = '任务超时';
        task.updatedAt = new Date().toISOString();
        hasChanges = true;
        timeoutTasks.push(task);
      }
    }
  });
  
  if (hasChanges) {
    saveTasks(tasks);
  }
  
  return timeoutTasks;
}

/**
 * 提交任务到 ComfyUI
 * @returns generationTaskId 或 null（失败时）
 */
export async function submitTaskToComfyUI(taskId: string): Promise<string | null> {
  const task = getTask(taskId);
  if (!task || !task.generateParams) {
    console.error(`Task ${taskId} not found or missing generateParams`);
    return null;
  }

  try {
    console.log(`[Queue] Submitting task ${taskId} to ComfyUI...`);
    
    const response = await fetch('/api/comfyui/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task.generateParams),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '生成请求失败');
    }

    const result = await response.json();
    const generationTaskId = result.taskId;

    updateTask(taskId, {
      status: 'processing',
      generationTaskId,
    });

    console.log(`[Queue] Task ${taskId} submitted, generationTaskId: ${generationTaskId}`);
    return generationTaskId;
  } catch (error) {
    console.error(`[Queue] Failed to submit task ${taskId}:`, error);
    updateTask(taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '提交任务失败',
    });
    return null;
  }
}

/**
 * 启动下一个排队中的任务
 * @returns 启动的任务和 generationTaskId，或 null
 */
export async function startNextPendingTask(): Promise<{ task: VideoTask; generationTaskId: string } | null> {
  // 检查是否有正在运行的任务
  if (hasRunningTask()) {
    console.log('[Queue] Already has a running task, skip');
    return null;
  }

  const nextTask = getNextPendingTask();
  if (!nextTask) {
    console.log('[Queue] No pending tasks in queue');
    return null;
  }

  console.log(`[Queue] Starting next pending task: ${nextTask.id}`);
  const generationTaskId = await submitTaskToComfyUI(nextTask.id);
  
  if (generationTaskId) {
    // 重新获取更新后的任务
    const updatedTask = getTask(nextTask.id);
    return updatedTask ? { task: updatedTask, generationTaskId } : null;
  }

  // 如果提交失败，递归尝试下一个
  return startNextPendingTask();
}

/**
 * 清空所有任务
 */
export function clearAllTasks(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TASKS_STORAGE_KEY);
}
