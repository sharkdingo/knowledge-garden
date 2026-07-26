declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    STUDIO_EDITOR_EMAILS?: string;
    LOCAL_STUDIO_AUTH?: string;
    LOCAL_STUDIO_USER_EMAIL?: string;
    LOCAL_STUDIO_USER_NAME?: string;
    IMAGES?: {
      input(stream: ReadableStream): {
        transform(options: Record<string, unknown>): {
          output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
        };
      };
    };
  }
}
