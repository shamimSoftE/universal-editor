import { Extension, Mark, Node } from '@tiptap/core';

export interface ExtensionMetadata {
  name: string;
  version: string;
  category: 'format' | 'block' | 'inline' | 'utility';
  priority?: number;
}

export interface RegisteredExtension {
  metadata: ExtensionMetadata;
  extension: any;
}

/**
 * Universal Extension Registry
 */
export class ExtensionRegistry {
  private registry = new Map<string, RegisteredExtension>();

  public register(extension: any, metadata?: Partial<ExtensionMetadata>): this {
    const name = metadata?.name || extension.name || 'unnamed-extension';
    this.registry.set(name, {
      metadata: {
        name,
        version: metadata?.version || '1.0.0',
        category: metadata?.category || 'utility',
        priority: metadata?.priority ?? 100,
      },
      extension,
    });
    return this;
  }

  public unregister(name: string): boolean {
    return this.registry.delete(name);
  }

  public get(name: string): RegisteredExtension | undefined {
    return this.registry.get(name);
  }

  public has(name: string): boolean {
    return this.registry.has(name);
  }

  public getAll(): any[] {
    return Array.from(this.registry.values())
      .sort((a, b) => (b.metadata.priority ?? 100) - (a.metadata.priority ?? 100))
      .map((item) => item.extension);
  }

  public getMetadataList(): ExtensionMetadata[] {
    return Array.from(this.registry.values()).map((item) => item.metadata);
  }
}

/**
 * Global singleton extension registry
 */
export const defaultExtensionRegistry = new ExtensionRegistry();

/**
 * Helper to define custom extensions
 */
export function defineExtension(options: Parameters<typeof Extension.create>[0]) {
  return Extension.create(options);
}

export function defineNode(options: Parameters<typeof Node.create>[0]) {
  return Node.create(options);
}

export function defineMark(options: Parameters<typeof Mark.create>[0]) {
  return Mark.create(options);
}

export const DEFAULT_EXTENSIONS: any[] = [];
