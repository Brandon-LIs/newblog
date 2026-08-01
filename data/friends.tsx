export const Friends: Friend[] = [
  {
    title: '宜昌市第一中学',
    description: '文脉千年，学在一中。欢迎来到宜昌一中。',
    website: 'https://www.ycyz.com/',
    avatar: '/img/friends/ycyz.ico',
  },
  {
    title: '西陵金初',
    description: '宜昌市西陵区金东方初中官网。',
    website: 'https://xlcz.jdfschool.com/',
    avatar: '/img/friends/jdfschool.svg',
  },
  {
    title: "Kazuki's Blog",
    description: '一名热爱计算机科学与科技创新的高中生。',
    website: 'https://www.ycxhl.top/',
    avatar: '/img/friends/ycxhl.svg',
  },
]

export type Friend = {
  title: string
  description: string
  website: string
  avatar?: string
}
