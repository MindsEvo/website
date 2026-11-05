export function publicUrl(path: string): string {
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(`../${trimmedPath}`, import.meta.url).href;
}
