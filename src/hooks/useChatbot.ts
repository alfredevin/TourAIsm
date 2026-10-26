import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DESTINATIONS } from '../data/destinations';
import {
  AI_ERROR_MESSAGES,
  createMessage,
  type AiBlock,
  type AiMessage,
  type AiTool,
  type AiToolUseBlock,
} from '../services/ai';
import { ServiceError } from '../services/ors';
import { searchPlaces, type Place } from '../services/places';
import { getRoute, type LatLng } from '../services/routing';
import { distanceMeters } from '../utils/route';

export type RouteCard = {
  place: Place;
  distanceMeters: number;
  durationSeconds: number;
};

export type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
  routes?: RouteCard[];
};

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY = 40;
const MAX_STEPS_FOR_AI = 8;

const GREETING: ChatItem = {
  id: 'greeting',
  role: 'assistant',
  text: 'Hi! I’m your TourAIsm guide. Tell me where you want to go and I’ll find it and plan the route.',
};

export const QUICK_REPLIES = [
  'Where should I go?',
  'Directions to Boac Cathedral',
  'Beaches near me',
] as const;

const TOOLS: AiTool[] = [
  {
    name: 'search_places',
    description:
      'Find places in the Philippines by name or type (e.g. "Boac Cathedral", "beach in Torrijos"). Returns up to 5 matches with coordinates and distance from the tourist.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Place name or keywords to search for.' } },
      required: ['query'],
    },
  },
  {
    name: 'get_route',
    description:
      'Get driving directions from the tourist’s current location to a place returned by search_places. Shows a route card with an "Open on map" button to the tourist.',
    input_schema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'The place label exactly as returned by search_places.' },
        latitude: { type: 'number', description: 'Latitude of the place.' },
        longitude: { type: 'number', description: 'Longitude of the place.' },
      },
      required: ['label', 'latitude', 'longitude'],
    },
  },
];

function buildSystemPrompt(origin: LatLng, hasLocation: boolean): string {
  const rewards = DESTINATIONS.map(
    (d) => `- ${d.name} (${d.town}): ${d.points} points, ${d.location.latitude}, ${d.location.longitude}`,
  ).join('\n');

  return [
    'You are the in-app travel assistant for TourAIsm, a tourist guide app for Marinduque, Philippines.',
    'Your job: find out where the tourist wants to go, then give them a route. Be warm, brief (2-4 sentences), and reply in the language the tourist uses (English, Filipino, or Taglish).',
    '',
    'Rules:',
    '- If the destination is missing or vague, ask one short question (e.g. what kind of place, or which town).',
    '- Never guess coordinates. Use search_places to find a place, then get_route to plan the trip.',
    '- If search_places returns several plausible matches, ask which one they mean before routing.',
    '- After get_route, summarize the distance and travel time. The app shows the route card; do not repeat every step.',
    '- Only discuss travel, places, and directions in the Philippines. Politely decline anything else.',
    '- If you are unsure about opening hours, fees, or safety, say so rather than inventing details.',
    '',
    hasLocation
      ? `The tourist is currently at ${origin.latitude.toFixed(5)}, ${origin.longitude.toFixed(5)}.`
      : 'The tourist’s GPS is unavailable, so routes start from the Santa Cruz town center.',
    '',
    'Featured destinations where tourists earn reward points by visiting in person (mention this when relevant):',
    rewards,
  ].join('\n');
}

function kilometers(meters: number): number {
  return Math.round(meters / 100) / 10;
}

function messageFor(error: unknown): string {
  if (error instanceof ServiceError) return error.message;
  return AI_ERROR_MESSAGES.failed;
}

function textOf(blocks: AiBlock[]): string {
  return blocks
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('\n')
    .trim();
}

// Keeps the history bounded without orphaning a tool_result from its tool_use.
function trimHistory(history: AiMessage[]): AiMessage[] {
  if (history.length <= MAX_HISTORY) return history;
  const start = history.length - MAX_HISTORY;
  const firstUser = history.findIndex((message, i) => i >= start && message.role === 'user' && typeof message.content === 'string');
  return firstUser === -1 ? history.slice(start) : history.slice(firstUser);
}

