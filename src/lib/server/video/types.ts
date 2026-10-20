export type VideoProviderName = "vercel-blob";

export type VideoState = "processing" | "ready" | "failed" | "missing";

export interface VideoStatus {
  state: VideoState;
  // 0..1, when the provider reports encoding progress.
  progress?: number;
}

export interface VideoPlayback {
  type: "file" | "iframe";
  url: string;
  // ms since epoch
  expiresAt: number;
}

export interface VideoProvider {
  name: VideoProviderName;
  status(videoId: string): Promise<VideoStatus>;
  playback(videoId: string): Promise<VideoPlayback>;
  // A missing video is not an error.
  delete(videoId: string): Promise<void>;
}
