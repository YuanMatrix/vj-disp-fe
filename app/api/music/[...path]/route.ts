import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';

// 音乐文件存储目录
const MUSIC_DIR = path.join(process.cwd(), 'data', 'music');

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const relativePath = pathSegments.join('/');
    
    // 安全检查：防止路径遍历
    const normalizedPath = path.normalize(relativePath);
    if (normalizedPath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(MUSIC_DIR, decodeURIComponent(normalizedPath));
    
    // 检查文件是否存在
    try {
      await access(filePath, constants.R_OK);
    } catch {
      // 也检查 public/music（兼容旧的 demo 文件）
      const publicPath = path.join(process.cwd(), 'public', 'music', decodeURIComponent(normalizedPath));
      try {
        await access(publicPath, constants.R_OK);
        const data = await readFile(publicPath);
        const ext = path.extname(publicPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        return new NextResponse(data, {
          headers: {
            'Content-Type': contentType,
            'Content-Length': data.length.toString(),
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } catch {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
    }
    
    // 读取文件
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': data.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
    
  } catch (error) {
    console.error('Error serving music file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
