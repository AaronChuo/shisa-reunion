import { useState } from 'react';
import { PHOTO_BY_PLACE, photoUrl } from '../content/credits';
import { PLACES, type PlaceId } from '../content/places';
import { PostcardArt } from './PostcardArt';

/** The postcard's photo; if it can't load, the drawn picture of the place stands in */
export function PostcardPicture({ id, className }: { id: PlaceId; className?: string }) {
  const [failed, setFailed] = useState(false);
  const alt = PLACES[id].sights.join('、');
  if (failed || !PHOTO_BY_PLACE[id]) {
    return (
      <svg className={className} viewBox="0 0 400 240" role="img" aria-label={alt}>
        <PostcardArt id={id} />
      </svg>
    );
  }
  return <img className={className} src={photoUrl(id)} width={1000} height={600} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

/** A one-line credit for the photo: author and licence, linked to its source */
export function PhotoCreditLine({ id }: { id: PlaceId }) {
  const c = PHOTO_BY_PLACE[id];
  if (!c) return null;
  return (
    <p className="photoCredit">
      照片：
      {c.source ? (
        <a href={c.source} target="_blank" rel="noopener noreferrer">
          {c.author}
        </a>
      ) : (
        c.author
      )}
      ，
      {c.licenseUrl ? (
        <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
          {c.license}
        </a>
      ) : (
        c.license
      )}
      ，經裁切縮小
    </p>
  );
}
