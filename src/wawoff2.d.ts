// wawoff2 ships no types. The build uses only decompress (woff2 to TrueType).
declare module 'wawoff2' {
  export function decompress(woff2: Uint8Array): Promise<Uint8Array>;
}
