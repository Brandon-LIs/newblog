import friendsData from './friends.json';

export const Friends: Friend[] = friendsData;

export type Friend = {
  title: string
  description: string
  website: string
  avatar?: string
}
