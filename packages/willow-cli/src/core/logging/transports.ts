/**
 * Log Transports for Different Output Destinations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as dgram from 'dgram';
import { LogEntry, LogTransport, LogFormatter } from './types.js';
import { PlainTextFormatter } from './formatters.js';

/**
 * Console transport
 */
export class ConsoleTransport implements LogTransport {
  constructor(
    private formatter: LogFormatter = new PlainTextFormatter()
  ) {}
  
  write(entry: LogEntry): void {
    const formatted = this.formatter.format(entry);
    
    switch (entry.level) {
      case 0: // DEBUG
        console.debug(formatted);
        break;
      case 1: // INFO
        console.log(formatted);
        break;
      case 2: // WARN
        console.warn(formatted);
        break;
      case 3: // ERROR
        console.error(formatted);
        break;
      default:
        console.log(formatted);
    }
  }
}

/**
 * File transport with rotation support
 */
export class FileTransport implements LogTransport {
  private stream: fs.WriteStream | null = null;
  private currentSize = 0;
  private fileIndex = 0;
  
  constructor(
    private filename: string,
    private formatter: LogFormatter = new PlainTextFormatter(),
    private maxSize: number = 10 * 1024 * 1024, // 10MB
    private maxFiles: number = 5
  ) {
    this.ensureStream();
  }
  
  async write(entry: LogEntry): Promise<void> {
    const formatted = this.formatter.format(entry) + '\n';
    const buffer = Buffer.from(formatted);
    
    // Check if rotation is needed
    if (this.currentSize + buffer.length > this.maxSize) {
      await this.rotate();
    }
    
    return new Promise((resolve, reject) => {
      if (!this.stream) {
        reject(new Error('Stream not initialized'));
        return;
      }
      
      this.stream.write(buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          this.currentSize += buffer.length;
          resolve();
        }
      });
    });
  }
  
  async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.stream) {
        resolve();
        return;
      }
      
      this.stream.end(() => {
        resolve();
      });
    });
  }
  
  async close(): Promise<void> {
    if (this.stream) {
      await this.flush();
      this.stream = null;
    }
  }
  
  private ensureStream(): void {
    const dir = path.dirname(this.filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Get current file size
    try {
      const stats = fs.statSync(this.filename);
      this.currentSize = stats.size;
    } catch {
      this.currentSize = 0;
    }
    
    this.stream = fs.createWriteStream(this.filename, {
      flags: 'a',
      encoding: 'utf8',
    });
  }
  
  private async rotate(): Promise<void> {
    if (this.stream) {
      await this.close();
    }
    
    // Rotate existing files
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldFile = i === 1 ? this.filename : `${this.filename}.${i - 1}`;
      const newFile = `${this.filename}.${i}`;
      
      if (fs.existsSync(oldFile)) {
        if (fs.existsSync(newFile)) {
          fs.unlinkSync(newFile);
        }
        fs.renameSync(oldFile, newFile);
      }
    }
    
    this.currentSize = 0;
    this.ensureStream();
  }
}

/**
 * Memory transport for testing
 */
export class MemoryTransport implements LogTransport {
  private entries: LogEntry[] = [];
  private maxEntries: number;
  
  constructor(
    maxEntries: number = 1000,
    private formatter?: LogFormatter
  ) {
    this.maxEntries = maxEntries;
  }
  
  write(entry: LogEntry): void {
    this.entries.push(entry);
    
    // Remove oldest entries if we exceed max
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
  }
  
  getEntries(): LogEntry[] {
    return [...this.entries];
  }
  
  getFormattedEntries(): string[] {
    if (!this.formatter) {
      return this.entries.map(e => e.message);
    }
    return this.entries.map(e => this.formatter.format(e));
  }
  
  clear(): void {
    this.entries = [];
  }
  
  flush(): void {
    // No-op for memory transport
  }
}

/**
 * Syslog transport (RFC 5424)
 */
export class SyslogTransport implements LogTransport {
  private client: net.Socket | dgram.Socket | null = null;
  private readonly facility = 16; // Local0
  private readonly hostname: string;
  private readonly appName: string;
  
