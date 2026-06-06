import { Injectable, Logger } from '@nestjs/common';
import { config } from '@/config/config';
import type { GeneratedRecipeImage } from './types/generated-recipe-image.type';

interface UnsplashSearchPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  links: {
    download_location: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashSearchPhoto[];
}

@Injectable()
export class UnsplashService {
  private readonly logger = new Logger(UnsplashService.name);
  private readonly accessKey = config.unsplash.accessKey?.trim();
  private readonly timeoutMs = config.unsplash.timeoutMs;

  async findRecipeImages(query: string): Promise<GeneratedRecipeImage[]> {
    if (!this.accessKey) {
      this.logger.warn(
        'Unsplash is not configured (missing UNSPLASH_ACCESS_KEY)',
      );
      return [];
    }

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    try {
      const photos = await this.searchPhotos(trimmedQuery);

      if (photos.length < 2) {
        if (photos.length === 1) {
          this.logger.warn(
            `Unsplash returned only 1 photo for "${trimmedQuery}", need 2 for preview + main`,
          );
        }

        return [];
      }

      const [previewPhoto, mainPhoto] = photos;

      await Promise.all([
        this.triggerDownload(previewPhoto.links.download_location),
        this.triggerDownload(mainPhoto.links.download_location),
      ]);

      return [
        {
          id: previewPhoto.id + new Date().getTime().toString(),
          imageUrl: previewPhoto.urls.small,
          publicId: previewPhoto.id,
          type: 'PREVIEW',
          createdAt: new Date(),
        },
        {
          id: mainPhoto.id + new Date().getTime().toString(),
          imageUrl: mainPhoto.urls.regular,
          publicId: mainPhoto.id,
          type: 'MAIN',
          createdAt: new Date(),
        },
      ];
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unsplash request failed';

      this.logger.warn(
        `Unsplash search failed for "${trimmedQuery}": ${message}`,
      );

      return [];
    }
  }

  private async searchPhotos(query: string): Promise<UnsplashSearchPhoto[]> {
    const params = new URLSearchParams({
      query,
      per_page: '2',
      orientation: 'landscape',
      content_filter: 'high',
    });

    const response = await this.fetch(
      `https://api.unsplash.com/search/photos?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }

    const data = (await response.json()) as UnsplashSearchResponse;

    return data.results;
  }

  private async triggerDownload(downloadLocation: string): Promise<void> {
    const response = await this.fetch(downloadLocation);

    if (!response.ok) {
      throw new Error(`Download trigger failed with status ${response.status}`);
    }
  }

  private fetch(url: string): Promise<Response> {
    return fetch(url, {
      headers: {
        Authorization: `Client-ID ${this.accessKey}`,
        'Accept-Version': 'v1',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
  }
}
