import kaboom from "kaboom";
import { SCALE } from "./constants";

export const k = kaboom({
    width: 256 * SCALE,
    height: 144 * SCALE,
    scale: SCALE,
    letterbox: false,
    stretch: true,
    global: false,
    canvas: document.getElementById("game") as HTMLCanvasElement,
});
