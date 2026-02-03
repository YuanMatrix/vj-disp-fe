import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const templateDir = path.join(process.cwd(), 'public', 'template');
    
    // 读取 template 目录下的所有文件夹
    const items = await readdir(templateDir);
    
    const templates = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(templateDir, item);
        const itemStat = await stat(itemPath);
        
        if (itemStat.isDirectory()) {
          // 读取文件夹内的图片
          const files = await readdir(itemPath);
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const images = files.filter(file => 
            imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
          );
          
          // 获取第一张图片作为封面
          const coverImage = images.length > 0 
            ? `/template/${encodeURIComponent(item)}/${encodeURIComponent(images[0])}`
            : null;
          
          return {
            name: item,
            imageCount: images.length,
            coverImage,
          };
        }
        return null;
      })
    );
    
    // 过滤掉非文件夹
    const validTemplates = templates.filter(t => t !== null);
    
    return NextResponse.json({ templates: validTemplates });
  } catch (error) {
    console.error('Error reading templates:', error);
    return NextResponse.json(
      { error: 'Failed to read templates' },
      { status: 500 }
    );
  }
}
