import { useCallback, useState } from 'react';

import type { Place } from '../../services/places';
import type { LatLng } from '../../services/routing';
import ChatFab from './ChatFab';
import ChatPanel from './ChatPanel';

type Props = {
  origin: LatLng;
  hasLocation: boolean;
  // Hide the button while turn-by-turn navigation owns the screen.
  hidden: boolean;
  onOpenPlace: (place: Place) => void;
};

export default function Chatbot({ origin, hasLocation, hidden, onOpenPlace }: Props) {
  const [open, setOpen] = useState(false);
  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);

  return (
    <>
      <ChatFab hidden={hidden || open} onPress={openPanel} />
      <ChatPanel
        visible={open}
        origin={origin}
        hasLocation={hasLocation}
        onClose={closePanel}
        onOpenPlace={onOpenPlace}
      />
    </>
  );
}
