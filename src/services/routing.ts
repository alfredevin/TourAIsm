import { assertOk, orsFetch, SERVICE_ERROR_MESSAGES, ServiceError } from './ors';

export type LatLng = { latitude: number; longitude: number };

// ORS maneuver codes: https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/instruction-types
export type StepType =
  | 'left'
  | 'right'
  | 'sharpLeft'
  | 'sharpRight'
  | 'slightLeft'
  | 'slightRight'
  | 'straight'
  | 'roundabout'
  | 'uturn'
  | 'arrive'
  | 'depart'
  | 'keepLeft'
  | 'keepRight';

export type RouteStep = {
  type: StepType;
  instruction: string;
  street: string | null;
  distanceMeters: number;
  durationSeconds: number;
  // Index range of this step in Route.coordinates.
  startIndex: number;
  endIndex: number;
};

export type Route = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
};

type OrsStep = {
  type: number;
  instruction: string;
  name?: string;
  distance: number;
  duration: number;
  way_points: [number, number];
};

type OrsDirectionsResponse = {
  features: {
    geometry: { coordinates: [number, number][] };
    properties: {
      summary: { distance?: number; duration?: number };
      segments?: { steps?: OrsStep[] }[];
    };
  }[];
};

const STEP_TYPES: Record<number, StepType> = {
  0: 'left',
  1: 'right',
  2: 'sharpLeft',
  3: 'sharpRight',
  4: 'slightLeft',
  5: 'slightRight',
  6: 'straight',
  7: 'roundabout',
  8: 'roundabout',
  9: 'uturn',
  10: 'arrive',
  11: 'depart',
  12: 'keepLeft',
  13: 'keepRight',
};

function toStep(step: OrsStep): RouteStep {
  const street = step.name && step.name !== '-' ? step.name : null;
  return {
    type: STEP_TYPES[step.type] ?? 'straight',
    instruction: step.instruction,
    street,
    distanceMeters: step.distance,
    durationSeconds: step.duration,
    startIndex: step.way_points[0],
    endIndex: step.way_points[1],
  };
}

export async function getRoute(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<Route> {
  const response = await orsFetch('/v2/directions/driving-car/geojson', {
    method: 'POST',
    signal,
    body: {
      coordinates: [
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
      ],
      instructions: true,
    },
  });

  if (response.status === 404) {
    throw new ServiceError('noRoute', SERVICE_ERROR_MESSAGES.noRoute);
  }
  assertOk(response);

  const data: OrsDirectionsResponse = await response.json();
  const feature = data.features[0];
  if (!feature) {
    throw new ServiceError('noRoute', SERVICE_ERROR_MESSAGES.noRoute);
  }

  const steps = (feature.properties.segments ?? []).flatMap((segment) =>
    (segment.steps ?? []).map(toStep),
  );

  return {
    coordinates: feature.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
    distanceMeters: feature.properties.summary.distance ?? 0,
    durationSeconds: feature.properties.summary.duration ?? 0,
    steps,
  };
}
