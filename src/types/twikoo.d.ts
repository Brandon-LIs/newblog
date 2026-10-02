/**
 * Twikoo 前端 SDK 的全局类型。
 *
 * 此前 Comment 组件与留言板页面各自 `declare global` 了一份 Window.twikoo，
 * 但两者的 init 入参形状不同（后者多 url / onCommentLoaded），
 * TypeScript 的接口声明合并要求同名属性类型完全一致，于是两处都报错，
 * 且 message.tsx 传入的 url / onCommentLoaded 被判为「未知属性」。
 * 这里收敛成唯一一份，两处共用。
 */
export {};

declare global {
  interface Window {
    twikoo?: {
      init: (options: {
        envId: string;
        el: HTMLElement | string;
        url?: string;
        onCommentLoaded?: () => void;
      }) => Promise<void>;
    };
  }
}