  constructor(
    private host: string = 'localhost',
    private port: number = 514,
    private protocol: 'tcp' | 'udp' = 'udp',
    private formatter: LogFormatter = new PlainTextFormatter(),
    appName: string = 'willow-cli'
  ) {
    this.hostname = require('os').hostname();
    this.appName = appName;
    this.connect();
  }
  
  write(entry: LogEntry): void {
    const priority = this.calculatePriority(entry.level);
    const timestamp = entry.metadata.timestamp.toISOString();
    const message = this.formatter.format(entry);
    
    // RFC 5424 format
    const syslogMessage = `<${priority}>1 ${timestamp} ${this.hostname} ${this.appName} - - ${message}`;
    
    if (this.protocol === 'udp') {
      const client = this.client as dgram.Socket;
      const buffer = Buffer.from(syslogMessage);
      client.send(buffer, this.port, this.host);
    } else {
      const client = this.client as net.Socket;
      client.write(syslogMessage + '\n');
    }
  }
  
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client) {
        resolve();
        return;
      }
      
      if (this.protocol === 'udp') {
        (this.client as dgram.Socket).close(() => resolve());
      } else {
        (this.client as net.Socket).end(() => resolve());
      }
      
      this.client = null;
    });
  }
  
  private connect(): void {
    if (this.protocol === 'udp') {
      this.client = dgram.createSocket('udp4');
    } else {
      this.client = net.createConnection({
        host: this.host,
        port: this.port,
      });
      
      (this.client as net.Socket).on('error', (err) => {
        console.error('Syslog connection error:', err);
      });
    }
  }
  
  private calculatePriority(level: number): number {
    // Map log levels to syslog severities
    const severityMap: Record<number, number> = {
      0: 7, // DEBUG -> Debug
      1: 6, // INFO -> Informational
      2: 4, // WARN -> Warning
      3: 3, // ERROR -> Error
    };
    
    const severity = severityMap[level] || 6;
    return this.facility * 8 + severity;
  }
}

/**
 * Multi-transport that writes to multiple destinations
 */
export class MultiTransport implements LogTransport {
  constructor(private transports: LogTransport[]) {}
  
  async write(entry: LogEntry): Promise<void> {
    const promises = this.transports.map(transport => 
      Promise.resolve(transport.write(entry))
    );
    await Promise.all(promises);
  }
  
  async flush(): Promise<void> {
    const promises = this.transports
      .filter(t => t.flush)
      .map(t => t.flush!());
    await Promise.all(promises);
  }
  
  async close(): Promise<void> {
    const promises = this.transports
      .filter(t => t.close)
      .map(t => t.close!());
    await Promise.all(promises);
  }
}

/**
 * Filtered transport that only writes entries matching criteria
 */
export class FilteredTransport implements LogTransport {
  constructor(
    private transport: LogTransport,
    private filter: (entry: LogEntry) => boolean
  ) {}
  
  async write(entry: LogEntry): Promise<void> {
    if (this.filter(entry)) {
      await this.transport.write(entry);
    }
  }
  
  flush(): Promise<void> | void {
    return this.transport.flush?.();
  }
  
  close(): Promise<void> | void {
    return this.transport.close?.();
  }
}

/**
 * Buffered transport for batching writes
 */
export class BufferedTransport implements LogTransport {
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor(
    private transport: LogTransport,
    private bufferSize: number = 100,
    private flushInterval: number = 1000
  ) {
    this.startFlushTimer();
  }
  
  async write(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }
  
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const entries = this.buffer.splice(0);
    for (const entry of entries) {
      await this.transport.write(entry);
    }
    
    if (this.transport.flush) {
      await this.transport.flush();
    }
  }
  
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    await this.flush();
    
    if (this.transport.close) {
      await this.transport.close();
    }
  }
  
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }
}

/**
 * Factory for creating transports
 */
export class TransportFactory {
  private static transports = new Map<string, new (...args: any[]) => LogTransport>([
    ['console', ConsoleTransport],
    ['file', FileTransport],
    ['memory', MemoryTransport],
    ['syslog', SyslogTransport],
  ]);
  
  static create(type: string, options?: any): LogTransport {
    const TransportClass = this.transports.get(type);
    if (!TransportClass) {
      throw new Error(`Unknown transport type: ${type}`);
    }
    return new TransportClass(options);
  }
  
  static register(name: string, transport: new (...args: any[]) => LogTransport): void {
    this.transports.set(name, transport);
  }
}