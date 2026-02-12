/**
 * 静态作品数据
 * 用于展示示例作品
 */

export interface Work {
  id: string;
  title: string;
  style: string;
  videoUrl: string;
  thumbnail: string;
  createdAt: string;
}

export const worksData: Work[] = [
  {
    id: 'demo1',
    title: 'Remember',
    style: '水墨风格',
    videoUrl: '/videos/demo1.mp4',
    thumbnail: '/works/demo1/thumbnail.png',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'demo2',
    title: 'Remember',
    style: '油画风格',
    videoUrl: '/videos/demo2.mp4',
    thumbnail: '/works/demo2/thumbnail.png',
    createdAt: '2024-01-14T15:20:00Z',
  },
  {
    id: 'demo3',
    title: 'Lost Stars',
    style: '赛博风格',
    videoUrl: '/videos/demo3.mp4',
    thumbnail: '/works/demo3/thumbnail.png',
    createdAt: '2024-01-13T09:45:00Z',
  },
  {
    id: 'demo4',
    title: 'Nightfall',
    style: '建筑风格',
    videoUrl: '/videos/demo4.mp4',
    thumbnail: '/works/demo4/thumbnail.png',
    createdAt: '2024-01-12T18:00:00Z',
  },
];
