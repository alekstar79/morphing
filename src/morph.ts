import { MorphEngine } from '@/morph-engine'

interface MorphOptions {
  imgWidth?: number;
  imgHeight?: number;
  className?: string;
  pointCount?: number;
  pointRadius?: number;
  morphSpeed?: number;
  autoPlay?: boolean;
  loop?: boolean;
  showProgress?: boolean;
  transitionDuration?: number;
  backgroundColor?: string;
  canvasStyle?: Record<string, string>;
}

/**
* Advanced Morphing TS (support for multiple images)
* @author Aleksey Tarasenko <alekstar79@yandex.ru>
*/

export function useMorph(
  container: HTMLElement = document.body,
  imageUrls: string[] = [],
  options: MorphOptions = {}
): MorphEngine | null {
  if (!container) {
    console.error('Container element not passed')
    return null
  }

  const engine = new MorphEngine(container, options)

  if (imageUrls && imageUrls.length > 0) {
    engine
      .loadImages(imageUrls)
      .catch(error => {
        console.error('Failed to load images:', error)
      })
  }

  return engine
}

export { MorphEngine }
