import { useCallback, useEffect, useRef, useState } from 'react';

import { ServiceError, type ServiceErrorKind } from '../services/ors';
import type { Place } from '../services/places';
import { getRoute, type LatLng, type Route } from '../services/routing';
import { addRecentPlace } from './useRecentPlaces';

export type RouteState =
  | { status: 'idle' }
  | { status: 'routing'; destination: Place }
  | { status: 'ready'; destination: Place; route: Route }
  | { status: 'error'; destination: Place; kind: ServiceErrorKind };

export type RouteController = {
  state: RouteState;
  searching: boolean;
  setSearching: (searching: boolean) => void;
  selectDestination: (destination: Place) => void;
  clearDestination: () => void;
  retry: () => void;
  // Recomputes the route from the current origin and keeps the old route on screen meanwhile.
  reroute: () => void;
};

export function useRoute(origin: LatLng): RouteController {
  const [state, setState] = useState<RouteState>({ status: 'idle' });
  const [searching, setSearching] = useState(false);
  const originRef = useRef(origin);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    originRef.current = origin;
  }, [origin]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const run = useCallback((destination: Place, silent = false) => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    if (!silent) setState({ status: 'routing', destination });

    getRoute(originRef.current, destination.location, request.signal)
      .then((route) => {
        if (!request.signal.aborted) setState({ status: 'ready', destination, route });
      })
      .catch((error: unknown) => {
        if (request.signal.aborted || silent) return;
        const kind: ServiceErrorKind = error instanceof ServiceError ? error.kind : 'failed';
        setState({ status: 'error', destination, kind });
      });
  }, []);

  const selectDestination = useCallback(
    (destination: Place) => {
      setSearching(false);
      addRecentPlace(destination);
      run(destination);
    },
    [run],
  );

  const clearDestination = useCallback(() => {
    requestRef.current?.abort();
    setState({ status: 'idle' });
  }, []);

  const retry = useCallback(() => {
    if (state.status === 'error') run(state.destination);
  }, [state, run]);

  const reroute = useCallback(() => {
    if (state.status === 'ready') run(state.destination, true);
  }, [state, run]);

  return { state, searching, setSearching, selectDestination, clearDestination, retry, reroute };
}
