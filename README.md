# TourAIsm

Mobile app for commuters in the Philippines. The app opens on a full-screen map after onboarding, with a bottom tab bar for Home, Map, Profile, and Settings.

## Setup

```bash
npm install
cp .env.example .env
npx expo start
```

Dependencies were added with `npx expo install`, so versions match Expo SDK 58.

### OpenRouteService key

Routing and place search use OpenRouteService. Get a free key at https://openrouteservice.org, then set it in `.env`:

```bash
EXPO_PUBLIC_ORS_API_KEY=your-key
```

Restart `npx expo start` after changing `.env`. The key is bundled into the app, so move the ORS calls behind a backend before production. Free autocomplete quota is about 1,000 requests per day.

### Fare rates

Fare values are placeholders, not official rates. Edit `src/config/fare.ts` (`baseFare`, `baseDistanceKm`, `perAdditionalKm`, `minimumFare`, `slowdownFactor`). The formula lives in `src/services/fare.ts`.

Verification commands:

```bash
npx tsc --noEmit
npx expo-doctor
```

## Structure

- `App.tsx`: loads the saved theme, profile, and `onboarding_done_v1` flag, then switches between onboarding and the app shell. Renders `ThemeTransition` on top.
- `src/theme.ts`: `APP_NAME`, light and dark palettes, shadows, radii, and typography. Colors are never imported directly.
- `src/hooks/useTheme.ts`: theme store (`light`, `dark`, or `system`, persisted to `theme_mode_v1`), `useTheme()`, `toggleTheme()`, `setThemeMode()`, and `makeStyles()`, which builds a per-scheme StyleSheet hook. Every component styles itself with `makeStyles`.
- `src/components/ThemeTransition.tsx`: fades a veil in the new background color, swaps the theme under it, then fades out. Also sets the status bar and root background.
- `src/components/ThemeToggle.tsx`: sun and moon button used on Home and the map.
- `src/navigation/AppShell.tsx`: owns the active tab, map type, map layout, location, route, and navigation state. The tab bar hides while the map is full screen or navigating.
- `src/screens/HomeScreen.tsx`: greeting with avatar and theme toggle, "Where to?" search, trip preview card (map, fare, time, distance, arrival, Start), recent places, fare estimator, travel tips.
- `src/screens/MapScreen.tsx`: full-bleed map with two modes. Browse: search, controls, and `RouteSheet`. Navigation: `NavigationBanner` (next turn and "Then"), camera that follows the user with heading and tilt, speed bubble, `NavigationFooter` (remaining time, distance, arrival, fare, exit). Dragging the map stops following until "Re-center". Off-route positions trigger a reroute at most every 20 seconds.
- `src/hooks/useNavigationProgress.ts`: snaps the user to the route and returns the next maneuver, distance to it, remaining distance and time, off-route, and arrived.
- `src/config/mapStyles.ts`: Google Maps light and dark styles (Android). iOS Apple Maps follows `userInterfaceStyle`.
- `src/components/map/`: `RouteSheet`, `NavigationHud`, `StepIcon`, `RouteLayer` (route line and destination pin), `MapControls`, `PlaceSearch` (recent places when empty), `UserMarker`, `NoticeBanner`.
- `src/hooks/useRoute.ts`: route state, plus `reroute()` that keeps the old route on screen while fetching.
- `src/hooks/useRecentPlaces.ts`: last 5 destinations in `recent_places_v1`.
- `src/utils/route.ts`: region, formatting, distance, and route snapping helpers.
- `src/services/`: `routing.ts` (ORS directions with turn-by-turn steps), `places.ts` (ORS geocoding), `fare.ts` (fare and travel time), `ors.ts` (shared request helper and error messages).
- `src/data/characters.ts`, `src/components/character/SpriteCharacter.tsx`, `assets/characters/`: sprite characters.
- `src/config/fare.ts`: fare placeholder values. `src/config/map.ts`: `DEFAULT_CENTER`.

## Reset onboarding

Open the Settings tab and press "Replay onboarding" under the Developer section. It clears the flag and replays the onboarding flow.
