import { NextRequest, NextResponse } from 'next/server';

const COMFYUI_API_BASE = process.env.COMFYUI_API_BASE || 'http://localhost:5002/api';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string;
    const fileType = formData.get('fileType') as string; // 'audio' or 'image'

    if (!file || !taskId) {
      return NextResponse.json(
        { error: 'Missing file or taskId' },
        { status: 400 }
      );
    }

    // 创建 FormData 转发到 ComfyUI
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('task_id', taskId);

    // 根据文件类型选择正确的上传端点
    const uploadEndpoint = fileType === 'audio' 
      ? `${COMFYUI_API_BASE}/upload-audio`
      : `${COMFYUI_API_BASE}/upload-image`;

    // 转发到 ComfyUI upload API
    console.log(`Uploading to ComfyUI: ${uploadEndpoint}`);
    
    let response;
    try {
      response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: uploadFormData,
      });
    } catch (fetchError) {
      console.error('Failed to connect to ComfyUI:', fetchError);
      return NextResponse.json(
        { error: `无法连接到 ComfyUI 服务 (${COMFYUI_API_BASE})，请确保 ComfyUI 服务已启动` },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ComfyUI upload error:', errorText);
      return NextResponse.json(
        { error: `ComfyUI 上传失败: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      relativePath: result.relative_path,
      fullPath: result.full_path,
      taskId: taskId,
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `上传失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}
