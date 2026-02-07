import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ styleName: string }> }
) {
  try {
    const { styleName } = await params;
    const decodedStyleName = decodeURIComponent(styleName);
    
    const templateDir = path.join(process.cwd(), 'public', 'template', decodedStyleName);
    
    // 检查目录是否存在
    try {
      const dirStat = await stat(templateDir);
      if (!dirStat.isDirectory()) {
        return NextResponse.json(
          { error: 'Style not found' },
          { status: 404 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Style not found' },
        { status: 404 }
      );
    }
    
    // 读取目录内的所有图片文件
    const files = await readdir(templateDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .map(file => `/template/${encodeURIComponent(decodedStyleName)}/${encodeURIComponent(file)}`);
    
    return NextResponse.json({
      styleName: decodedStyleName,
      images,
      imageCount: images.length,
    });
  } catch (error) {
    console.error('Error reading style images:', error);
    return NextResponse.json(
      { error: 'Failed to read style images' },
      { status: 500 }
    );
  }
}
