import { computeDiff, DiffResult } from '@universal-editor/utils';

export interface VersionSnapshot {
  id: number | string;
  documentId?: number | string;
  version: number;
  title?: string;
  note?: string;
  contentHtml: string;
  contentJson?: any;
  wordCount: number;
  createdBy?: number | string;
  createdAt: string;
  formattedTime: string;
}

export interface VersionHistoryOptions {
  documentId?: number | string;
  maxVersions?: number;
  apiEndpoint?: string;
}

/**
 * Universal Editor Version History Manager.
 * Manages immutable document version snapshots, comparisons, and restoration.
 */
export class VersionHistoryManager {
  private versions: VersionSnapshot[] = [];
  private currentVersionNumber: number = 0;
  private documentId?: number | string;
  private maxVersions: number;
  private apiEndpoint?: string;

  constructor(options: VersionHistoryOptions = {}) {
    this.documentId = options.documentId;
    this.maxVersions = options.maxVersions ?? 50;
    this.apiEndpoint = options.apiEndpoint;
  }

  public get apiEndpointUrl(): string | undefined {
    return this.apiEndpoint;
  }

  /**
   * Create an immutable snapshot of the document content.
   */
  public createSnapshot(
    contentHtml: string,
    note?: string,
    contentJson?: any,
    title: string = 'Untitled Document',
    userId?: number | string
  ): VersionSnapshot {
    this.currentVersionNumber++;

    // Calculate approximate word count
    const cleanText = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;

    const now = new Date();
    const snapshot: VersionSnapshot = {
      id: `${this.documentId || 'doc'}-v${this.currentVersionNumber}-${Date.now()}`,
      documentId: this.documentId,
      version: this.currentVersionNumber,
      title,
      note: note || (this.currentVersionNumber === 1 ? 'Initial version' : `Revision #${this.currentVersionNumber}`),
      contentHtml,
      contentJson,
      wordCount: words,
      createdBy: userId,
      createdAt: now.toISOString(),
      formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    this.versions.unshift(snapshot);

    // Prune versions exceeding limit
    if (this.versions.length > this.maxVersions) {
      this.versions = this.versions.slice(0, this.maxVersions);
    }

    return snapshot;
  }

  /**
   * Retrieve all recorded versions ordered newest first.
   */
  public getVersions(): VersionSnapshot[] {
    return [...this.versions];
  }

  /**
   * Retrieve a specific version by its snapshot ID or version number.
   */
  public getVersion(idOrNumber: number | string): VersionSnapshot | undefined {
    return this.versions.find(
      v => v.id === idOrNumber || v.version === Number(idOrNumber)
    );
  }

  /**
   * Restore document state to a previous version snapshot.
   * Records a new snapshot indicating the restoration.
   */
  public restoreVersion(idOrNumber: number | string): VersionSnapshot | undefined {
    const target = this.getVersion(idOrNumber);
    if (!target) {
      return undefined;
    }

    // Create an audit snapshot representing the restoration
    return this.createSnapshot(
      target.contentHtml,
      `Restored from version ${target.version}`,
      target.contentJson,
      target.title,
      target.createdBy
    );
  }

  /**
   * Compare two versions or a version against another version using the LCS diff engine.
   */
  public compareVersions(
    baseIdOrNumber: number | string,
    targetIdOrNumber?: number | string
  ): DiffResult {
    const base = this.getVersion(baseIdOrNumber);
    if (!base) {
      throw new Error(`Base version "${baseIdOrNumber}" not found.`);
    }

    let targetHtml = '';
    if (targetIdOrNumber !== undefined) {
      const target = this.getVersion(targetIdOrNumber);
      if (!target) {
        throw new Error(`Target version "${targetIdOrNumber}" not found.`);
      }
      targetHtml = target.contentHtml;
    } else {
      // Compare against newest version if target not specified
      const latest = this.versions[0];
      targetHtml = latest ? latest.contentHtml : '';
    }

    return computeDiff(base.contentHtml, targetHtml);
  }

  /**
   * Load historical versions from an external source or API.
   */
  public loadVersions(snapshots: VersionSnapshot[]): void {
    this.versions = [...snapshots].sort((a, b) => b.version - a.version);
    if (this.versions.length > 0) {
      this.currentVersionNumber = Math.max(...this.versions.map(v => v.version));
    }
  }

  /**
   * Clear all recorded version history.
   */
  public clearHistory(): void {
    this.versions = [];
    this.currentVersionNumber = 0;
  }

  /**
   * Current version count.
   */
  public get count(): number {
    return this.versions.length;
  }
}