export function useChatbot(origin: LatLng, hasLocation: boolean) {
  const [items, setItems] = useState<ChatItem[]>([GREETING]);
  const [busy, setBusy] = useState(false);
  const historyRef = useRef<AiMessage[]>([]);
  const originRef = useRef(origin);
  const hasLocationRef = useRef(hasLocation);
  const requestRef = useRef<AbortController | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    originRef.current = origin;
    hasLocationRef.current = hasLocation;
  }, [origin, hasLocation]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const nextId = useCallback(() => {
    counterRef.current += 1;
    return `m${counterRef.current}`;
  }, []);

  const runTool = useCallback(
    async (call: AiToolUseBlock, cards: RouteCard[], signal: AbortSignal): Promise<{ content: string; isError: boolean }> => {
      const from = originRef.current;
      try {
        if (call.name === 'search_places') {
          const query = typeof call.input.query === 'string' ? call.input.query.trim() : '';
          if (!query) return { content: 'The query was empty.', isError: true };
          const places = await searchPlaces(query, from, signal);
          if (places.length === 0) return { content: 'No places matched that search.', isError: false };
          return {
            content: JSON.stringify(
              places.map((place) => ({
                label: place.label,
                latitude: place.location.latitude,
                longitude: place.location.longitude,
                distance_km: kilometers(distanceMeters(from, place.location)),
              })),
            ),
            isError: false,
          };
        }

        if (call.name === 'get_route') {
          const { label, latitude, longitude } = call.input;
          if (typeof label !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') {
            return { content: 'label, latitude and longitude are required.', isError: true };
          }
          const place: Place = { label, location: { latitude, longitude } };
          const route = await getRoute(from, place.location, signal);
          cards.push({ place, distanceMeters: route.distanceMeters, durationSeconds: route.durationSeconds });
          return {
            content: JSON.stringify({
              distance_km: kilometers(route.distanceMeters),
              duration_minutes: Math.max(1, Math.round(route.durationSeconds / 60)),
              steps: route.steps.slice(0, MAX_STEPS_FOR_AI).map((step) => step.instruction),
            }),
            isError: false,
          };
        }

        return { content: `Unknown tool: ${call.name}`, isError: true };
      } catch (error) {
        if (signal.aborted) throw error;
        return { content: messageFor(error), isError: true };
      }
    },
    [],
  );

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || busy) return;

      setItems((current) => [...current, { id: nextId(), role: 'user', text }]);
      setBusy(true);

      requestRef.current?.abort();
      const request = new AbortController();
      requestRef.current = request;

      const history = [...historyRef.current, { role: 'user', content: text } as AiMessage];
      const cards: RouteCard[] = [];

      try {
        let reply = '';
        for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
          const response = await createMessage({
            system: buildSystemPrompt(originRef.current, hasLocationRef.current),
            messages: trimHistory(history),
            tools: TOOLS,
            signal: request.signal,
          });
          history.push({ role: 'assistant', content: response.content });

          const calls = response.content.filter((block): block is AiToolUseBlock => block.type === 'tool_use');
          if (response.stop_reason !== 'tool_use' || calls.length === 0) {
            reply = textOf(response.content);
            break;
          }

          const results = await Promise.all(calls.map((call) => runTool(call, cards, request.signal)));
          history.push({
            role: 'user',
            content: calls.map((call, i) => ({
              type: 'tool_result',
              tool_use_id: call.id,
              content: results[i].content,
              ...(results[i].isError ? { is_error: true } : {}),
            })),
          });
        }

        historyRef.current = trimHistory(history);
        setItems((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            text: reply || 'Sorry, I couldn’t finish that. Could you rephrase your question?',
            routes: cards.length > 0 ? cards : undefined,
          },
        ]);
      } catch (error) {
        if (request.signal.aborted) return;
        // Drop the failed turn so the next message doesn't replay a dangling tool_use.
        setItems((current) => [
          ...current,
          { id: nextId(), role: 'assistant', text: messageFor(error), error: true },
        ]);
      } finally {
        if (requestRef.current === request) setBusy(false);
      }
    },
    [busy, nextId, runTool],
  );

  const reset = useCallback(() => {
    requestRef.current?.abort();
    historyRef.current = [];
    setBusy(false);
    setItems([GREETING]);
  }, []);

  return useMemo(() => ({ items, busy, send, reset }), [items, busy, send, reset]);
}
