declare module '*/gitalk.min.js' {
  interface GitalkOptions {
    clientID: string;
    clientSecret: string;
    repo: string;
    owner: string;
    admin: string[];
    id?: string;
    title?: string;
    number?: number;
    labels?: string[];
    body?: string;
    language?: string;
    perPage?: number;
    pagerDirection?: 'last' | 'first';
    createIssueManually?: boolean;
    distractionFreeMode?: boolean;
    proxy?: string;
    enableHotKey?: boolean;
    updateCountCallback?: (commentCount: number) => void;
  }

  export default class Gitalk {
    constructor(options: GitalkOptions);
    render(container: string | HTMLElement): void;
  }
}
