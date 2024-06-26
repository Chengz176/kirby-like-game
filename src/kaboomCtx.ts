import kaboom from 'kaboom';
import { scale } from './constants';

export const k = kaboom({
    width: 256 * scale,
    height: 144 * scale,
    scale,
    letterbox: false,
    stretch: true,
    global: false,
    canvas: document.getElementById("game") as HTMLCanvasElement,
});