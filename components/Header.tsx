'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music2, Grid3x3, User } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  
  // 判断各导航项的选中状态
  const isStudioActive = ['/studio', '/select', '/style', '/generate'].some(path => pathname.startsWith(path)) || pathname === '/';
  const isTrainingActive = pathname.startsWith('/training');
  const isWorksActive = pathname.startsWith('/works');
  
  return (
    <header className="w-full h-20 bg-[#080808] fixed top-0 left-0 z-50">
      <div className="w-full h-full flex items-center justify-between max-w-[1920px] mx-auto" style={{ paddingLeft: '40px', paddingRight: '24px' }}>
        {/* Logo 区域 */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#AD46FF] to-[#F6339A] shadow-[0_10px_15px_-3px_rgba(173,70,255,0.5),0_4px_6px_-4px_rgba(173,70,255,0.5)] flex items-center justify-center">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-base font-normal leading-6 whitespace-nowrap" style={{ fontFamily: 'Arial' }}>
              AIGC音乐创作平台
            </span>
            <span className="text-[#DAB2FF] text-xs font-normal leading-4 whitespace-nowrap" style={{ fontFamily: 'Arial' }}>
              AIGC沉浸式音乐空间
            </span>
          </div>
        </Link>

        {/* 导航菜单 - 响应式flex布局 */}
        <nav className="flex items-center" style={{ gap: '14px' }}>
          <NavItem 
            href="/studio" 
            icon={<Music2 className="w-[19px] h-5 text-current" />} 
            label="创作空间"
            isActive={isStudioActive}
          />
          <NavItem 
            href="/training" 
            icon={<Grid3x3 className="w-5 h-5 text-current" />} 
            label="风格训练"
            isActive={isTrainingActive}
          />
          <NavItem 
            href="/works" 
            icon={<User className="w-[17px] h-[17px] text-current" />} 
            label="我的作品"
            isActive={isWorksActive}
          />
          
          {/* 用户头像 */}
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B8DB] to-[#2B7FFF] shadow-[0_10px_15px_-3px_rgba(0,184,219,0.3),0_4px_6px_-4px_rgba(0,184,219,0.3)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
            style={{ marginLeft: '30px' }}
          >
            <User className="w-4 h-4 text-white" />
          </div>
        </nav>
      </div>
    </header>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, icon, label, isActive = false }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={`rounded-[10px] flex items-center transition-all group whitespace-nowrap box-border ${
        isActive 
          ? 'bg-[rgba(173,70,255,0.2)] border border-[rgba(173,70,255,0.3)] text-[#DAB2FF]' 
          : 'text-[#99A1AF] hover:bg-[rgba(173,70,255,0.2)] hover:border hover:border-[rgba(173,70,255,0.3)] hover:text-[#DAB2FF]'
      }`}
      style={{
        width: '125px',
        height: '36px',
        padding: '0px 16px',
        gap: '8px',
      }}
    >
      <div className="group-hover:scale-110 transition-transform flex-none" style={{ order: 0, flexGrow: 0 }}>
        {icon}
      </div>
      <span 
        className="text-base font-bold leading-5" 
        style={{ 
          fontFamily: 'Source Han Sans CN, sans-serif',
          order: 1,
          flexGrow: 1,
        }}
      >
        {label}
      </span>
    </Link>
  );
}

