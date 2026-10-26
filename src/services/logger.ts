export function devLog(message: string): void {
  if (__DEV__) console.log(`TourAIsm] ${message}`);
}
