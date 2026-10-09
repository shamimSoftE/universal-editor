/**
 * Word and token-level LCS diff engine for document revision comparisons.
 */

export interface DiffChunk {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface DiffResult {
  additions: number;
  deletions: number;
  unchanged: number;
  diffHtml: string;
  chunks: DiffChunk[];
}

/**
 * Tokenize input text or HTML into words, HTML tags, whitespace, and punctuation.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const regex = /<[^>]+>|[\p{L}\p{N}]+|[^\p{L}\p{N}\s<]+|\s+/gu;
  const matches = text.match(regex);
  return matches ? Array.from(matches) : [];
}

/**
 * Escape HTML characters for safe rendering in diff markup.
 */
export function escapeDiffHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Compute word/token-level diff between two text or HTML strings using LCS.
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
  const tokensOld = tokenize(oldText || '');
  const tokensNew = tokenize(newText || '');

  const m = tokensOld.length;
  const n = tokensNew.length;

  // Build standard LCS matrix
  const matrix: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tokensOld[i - 1] === tokensNew[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  // Backtrack to extract diff chunks
  const rawChunks: DiffChunk[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensOld[i - 1] === tokensNew[j - 1]) {
      rawChunks.unshift({ type: 'unchanged', text: tokensOld[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      rawChunks.unshift({ type: 'added', text: tokensNew[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      rawChunks.unshift({ type: 'removed', text: tokensOld[i - 1] });
      i--;
    }
  }

  // Consolidate adjacent chunks of identical type
  const chunks: DiffChunk[] = [];
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const chunk of rawChunks) {
    const wordMatches = chunk.text.match(/\S+/gu);
    const count = wordMatches ? wordMatches.length : 0;

    if (chunk.type === 'added') additions += count;
    else if (chunk.type === 'removed') deletions += count;
    else unchanged += count;

    const last = chunks[chunks.length - 1];
    if (last && last.type === chunk.type) {
      last.text += chunk.text;
    } else {
      chunks.push({ ...chunk });
    }
  }

  // Generate visual HTML with <ins> and <del> tags
  let diffHtml = '';
  for (const c of chunks) {
    const escaped = escapeDiffHtml(c.text);
    if (c.type === 'added') {
      diffHtml += `<ins class="ue-diff-ins">${escaped}</ins>`;
    } else if (c.type === 'removed') {
      diffHtml += `<del class="ue-diff-del">${escaped}</del>`;
    } else {
      diffHtml += escaped;
    }
  }

  return {
    additions,
    deletions,
    unchanged,
    diffHtml,
    chunks,
  };
}
