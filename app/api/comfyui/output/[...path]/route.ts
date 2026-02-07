import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

// ComfyUI 输出目录的基础路径
const COMFYUI_OUTPUT_BASE = process.env.COMFYUI_OUTPUT_BASE || '/Users/coco/coco-code/ComfyUI/output';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filePath = path.join(COMFYUI_OUTPUT_BASE, ...pathSegments);

    console.log('Serving file:', filePath);

    // 安全检查：确保路径在输出目录内
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(COMFYUI_OUTPUT_BASE);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 检查文件是否存在
    try {
      await stat(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // 读取文件
    const fileBuffer = await readFile(filePath);
    
    // 根据扩展名设置 Content-Type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.webm':
        contentType = 'video/webm';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
