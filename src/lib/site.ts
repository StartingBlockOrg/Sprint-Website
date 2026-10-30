export const site = {
  name: 'Sprint',
  description: 'Sprint for iPhone and Apple Watch: track sprint training, timed from your wrist.',
  // The live App Store listing. Set to null to bring back the button's "coming soon" state.
  appStoreUrl: 'https://apps.apple.com/gb/app/sprint-watch-sprint-tracker/id6820784230' as string | null,
};

/** Prefixes a site path with the configured base path, so links survive the move to a custom domain. */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}
