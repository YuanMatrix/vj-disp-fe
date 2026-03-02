const puppeteer = require('puppeteer-core');

(async () => {
  // 常见的 macOS Chrome 路径
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ];
  
  // 找到可用的浏览器
  const fs = require('fs');
  let executablePath = null;
  for (const path of chromePaths) {
    if (fs.existsSync(path)) {
      executablePath = path;
      console.log(`找到浏览器: ${path}`);
      break;
    }
  }
  
  if (!executablePath) {
    console.error('未找到可用的浏览器，请确保安装了 Chrome、Chromium 或 Edge');
    process.exit(1);
  }
  
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // 从命令行参数获取 URL 和输出文件名
  const url = process.argv[2] || 'http://localhost:3001/select?song=demo1.flac&title=%E5%BD%A9%E4%BA%91%E8%BF%BD%E6%9C%88&duration=180';
  const outputFile = process.argv[3] || 'screenshot-select.png';
  
  console.log('正在访问 ' + url + '...');
  await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  console.log('等待页面完全加载...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('正在截图...');
  await page.screenshot({ 
    path: outputFile,
    fullPage: true 
  });
  
  console.log(`截图已保存为 ${outputFile}`);
  
  await browser.close();
})().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
