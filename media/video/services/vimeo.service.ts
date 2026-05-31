import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VimeoService {
  buildEmbedUrl(url: string, options: { autoplay?: boolean; muted?: boolean } = {}): string {
    const parsed = new URL(url);

    if (parsed.hostname.includes('vimeo.com') && parsed.hostname !== 'player.vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop();

      if (id) {
        parsed.hostname = 'player.vimeo.com';
        parsed.pathname = `/video/${id}`;
      }
    }

    parsed.searchParams.set('autoplay', options.autoplay ? '1' : '0');
    parsed.searchParams.set('playsinline', '1');
    parsed.searchParams.set('controls', '0');
    parsed.searchParams.set('background', '0');
    parsed.searchParams.set('muted', options.muted ? '1' : '0');
    parsed.searchParams.set('title', '0');
    parsed.searchParams.set('byline', '0');
    parsed.searchParams.set('portrait', '0');
    return parsed.toString();
  }

  post(iframe: HTMLIFrameElement | undefined, message: Record<string, unknown>): void {
    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(JSON.stringify(message), 'https://player.vimeo.com');
  }
}
