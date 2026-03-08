export interface ImagePreprocessResult {
  width: number;
  height: number;
  data: Uint8Array;
  channels: number;
}

export async function preprocess(_path: string): Promise<ImagePreprocessResult | null> {
  return null;
}
