/**
 * Utility functions for help system
 */

/**
 * Strip ANSI color codes from text
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

/**
 * Get terminal width
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Center text within a given width
 */
export function centerText(text: string, width: number): string {
  const textWidth = stripAnsi(text).length;
  if (textWidth >= width) return text;
  
  const padding = Math.floor((width - textWidth) / 2);
  return ' '.repeat(padding) + text;
}

/**
 * Create a horizontal line
 */
export function createLine(char: string = '-', width?: number): string {
  const lineWidth = width || getTerminalWidth();
  return char.repeat(lineWidth);
}

/**
 * Create a box around text
 */
export function createBox(text: string, padding: number = 1): string {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(l => stripAnsi(l).length));
  const boxWidth = maxLength + (padding * 2) + 2;
  
  const result: string[] = [];
  
  // Top border
  result.push('┌' + '─'.repeat(boxWidth - 2) + '┐');
  
  // Padding lines
  for (let i = 0; i < padding; i++) {
    result.push('│' + ' '.repeat(boxWidth - 2) + '│');
  }
  
  // Content lines
  lines.forEach(line => {
    const stripped = stripAnsi(line);
    const paddingRight = boxWidth - 2 - stripped.length - padding;
    result.push('│' + ' '.repeat(padding) + line + ' '.repeat(paddingRight) + '│');
  });
  
  // Padding lines
  for (let i = 0; i < padding; i++) {
    result.push('│' + ' '.repeat(boxWidth - 2) + '│');
  }
  
  // Bottom border
  result.push('└' + '─'.repeat(boxWidth - 2) + '┘');
  
  return result.join('\n');
}

/**
 * Format a table
 */
export interface TableColumn {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export function formatTable(
  rows: Record<string, any>[],
  columns: TableColumn[]
): string {
  // Calculate column widths
  const columnWidths: number[] = columns.map((col, index) => {
    if (col.width) return col.width;
    
    const maxContentWidth = Math.max(
      col.label.length,
      ...rows.map(row => String(row[col.key] || '').length)
    );
    
    return maxContentWidth + 2; // Add padding
  });
  
  const result: string[] = [];
  
  // Header
  const headerRow = columns.map((col, index) => {
    const width = columnWidths[index];
    return alignText(col.label, width, col.align || 'left');
  }).join('│');
  
  result.push(headerRow);
  result.push(columns.map((_, index) => '─'.repeat(columnWidths[index])).join('┼'));
  
  // Data rows
  rows.forEach(row => {
    const dataRow = columns.map((col, index) => {
      const width = columnWidths[index];
      const value = String(row[col.key] || '');
      return alignText(value, width, col.align || 'left');
    }).join('│');
    
    result.push(dataRow);
  });
  
  return result.join('\n');
}

/**
 * Align text within a given width
 */
function alignText(text: string, width: number, align: 'left' | 'center' | 'right'): string {
  const textLength = stripAnsi(text).length;
  
  if (textLength >= width) {
    return truncate(text, width);
  }
  
  const padding = width - textLength;
  
  switch (align) {
    case 'center':
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    
    case 'right':
      return ' '.repeat(padding) + text;
    
    case 'left':
    default:
      return text + ' '.repeat(padding);
  }
}

/**
 * Format a list with bullets
 */
export function formatList(items: string[], bullet: string = '•'): string {
  return items.map(item => `  ${bullet} ${item}`).join('\n');
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}