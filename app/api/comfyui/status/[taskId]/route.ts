import { NextRequest, NextResponse } from 'next/server';

const COMFYUI_API_BASE = process.env.COMFYUI_API_BASE || 'http://localhost:5002/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId' },
        { status: 400 }
      );
    }

    // 查询 ComfyUI 任务状态
    const response = await fetch(`${COMFYUI_API_BASE}/tasks/${taskId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ComfyUI status error:', errorText);
      return NextResponse.json(
        { error: `ComfyUI status check failed: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // API 返回格式: {"success": true, "task": {...}}
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Unknown error' },
        { status: 400 }
      );
    }

    const taskStatus = result.task;

    // 转换为前端格式
    return NextResponse.json({
      success: true,
      status: taskStatus.status, // 'pending', 'processing', 'completed', 'failed'
      progress: taskStatus.progress,
      videoPath: taskStatus.video_path,
      outputFiles: taskStatus.output_files,
      elapsedSeconds: taskStatus.elapsed_seconds,
      error: taskStatus.error,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}
