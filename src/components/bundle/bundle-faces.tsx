import { BUNDLE_PROMO as T } from '@/content/bundle-promo';
import { CHAT_CHARACTERS } from '@/lib/chat/characters';
import { BUNDLE_ROOMS } from '@/lib/payments/bundle';
import { ROOMS, type RoomKey } from '@/lib/rooms/themes';
import './bundle-promo.css';

export function BundleFaces({ rooms = BUNDLE_ROOMS }: { rooms?: readonly RoomKey[] }) {
  return (
    <ul className="bb-faces" aria-label={T.banner.roomsLabel}>
      {rooms.map((room) => (
        <li key={room} className="bb-faces__item" data-room={room}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="bb-faces__img" src={CHAT_CHARACTERS[ROOMS[room].keeper as keyof typeof CHAT_CHARACTERS].art} alt="" width={52} height={52} loading="lazy" draggable={false} />
          <span className="bb-faces__name">{T.short[room]}</span>
        </li>
      ))}
    </ul>
  );
}
