/**
 * 任务调试工具
 * 在浏览器控制台中使用以查看任务详情
 */

// 在浏览器控制台中运行以下命令：
// window.debugTasks()

if (typeof window !== 'undefined') {
  (window as any).debugTasks = () => {
    const tasksJson = localStorage.getItem('video_tasks');
    if (!tasksJson) {
      console.log('没有找到任务数据');
      return;
    }
    
    const tasks = JSON.parse(tasksJson);
    console.log(`共有 ${tasks.length} 个任务`);
    console.table(tasks.map((task: any) => ({
      id: task.id.substring(0, 20) + '...',
      title: task.title,
      status: task.status,
      comfyuiTaskId: task.comfyuiTaskId?.substring(0, 20) + '...' || 'N/A',
      hasVideo: !!task.videoUrl,
      videoUrl: task.videoUrl?.substring(0, 50) + '...' || 'N/A',
      error: task.error || 'N/A',
      createdAt: new Date(task.createdAt).toLocaleString('zh-CN'),
    })));
    
    // 详细信息
    console.log('完整任务数据：');
    tasks.forEach((task: any, index: number) => {
      console.group(`任务 ${index + 1}: ${task.title}`);
      console.log('ID:', task.id);
      console.log('状态:', task.status);
      console.log('ComfyUI 任务ID:', task.comfyuiTaskId || 'N/A');
      console.log('视频URL:', task.videoUrl || 'N/A');
      console.log('缩略图:', task.thumbnail);
      console.log('错误:', task.error || 'N/A');
      console.log('创建时间:', new Date(task.createdAt).toLocaleString('zh-CN'));
      if (task.updatedAt) {
        console.log('更新时间:', new Date(task.updatedAt).toLocaleString('zh-CN'));
      }
      console.groupEnd();
    });
    
    return tasks;
  };
  
  // 检查特定任务状态
  (window as any).checkTaskStatus = async (comfyuiTaskId: string) => {
    try {
      console.log(`检查任务状态: ${comfyuiTaskId}`);
      const response = await fetch(`/api/comfyui/status/${comfyuiTaskId}`);
      const result = await response.json();
      
      console.log('响应状态:', response.status);
      console.log('响应数据:', result);
      
      if (result.success) {
        console.log('任务状态:', result.status);
        console.log('进度:', result.progress);
        console.log('视频路径:', result.videoPath);
        console.log('输出文件:', result.outputFiles);
        console.log('已用时间:', result.elapsedSeconds, '秒');
        if (result.error) {
          console.error('错误信息:', result.error);
        }
      } else {
        console.error('请求失败:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('检查失败:', error);
    }
  };
  
  console.log('✅ 调试工具已加载！');
  console.log('使用 window.debugTasks() 查看所有任务');
  console.log('使用 window.checkTaskStatus("任务ID") 检查特定任务状态');
}

export {};
