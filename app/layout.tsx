import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIGC音乐创作平台 - 将您的音乐转变为VJ画面",
  description: "AIGC沉浸式音乐空间，通过人工智能将音乐转换为精美的VJ视觉画面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
