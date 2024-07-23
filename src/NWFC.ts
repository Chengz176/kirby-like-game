import { Tile } from "./definitions";
import { SimpleTiledModel } from "./SimpleTiledModel";

// Reference: https://doi.org/10.48550/arXiv.2308.07307
export class NWFC {
    #width: number;
    #height: number;
    #dimension: number;
    #tileset: Tile[];
    #SUBGRID_SIDE = 5;
    #frameProportions: {[key: number]: number} = {};
    #frames = new Set<number>();

    constructor(tileset: Tile[], width: number, height: number) {
        this.#tileset = tileset;
        this.#width = width;
        this.#height = height;
        this.#dimension = width * height;
        
        const model = SimpleTiledModel();
        model.init(this.#tileset, 1, 1);
        const frames = model.getFrames();
        if (frames !== undefined) {
            frames.forEach(frame => this.#frames.add(frame));
            const w = 1 / this.#frames.size;
            for (const frame of this.#frames) {
                this.#frameProportions[frame] = w;
            }
        }
    }

    #isSubComplete() {
        const edgesWE = new Set<string>();
        const edgesNS = new Set<string>();

        const pairWE = new Set<string>();
        const pairNS = new Set<string>();
        const pairNW = new Set<string>();
        const pairSE = new Set<string>();

        for (const tile of this.#tileset) {
            const n = tile.edges[0].toString();
            const e = tile.edges[1].toString();
            const s = tile.edges[2].toString();
            const w = tile.edges[3].toString(); 

            edgesWE.add(w);
            edgesWE.add(e);
            edgesNS.add(n);
            edgesNS.add(s);

            pairWE.add(w + ',' + e);
            pairNS.add(n + ',' + s);
            pairNW.add(n + ',' + w);
            pairSE.add(s + ',' + e);
        }

        for (const w of edgesWE) {
            for (const e of edgesWE) {
                if (!pairWE.has(w + ',' + e)) {
                    return false;
                }
            }
        }

        for (const n of edgesNS) {
            for (const s of edgesNS) {
                if (!pairNS.has(n + ',' + s)) {
                    return false;
                }
            }
        }

        for (const n of edgesNS) {
            for (const w of edgesWE) {
                if (!pairNW.has(n + ',' + w)) {
                    return false;
                }
            }
        }

        for (const s of edgesNS) {
            for (const e of edgesWE) {
                if (!pairSE.has(s + ',' + e)) {
                    return false;
                }
            }
        }

        return true;
    }

    #simpleTiledModelGenMap(width: number, height: number, 
                            fixedTiles?: {index: number, tile: number}[]) {
        const model = SimpleTiledModel();
                
        model.init(this.#tileset, width, height);
        
        if (!model.setProportion(this.#frameProportions)) {
            return;
        }

        if (fixedTiles !== undefined) {
            if (!model.fixTiles(fixedTiles)) {
                return;
            }
        }

        const map = model.generateMap();
        if (map === undefined || map.length === 0) {
            console.log("NWFC: map generation failed");
        }
        return map;
    }

    #genSubgrid(map: number[], topLeftIndex: number) {
        if (topLeftIndex >= this.#dimension) {
            console.log("NWFC: index out of the range");
            return;
        }

        const fixedTiles: {index: number, tile: number}[] = [];
        const rowEnd = Math.min(this.#dimension,
                                topLeftIndex + (this.#width * this.#SUBGRID_SIDE));
        const colEnd = Math.min(this.#width,
                                (topLeftIndex % this.#width) + this.#SUBGRID_SIDE);

        const width = colEnd - (topLeftIndex % this.#width);
        const height = Math.ceil((rowEnd - topLeftIndex) / this.#width);

        for (let row = 0; row < height; row++) {
            const tile = map[topLeftIndex + (row * this.#width)];
            if (tile > -1) {
                fixedTiles.push({
                    index: row * width,
                    tile
                });
            }
        }

        for (let col = 1; col < width; col++) {
            const tile = map[topLeftIndex + col];
            if (tile > -1) {
                fixedTiles.push({
                    index: col,
                    tile
                });
            }
        }

        const subgrid = this.#simpleTiledModelGenMap(width, height, fixedTiles);
        if (subgrid !== undefined) {
            for (let i = 0; i < width * height; i++) {
                const index = topLeftIndex +
                                (Math.floor(i / width) * this.#width) +
                                (i % width);
                map[index] = subgrid[i];
            }
            return true;
        }

        console.log("NWFC: failed to generate subgrid with topLeftIndex: ", topLeftIndex);
        return false;
    }

    validateMap(map: number[]) {
        const fixedTiles: {index: number, tile: number}[] = [];
        map.map((tile, index) => {
            fixedTiles.push({index, tile});
        })

        const test = this.#simpleTiledModelGenMap(this.#width, this.#height, fixedTiles);
        if (test !== undefined) {
            return true;
        }

        return false;
    }

    set width(newWidth: number) {
        this.#width = newWidth;
        this.#dimension = this.#width * this.#height;
    }

    set height(newHeight: number) {
        this.#height = newHeight;
        this.#dimension = this.#width * this.#height;
    }

    set frameProportions(newProportions: {[key: number]: number}) {
        let total = 0;
        for (const frame of Object.keys(newProportions)) {
            const frameNum = Number(frame);
            if (!this.#frames.has(frameNum)) {
                console.log("NWFC: Invalid frame:", frame);
                return;
            }

            if (newProportions[frameNum] < 0 || newProportions[frameNum] > 1) {
                console.log("NWFC: Invalid proportion for frame:", frame);
                return;
            }

            total += newProportions[frameNum];

            if (total > 1) {
                console.log('Proportion sum greater than 1');
                return;
            }
        }

        this.#frameProportions = Object.assign({}, newProportions);

        const diffSize = this.#frames.size - Object.keys(this.#frameProportions).length;
        if (diffSize > 0) {
            const w = (1 - total) / diffSize;
            for (const frame of this.#frames) {
                if (!this.#frameProportions.hasOwnProperty(frame)) {
                    this.#frameProportions[frame] = w;
                }
            }   
        }

        console.log(this.#frameProportions);
    }

    generateMap(allowFallback=true) {
        if (!this.#isSubComplete()) {
            console.log("NWFC: The tileset is not sub-complete.\n");

            if (allowFallback) {
                console.log("Generate map with SimpleTiledModel only");
                return this.#simpleTiledModelGenMap(this.#width, this.#height);
            }

            console.log("Fallback is disable. Failed to generate map");
            return;
        }

        const map = Array<number>(this.#dimension).fill(-1);
        for (let i = 0; i < this.#dimension; i += this.#width * (this.#SUBGRID_SIDE - 1)) {
            for (let j = 0; j < this.#width; j += this.#SUBGRID_SIDE - 1) {
                if(!this.#genSubgrid(map, i + j)) {
                    return;
                }
            }
        }

        return map;
    }
}