export interface YtdlpExtractResult {
  platformVideoId: string;
  sourceUrl: string;
  title: string;
  description: string;
  tags: string[];
  durationSeconds?: number;
  thumbnailUrl?: string;
  subtitleText: string;
}
