/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

// React 19 移除了全局 JSX 命名空间，这里做兼容（仅用于类型注解）
import type {JSX as ReactJSX} from 'react';

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
  }
}
