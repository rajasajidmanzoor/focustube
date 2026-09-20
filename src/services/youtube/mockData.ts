// Temporary stand-in for real YouTube Data API v3 responses so the UI shell can be
// built and tested before TODO.md Phase 1 (services/youtube client) exists. Delete
// this file once real channel/video fetching is wired up.
import type { Channel, Video } from '@/types';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}

function avatarUrl(seed: string): string {
  return `https://picsum.photos/seed/${seed}/200/200`;
}

function thumbnailUrl(seed: string): string {
  return `https://picsum.photos/seed/${seed}/640/360`;
}

export const mockChannels: Channel[] = [
  { id: 'ch_northlight', title: 'Northlight Astronomy', thumbnailUrl: avatarUrl('northlight'), addedAt: daysAgo(10) },
  { id: 'ch_kitchen', title: 'Kitchen Theory', thumbnailUrl: avatarUrl('kitchen'), addedAt: daysAgo(6) },
  { id: 'ch_trailgear', title: 'Trail & Gear', thumbnailUrl: avatarUrl('trailgear'), addedAt: daysAgo(3) },
  { id: 'ch_quietcode', title: 'Quiet Code', thumbnailUrl: avatarUrl('quietcode'), addedAt: daysAgo(1) },
  { id: 'ch_analog', title: 'Analog Workshop', thumbnailUrl: avatarUrl('analog'), addedAt: daysAgo(20) },
];

function channelMeta(channelId: string) {
  const channel = mockChannels.find((item) => item.id === channelId);
  if (!channel) throw new Error(`Unknown mock channel id: ${channelId}`);
  return { channelName: channel.title, channelThumbnailUrl: channel.thumbnailUrl };
}

