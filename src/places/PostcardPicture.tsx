import { useState } from 'react';
import { cardUrl, PLACES, type PlaceId } from '../content/places';
import { OkinawaMap } from './PostcardArt';

/** A postcard's picture: card `n` of the place, large or small for the grid; Okinawa's map is drawn, and stands in if a picture can't load */
export function PostcardPicture({ id, n, small = false, className }: { id: PlaceId; n: number; small?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const alt = PLACES[id].cards[n].sights.join('、');
  if (failed || id === 'okinawa') {
    return (
      <svg className={className} viewBox="0 0 400 240" role="img" aria-label={alt}>
        <OkinawaMap />
      </svg>
    );
  }
  const [w, h] = small ? [320, 192] : [960, 576];
  return <img className={className} src={cardUrl(id, n, small)} width={w} height={h} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
