declare module "chrome-launcher" {
  interface Options {
    chromeFlags?: string[];
    startingPort?: number;
    chromePath?: string;
    port?: number;
  }
  interface Instance {
    port: number;
    pid: number;
    kill(): Promise<void>;
  }
  export function launch(options?: Options): Promise<Instance>;
}

declare module "chrome-remote-interface" {
  interface CDPClient {
    Network: any;
    Page: any;
    Runtime: any;
    Target: any;
    close(): Promise<void>;
  }
  function CDP(options?: {
    port?: number;
    host?: string;
  }): Promise<CDPClient>;
  export = CDP;
}