export const mockVideos: Video[] = [
  {
    id: 'vid_jupiter_scope',
    channelId: 'ch_northlight',
    ...channelMeta('ch_northlight'),
    title: 'Jupiter Through a Budget Telescope',
    thumbnailUrl: thumbnailUrl('vid_jupiter_scope'),
    publishedAt: daysAgo(2),
    durationSeconds: 872,
    isShort: false,
  },
  {
    id: 'vid_andromeda_90s',
    channelId: 'ch_northlight',
    ...channelMeta('ch_northlight'),
    title: 'The Andromeda Galaxy in 90 Seconds',
    thumbnailUrl: thumbnailUrl('vid_andromeda_90s'),
    publishedAt: hoursAgo(5),
    durationSeconds: 52,
    isShort: true,
  },
  {
    id: 'vid_saturn_rings',
    channelId: 'ch_northlight',
    ...channelMeta('ch_northlight'),
    title: "Why Saturn's Rings Are Disappearing",
    thumbnailUrl: thumbnailUrl('vid_saturn_rings'),
    publishedAt: daysAgo(7),
    durationSeconds: 547,
    isShort: false,
  },
  {
    id: 'vid_oneplan_pasta',
    channelId: 'ch_kitchen',
    ...channelMeta('ch_kitchen'),
    title: 'One-Pan Weeknight Pasta',
    thumbnailUrl: thumbnailUrl('vid_oneplan_pasta'),
    publishedAt: daysAgo(1),
    durationSeconds: 521,
    isShort: false,
  },
  {
    id: 'vid_knife_skills',
    channelId: 'ch_kitchen',
    ...channelMeta('ch_kitchen'),
    title: '3 Knife Skills in 60 Seconds',
    thumbnailUrl: thumbnailUrl('vid_knife_skills'),
    publishedAt: hoursAgo(3),
    durationSeconds: 58,
    isShort: true,
  },
  {
    id: 'vid_searing_steak',
    channelId: 'ch_kitchen',
    ...channelMeta('ch_kitchen'),
    title: 'The Science of Searing Steak',
    thumbnailUrl: thumbnailUrl('vid_searing_steak'),
    publishedAt: daysAgo(4),
    durationSeconds: 735,
    isShort: false,
  },
  {
    id: 'vid_peel_garlic',
    channelId: 'ch_kitchen',
    ...channelMeta('ch_kitchen'),
    title: 'Fastest Way to Peel Garlic',
    thumbnailUrl: thumbnailUrl('vid_peel_garlic'),
    publishedAt: daysAgo(2),
    durationSeconds: 34,
    isShort: true,
  },
  {
    id: 'vid_ultralight_setup',
    channelId: 'ch_trailgear',
    ...channelMeta('ch_trailgear'),
    title: 'Ultralight Backpacking Setup 2025',
    thumbnailUrl: thumbnailUrl('vid_ultralight_setup'),
    publishedAt: daysAgo(3),
    durationSeconds: 1100,
    isShort: false,
  },
  {
    id: 'vid_pack_45s',
    channelId: 'ch_trailgear',
    ...channelMeta('ch_trailgear'),
    title: 'Packing My Bag in 45 Seconds',
    thumbnailUrl: thumbnailUrl('vid_pack_45s'),
    publishedAt: daysAgo(1),
    durationSeconds: 45,
    isShort: true,
  },
  {
    id: 'vid_rain_jacket',
    channelId: 'ch_trailgear',
    ...channelMeta('ch_trailgear'),
    title: 'Is This the Best Rain Jacket Under $150?',
    thumbnailUrl: thumbnailUrl('vid_rain_jacket'),
    publishedAt: daysAgo(14),
    durationSeconds: 662,
    isShort: false,
  },
  {
    id: 'vid_refactor_hook',
    channelId: 'ch_quietcode',
    ...channelMeta('ch_quietcode'),
    title: 'Refactoring a Messy React Hook',
    thumbnailUrl: thumbnailUrl('vid_refactor_hook'),
    publishedAt: hoursAgo(6),
    durationSeconds: 1330,
    isShort: false,
  },
  {
    id: 'vid_ts_trick',
    channelId: 'ch_quietcode',
    ...channelMeta('ch_quietcode'),
    title: 'One Weird TypeScript Trick',
    thumbnailUrl: thumbnailUrl('vid_ts_trick'),
    publishedAt: hoursAgo(12),
    durationSeconds: 47,
    isShort: true,
  },
  {
    id: 'vid_cli_scratch',
    channelId: 'ch_quietcode',
    ...channelMeta('ch_quietcode'),
    title: 'Building a CLI Tool From Scratch',
    thumbnailUrl: thumbnailUrl('vid_cli_scratch'),
    publishedAt: daysAgo(5),
    durationSeconds: 1668,
    isShort: false,
  },
  {
    id: 'vid_debug_async',
    channelId: 'ch_quietcode',
    ...channelMeta('ch_quietcode'),
    title: 'Fastest Way to Debug Async Code',
    thumbnailUrl: thumbnailUrl('vid_debug_async'),
    publishedAt: daysAgo(2),
    durationSeconds: 55,
    isShort: true,
  },
  {
    id: 'vid_restore_camera',
    channelId: 'ch_analog',
    ...channelMeta('ch_analog'),
    title: 'Restoring a 1970s Film Camera',
    thumbnailUrl: thumbnailUrl('vid_restore_camera'),
    publishedAt: daysAgo(4),
    durationSeconds: 1004,
    isShort: false,
  },
  {
    id: 'vid_load_film_dark',
    channelId: 'ch_analog',
    ...channelMeta('ch_analog'),
    title: 'Loading Film in the Dark',
    thumbnailUrl: thumbnailUrl('vid_load_film_dark'),
    publishedAt: hoursAgo(8),
    durationSeconds: 50,
    isShort: true,
  },
  {
    id: 'vid_paper_negatives',
    channelId: 'ch_analog',
    ...channelMeta('ch_analog'),
    title: 'Why I Still Shoot on Paper Negatives',
    thumbnailUrl: thumbnailUrl('vid_paper_negatives'),
    publishedAt: daysAgo(10),
    durationSeconds: 630,
    isShort: false,
  },
];
