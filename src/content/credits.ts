import photos from './photos.json';
import type { PlaceId } from './places';

/** Where a postcard photo comes from, and the licence it is used under (all allow commercial use) */
export interface PhotoCredit {
  place: PlaceId;
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  /** The Commons page; null for a photo of our own */
  source: string | null;
}

export const PHOTOS = photos as unknown as (PhotoCredit & { download: string; position: string })[];
export const PHOTO_BY_PLACE = Object.fromEntries(PHOTOS.map((p) => [p.place, p])) as unknown as Record<PlaceId, PhotoCredit>;

/** Our own family photos: we hold the rights */
export const OWN_PHOTO = '自己拍的';

/**
 * Licences we accept: our own photos, public domain, CC0 and CC BY (attribution only). No share-alike, no
 * non-commercial, so a future app store release has nothing to clear.
 */
export const FREE_LICENSE = /^(自己拍的|cc0|public domain|cc by [0-9.]+)$/i;

export const photoUrl = (place: PlaceId) => `/places/${place}.webp`;

/** Zones added in v0.27 have no photo: their postcard shows the zone's own painted scene, made for the game */
export const SCENE_PLACES: PlaceId[] = ['chatan', 'onna', 'yanbaru', 'kaichu', 'nanjo', 'ishigaki'];
