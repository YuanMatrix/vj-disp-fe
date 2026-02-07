import { NextRequest, NextResponse } from 'next/server';

const COMFYUI_API_BASE = process.env.COMFYUI_API_BASE || 'http://localhost:5002/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioPath, images, numFrames = 960, width = 384, height = 384, fps = 16 } = body;

    if (!audioPath || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing audioPath or images' },
        { status: 400 }
      );
    }

    // 发送生成请求到 ComfyUI
    const generateData = {
      audio_path: audioPath,
      num_frames: numFrames,
      width: width,
      height: height,
      fps: fps,
      images: images,
    };

    console.log('Sending generate request to ComfyUI:', generateData);

    const response = await fetch(`${COMFYUI_API_BASE}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ComfyUI generate error:', errorText);
      return NextResponse.json(
        { error: `ComfyUI generate failed: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      taskId: result.task_id,
      checkStatusUrl: result.check_status_url,
    });

  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Generate request failed' },
      { status: 500 }
    );
  }
}
