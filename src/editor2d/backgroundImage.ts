import { toScreen } from '../utils/geometry';

export function renderBackgroundImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
): void {
  ctx.globalAlpha = 0.2;
  const s = toScreen(14) / Math.max(img.width, img.height);
  ctx.drawImage(img, 0, 0, img.width * s, img.height * s);
  ctx.globalAlpha = 1;
}
