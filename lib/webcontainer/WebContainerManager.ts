import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;

export interface WebContainerFile {
  file: {
    contents: string;
  };
}

export interface WebContainerDirectory {
  directory: Record<string, WebContainerFile | WebContainerDirectory>;
}

export type WebContainerFileTree = Record<string, WebContainerFile | WebContainerDirectory>;

export class WebContainerManager {
  private static instance: WebContainerManager;
  private webcontainer: WebContainer | null = null;
  private isBooting = false;

  private constructor() {}

  static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    return WebContainerManager.instance;
  }

  async init(): Promise<WebContainer> {
    if (this.webcontainer) {
      return this.webcontainer;
    }

    if (this.isBooting) {
      // Wait for the current boot process to complete
      while (this.isBooting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.webcontainer!;
    }

    this.isBooting = true;

    try {
      this.webcontainer = await WebContainer.boot();
      console.log('WebContainer booted successfully');
      return this.webcontainer;
    } catch (error) {
      console.error('Failed to boot WebContainer:', error);
      throw error;
    } finally {
      this.isBooting = false;
    }
  }

  async getWebContainer(): Promise<WebContainer> {
    if (!this.webcontainer) {
      return await this.init();
    }
    return this.webcontainer;
  }

  async mountFiles(files: WebContainerFileTree): Promise<void> {
    const webcontainer = await this.getWebContainer();
    await webcontainer.mount(files as FileSystemTree);
  }

  async writeFile(path: string, content: string): Promise<void> {
    const webcontainer = await this.getWebContainer();
    await webcontainer.fs.writeFile(path, content);
  }

  async readFile(path: string): Promise<string> {
    const webcontainer = await this.getWebContainer();
    const content = await webcontainer.fs.readFile(path, 'utf-8');
    return content;
  }

  async deleteFile(path: string): Promise<void> {
    const webcontainer = await this.getWebContainer();
    await webcontainer.fs.rm(path);
  }

  async createDirectory(path: string): Promise<void> {
    const webcontainer = await this.getWebContainer();
    await webcontainer.fs.mkdir(path, { recursive: true });
  }

  async runCommand(command: string, args: string[] = []): Promise<{
    process: any;
    output: string;
  }> {
    const webcontainer = await this.getWebContainer();
    
    const process = await webcontainer.spawn(command, args);
    
    let output = '';
    
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          output += data;
        },
      })
    );

    const exitCode = await process.exit;
    
    return {
      process,
      output: output
    };
  }

  async installDependencies(): Promise<void> {
    console.log('Installing dependencies...');
    const { output } = await this.runCommand('npm', ['install']);
    console.log('Dependencies installed:', output);
  }

  async startDevServer(): Promise<{ url: string; process: any }> {
    console.log('Starting development server...');
    const webcontainer = await this.getWebContainer();
    
    const process = await webcontainer.spawn('npm', ['run', 'dev']);
    
    // Wait for the server to be ready
    webcontainer.on('server-ready', (port, url) => {
      console.log(`Server ready at ${url}`);
    });

    return {
      url: 'http://localhost:3000', // Default Next.js dev server port
      process
    };
  }

  async getServerUrl(): Promise<string | null> {
    const webcontainer = await this.getWebContainer();
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000); // 10 second timeout
      
      webcontainer.on('server-ready', (port, url) => {
        clearTimeout(timeout);
        resolve(url);
      });
    });
  }

  async buildProject(): Promise<string> {
    console.log('Building project...');
    const { output } = await this.runCommand('npm', ['run', 'build']);
    console.log('Build completed:', output);
    return output;
  }

  async listFiles(path: string = '.'): Promise<string[]> {
    const webcontainer = await this.getWebContainer();
    const entries = await webcontainer.fs.readdir(path, { withFileTypes: true });
    return entries.map(entry => entry.name);
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const webcontainer = await this.getWebContainer();
      await webcontainer.fs.readFile(path);
      return true;
    } catch {
      return false;
    }
  }
}

export const webcontainerManager = WebContainerManager.getInstance();