import { Tile } from "../../definitions";
import { initRandNumGen } from "../../helpers";
import { NWFC } from "../NWFC";

function backgroundLayerWorker(
    width: number,
    height: number,
    tileset: Tile[],
    seed?: number
) {
    const randNum = initRandNumGen(seed).randNum;
    const nwfc = new NWFC(tileset, width, height, randNum);
    nwfc.frameProportions = { 0: 0.95 };

    return {
        tilemap: nwfc.generateMap(),
    };
}

onmessage = (e) => {
    if (
        e.data instanceof Object &&
        e.data.hasOwnProperty("width") &&
        e.data.hasOwnProperty("height") &&
        e.data.hasOwnProperty("tileset")
    ) {
        const { width, height, tileset } = e.data;
        postMessage(
            backgroundLayerWorker(
                width,
                height,
                tileset,
                e.data.hasOwnProperty("seed") ? e.data.seed : undefined
            )
        );
    } else {
        postMessage({});
    }
};
