import { writeFile, mkdir, access } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { constants } from 'fs';

// 音乐文件存储到 data/music（持久目录，不受 build 影响）
const MUSIC_DIR = path.join(process.cwd(), 'data', 'music');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '没有选择文件' },
        { status: 400 }
      );
    }

    // 检查文件格式
    const fileName = file.name;
    const fileExt = path.extname(fileName).toLowerCase();
    
    if (!['.flac', '.mp3'].includes(fileExt)) {
      return NextResponse.json(
        { error: '只支持 flac 和 mp3 格式' },
        { status: 400 }
      );
    }

    // 获取文件缓冲区
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 确保 data/music 文件夹存在
    try {
      await access(MUSIC_DIR, constants.F_OK);
    } catch {
      await mkdir(MUSIC_DIR, { recursive: true });
    }

    // 处理文件名重名问题
    let finalFileName = fileName;
    const fileBaseName = path.basename(fileName, fileExt);
    let filePath = path.join(MUSIC_DIR, finalFileName);
    
    // 检查文件是否存在，如果存在则添加日期
    try {
      await access(filePath, constants.F_OK);
      // 文件存在，添加日期
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
      finalFileName = `${fileBaseName}_${dateStr}_${timeStr}${fileExt}`;
      filePath = path.join(MUSIC_DIR, finalFileName);
    } catch {
      // 文件不存在，使用原文件名
    }

    // 保存文件到 data/music
    await writeFile(filePath, buffer);
    
    return NextResponse.json(
      { 
        success: true,
        fileName: finalFileName,
        message: '文件上传成功'
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}
