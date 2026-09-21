// Raw YouTube Data API v3 response shapes — only the fields FocusTube reads.
// See src/services/youtube/ for the client that fetches these and normalizes them
// into our own domain types (src/types/channel.ts, src/types/video.ts).

export type YouTubeThumbnail = {
  url: string;
  width?: number;
  height?: number;
};

export type YouTubeThumbnails = {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
};

export type YouTubeChannelListItem = {
  id: string;
  snippet?: {
    title: string;
    /** e.g. "@somechannel" — present only if the channel has a handle set. */
    customUrl?: string;
    thumbnails: YouTubeThumbnails;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
};

export type YouTubeChannelListResponse = {
  items?: YouTubeChannelListItem[];
};

export type YouTubePlaylistItemListItem = {
  snippet?: {
    publishedAt: string;
    resourceId?: {
      videoId?: string;
    };
  };
};

export type YouTubePlaylistItemListResponse = {
  items?: YouTubePlaylistItemListItem[];
  nextPageToken?: string;
};

export type YouTubeVideoListItem = {
  id: string;
  snippet?: {
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: YouTubeThumbnails;
  };
  contentDetails?: {
    /** ISO-8601 duration, e.g. "PT4M13S". */
    duration: string;
  };
};

export type YouTubeVideoListResponse = {
  items?: YouTubeVideoListItem[];
};

export type YouTubeApiErrorResponse = {
  error?: {
    code: number;
    message: string;
    errors?: { reason?: string; message?: string }[];
    status?: string;
  };
};
