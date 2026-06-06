import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { mkdtemp, readFile, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { config } from '@/config/config';
import { agentDebugLog } from '@/common/agent-debug-log';
import type { YtdlpExtractResult } from './types/ytdlp-extract-result.type';

interface YtdlpDumpJson {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
  duration?: number;
  thumbnail?: string;
  webpage_url?: string;
}

@Injectable()
export class YtdlpService {
  private readonly logger = new Logger(YtdlpService.name);
  private readonly executable = 'yt-dlp';
  private readonly timeoutMs: number = config.ytdlp.timeoutMs;
  private readonly retryCount: number = config.ytdlp.retryCount;
  private readonly retryDelayMs: number = config.ytdlp.retryDelayMs;

  async extract(
    url: string,
    options: { includeSubtitles?: boolean } = {},
  ): Promise<YtdlpExtractResult> {
    const maxAttempts = this.retryCount + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.extractOnce(url, options);
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;

        if (!(error instanceof UnprocessableEntityException) || isLastAttempt) {
          throw error;
        }

        this.logger.warn(
          `yt-dlp extract attempt ${attempt}/${maxAttempts} failed, retrying in ${this.retryDelayMs}ms`,
        );
        await this.delay(this.retryDelayMs);
      }
    }

    throw new UnprocessableEntityException('Не вдалось отримати дані з відео');
  }

  private async extractOnce(
    url: string,
    options: { includeSubtitles?: boolean } = {},
  ): Promise<YtdlpExtractResult> {
    const includeSubtitles = options.includeSubtitles ?? true;
    const extractStartedAt = Date.now();
    const tempDir = await mkdtemp(join(tmpdir(), 'ytdlp-'));
    const outputTemplate = join(tempDir, '%(id)s.%(ext)s');

    agentDebugLog(
      'H2',
      'ytdlp.service.ts:extract:start',
      'yt-dlp extract started',
      {
        includeSubtitles,
        timeoutMs: this.timeoutMs,
        executable: this.executable,
      },
    );

    try {
      const metadataArgs = [
        '--dump-json',
        '--skip-download',
        '--no-playlist',
        '--no-progress',
        url,
      ];

      const ytdlpStartedAt = Date.now();
      const { stdout } = await this.runOrFail(metadataArgs);

      agentDebugLog(
        'H2',
        'ytdlp.service.ts:extract:afterRun',
        'yt-dlp metadata finished',
        {
          elapsedMs: Date.now() - ytdlpStartedAt,
          stdoutLength: stdout.length,
          includeSubtitles,
        },
      );

      if (includeSubtitles) {
        await this.downloadSubtitles(url, outputTemplate);
      }

      const metadata = this.parseDumpJson(stdout);
      const platformVideoId = metadata.id;

      if (!platformVideoId) {
        throw new UnprocessableEntityException(
          'Не вдалось отримати дані з відео',
        );
      }

      const subtitleText = await this.readSubtitleText(tempDir);

      agentDebugLog(
        'H5',
        'ytdlp.service.ts:extract:done',
        'yt-dlp extract assembled result',
        {
          totalElapsedMs: Date.now() - extractStartedAt,
          platformVideoId,
          subtitleLength: subtitleText.length,
        },
      );

      return {
        platformVideoId,
        sourceUrl: metadata.webpage_url ?? url,
        title: metadata.title?.trim() ?? '',
        description: metadata.description?.trim() ?? '',
        tags: metadata.tags ?? [],
        durationSeconds: metadata.duration,
        thumbnailUrl: metadata.thumbnail,
        subtitleText,
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private async downloadSubtitles(
    url: string,
    outputTemplate: string,
  ): Promise<void> {
    const args = [
      '--skip-download',
      '--no-playlist',
      '--no-progress',
      '--write-auto-subs',
      '--write-subs',
      '--sub-langs',
      'ru,en,all',
      '--convert-subs',
      'srt',
      '-o',
      outputTemplate,
      url,
    ];

    const maxAttempts = this.retryCount + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.run(args);
        return;
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;
        const message =
          error instanceof Error
            ? error.message
            : 'yt-dlp subtitle download failed';

        if (isLastAttempt) {
          this.logger.warn(
            `yt-dlp subtitles skipped after ${maxAttempts} attempts: ${message}`,
          );
          return;
        }

        this.logger.warn(
          `yt-dlp subtitles attempt ${attempt}/${maxAttempts} failed, retrying in ${this.retryDelayMs}ms`,
        );
        await this.delay(this.retryDelayMs);
      }
    }
  }

  private parseDumpJson(stdout: string): YtdlpDumpJson {
    const lines = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      try {
        return JSON.parse(lines[i]) as YtdlpDumpJson;
      } catch {
        continue;
      }
    }

    this.logger.error('Failed to parse yt-dlp JSON output');
    throw new UnprocessableEntityException('Не вдалось отримати дані з відео');
  }

  private async readSubtitleText(tempDir: string): Promise<string> {
    let entries;

    try {
      entries = await readdir(tempDir, { withFileTypes: true });
    } catch {
      return '';
    }

    const subtitleFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.srt'))
      .map((entry) => entry.name)
      .sort();

    if (subtitleFiles.length === 0) {
      return '';
    }

    const parts = await Promise.all(
      subtitleFiles.map(async (fileName) => {
        const content = await readFile(join(tempDir, fileName), 'utf8');
        return this.stripSrtMarkup(content);
      }),
    );

    return parts.filter(Boolean).join('\n\n').trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private stripSrtMarkup(content: string): string {
    return content
      .replace(/\d+\r?\n/g, '')
      .replace(
        /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}\r?\n/g,
        '',
      )
      .replace(/<[^>]+>/g, '')
      .replace(/\r?\n{2,}/g, '\n')
      .trim();
  }

  private run(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.executable, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`yt-dlp timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });

      child.on('close', (code) => {
        clearTimeout(timer);

        agentDebugLog(
          'H4',
          'ytdlp.service.ts:run:close',
          'yt-dlp child closed',
          {
            exitCode: code,
            stderrLength: stderr.length,
          },
        );

        if (code === 0) {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
          return;
        }

        reject(
          new Error(
            stderr || stdout || `yt-dlp exited with code ${code ?? 'unknown'}`,
          ),
        );
      });
    });
  }

  private async runOrFail(
    args: string[],
  ): Promise<{ stdout: string; stderr: string }> {
    try {
      return await this.run(args);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'yt-dlp execution failed';

      this.logger.warn(`yt-dlp failed: ${message}`);

      throw new UnprocessableEntityException(
        'Не вдалось отримати дані з відео',
      );
    }
  }
}
