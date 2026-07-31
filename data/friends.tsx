export const Friends: Friend[] = [
  // 在这里添加你的友链，例如：
  // {
  //   title: '愧怍',
  //   description: '道阻且长，行则将至',
  //   website: 'https://kuizuo.me',
  //   avatar: 'https://kuizuo.me/img/logo.png',
  // },
]

export type Friend = {
  title: string
  description: string
  website: string
  avatar?: string
}
