import { EdgesCount, Tile } from "../definitions";

// Reference: https://github.com/mxgmn/WaveFunctionCollapse
export const SimpleTiledModel = () => {
    // Members
    let isInitialized = false;

    let randNumGen: () => number;

    let width: number;
    let height: number;
    let size: number;

    let tileset: Tile[];
    let tilesetSize: number;

    const edgesW: EdgesCount = {};
    const edgesE: EdgesCount = {};
    const edgesN: EdgesCount = {};
    const edgesS: EdgesCount = {};
    let edgesWCounts: EdgesCount[];
    let edgesECounts: EdgesCount[];
    let edgesNCounts: EdgesCount[];
    let edgesSCounts: EdgesCount[];

    const proportion: {
        [key: number]: {
            count: number;
            weight: number;
        };
    } = {};

    let proportionSums: number[];
    let plogpSums: number[];

    let frames: number[];
    let framesCount: number;

    let possibleTiles: number[][];
    let possibleTilesSize: number;

    let tileMap: number[];
    let fixedTilesCount: number = 0;

    let history: {
        stack: number[];
        indicesChanged: number[][];
        possibleTilesChanged: number[][];
    };

    // Methods
    const Scaler = (sum: number) => {
        if (sum > 0) {
            return (value: number) => value / sum;
        }

        return (_: number) => 1;
    };

    const initSums = () => {
        let proportionSum = 0;
        let plogpsum = 0;
        for (const { count, weight } of Object.values(proportion)) {
            if (weight > 0) {
                proportionSum += count * weight;
                plogpsum += count * (weight * Math.log(weight));
            }
        }
        proportionSums.fill(proportionSum);
        plogpSums.fill(plogpsum);
    };

    const hasInitializedWrapper = <T, U>(f: (...args: T[]) => U) => {
        return (...args: T[]) => {
            if (!isInitialized) {
                console.log(
                    "SimpleTiledModel: The model has not initialized.\n" +
                        "Uses model.init() to initialize the model."
                );
                return;
            }

            return f(...args);
        };
    };

    const getAdjacent = (currIndex: number) => {
        return [
            Math.max(-1, currIndex - width),
            (currIndex + 1) % width === 0 ? -1 : currIndex + 1,
            currIndex + width >= possibleTilesSize ? -1 : currIndex + width,
            currIndex % width === 0 ? -1 : currIndex - 1,
        ];
    };

    const getEndOf = <T>(arr: T[]) => {
        return arr[arr.length - 1];
    };

    const edgeAdd = (edgesCount: EdgesCount, edge: number) => {
        if (edgesCount.hasOwnProperty(edge)) {
            edgesCount[edge]++;
        } else {
            edgesCount[edge] = 1;
        }
    };

    const updateEdgesCounts = (index: number, tile: number, value: -1 | 1) => {
        const updatedTile = tileset[tile];
        edgesNCounts[index][updatedTile.edges[0]] += value;
        edgesECounts[index][updatedTile.edges[1]] += value;
        edgesSCounts[index][updatedTile.edges[2]] += value;
        edgesWCounts[index][updatedTile.edges[3]] += value;
    };

    const getAdjacentEdgeCount = (
        direction: number,
        currIndex: number,
        tile: number
    ) => {
        let adjacentEdgeCount = 0;
        switch (direction) {
            case 0:
                adjacentEdgeCount =
                    edgesNCounts[currIndex][tileset[tile].edges[2]];
                break;
            case 1:
                adjacentEdgeCount =
                    edgesECounts[currIndex][tileset[tile].edges[3]];
                break;
            case 2:
                adjacentEdgeCount =
                    edgesSCounts[currIndex][tileset[tile].edges[0]];
                break;
            case 3:
                adjacentEdgeCount =
                    edgesWCounts[currIndex][tileset[tile].edges[1]];
                break;
            default:
                break;
        }

        return adjacentEdgeCount === undefined ? 0 : adjacentEdgeCount;
    };

    const swap = (arr: number[], index1: number, index2: number) => {
        const temp = arr[index1];
        arr[index1] = arr[index2];
        arr[index2] = temp;
    };

    const removeTile = (
        index: number,
        tileIndex: number,
        endTileIndex: number
    ) => {
        updateEdgesCounts(index, possibleTiles[index][tileIndex], -1);
        const removedTile = tileset[possibleTiles[index][tileIndex]];
        const p = proportion[removedTile.frame].weight;
        if (p > 0) {
            proportionSums[index] -= p;
            plogpSums[index] -= p * Math.log(p);
        }

        swap(possibleTiles[index], tileIndex, endTileIndex);
    };

    const computeEntropy = (index: number) => {
        if (getEndOf(history.possibleTilesChanged[index]) < 0) {
            return -1;
        }

        if (proportionSums[index] <= 0) {
            return 0;
        }
        // log(`proportionSum`) - `plogpSum` / `proportionSum`
        return (
            Math.log(proportionSums[index]) -
            plogpSums[index] / proportionSums[index]
        );
    };

    const addPossibleFixedTiles = () => {
        let indices: number[] = [];
        let minEntropy = Number.MAX_VALUE;
        for (let i = 0; i < possibleTiles.length; i++) {
            if (tileMap[i] === -1) {
                const entropy = computeEntropy(i);
                if (entropy === -1) {
                    console.log("SimpleTiledModel: Entropy Error");
                    return false;
                }
                if (entropy < minEntropy) {
                    minEntropy = entropy;
                    indices = [i];
                } else if (entropy === minEntropy) {
                    indices.push(i);
                }
            }
        }

        if (indices.length === 0) {
            console.log("SimpleTiledModel: No possible fixed tile");
            return false;
        }

        // Shuffle the indices
        for (let i = 0; i < indices.length; i++) {
            swap(
                indices,
                i,
                i + Math.floor(randNumGen() * (indices.length - i))
            );
            history.stack.push(indices[i]);
        }

        return true;
    };

    const selectTile = () => {
        const index = history.stack.pop();

        if (index !== undefined) {
            const comp = randNumGen() * proportionSums[index];

            let temp = 0;
            for (
                let i = 0;
                i <= getEndOf(history.possibleTilesChanged[index]);
                i++
            ) {
                const tile = tileset[possibleTiles[index][i]];
                temp += proportion[tile.frame].weight;
                if (temp >= comp) {
                    return {
                        index,
                        tile: possibleTiles[index][i],
                    };
                }
            }
        }

        console.log("SimpleTiledModel: Error on selectTile():", index);

        return {
            index: -1,
            tile: -1,
        };
    };

    const propagate = (startIndex: number) => {
        const queue = [startIndex];

        while (queue.length > 0) {
            const currIndex = queue.shift();
            if (currIndex !== undefined) {
                const adjacent = getAdjacent(currIndex);
                for (let direction = 0; direction < 4; direction++) {
                    const adjacentIndex = adjacent[direction];
                    if (adjacentIndex > -1) {
                        let hasImpact = false;
                        let end = getEndOf(
                            history.possibleTilesChanged[adjacentIndex]
                        );
                        for (
                            let tileIndex = getEndOf(
                                history.possibleTilesChanged[adjacentIndex]
                            );
                            tileIndex > -1;
                            tileIndex--
                        ) {
                            const tile =
                                possibleTiles[adjacentIndex][tileIndex];
                            if (
                                getAdjacentEdgeCount(
                                    direction,
                                    currIndex,
                                    tile
                                ) === 0
                            ) {
                                removeTile(adjacentIndex, tileIndex, end);
                                end--;

                                if (
                                    edgesNCounts[adjacentIndex][
                                        tileset[tile].edges[0]
                                    ] == 0 ||
                                    edgesECounts[adjacentIndex][
                                        tileset[tile].edges[1]
                                    ] == 0 ||
                                    edgesSCounts[adjacentIndex][
                                        tileset[tile].edges[2]
                                    ] == 0 ||
                                    edgesWCounts[adjacentIndex][
                                        tileset[tile].edges[3]
                                    ] == 0
                                ) {
                                    hasImpact = true;
                                }
                            }
                        }

                        if (hasImpact) {
                            queue.push(adjacentIndex);
                        }

                        if (
                            end <
                            getEndOf(
                                history.possibleTilesChanged[adjacentIndex]
                            )
                        ) {
                            history.possibleTilesChanged[adjacentIndex].push(
                                end
                            );
                            getEndOf(history.indicesChanged).push(
                                adjacentIndex
                            );
                        }

                        if (
                            getEndOf(
                                history.possibleTilesChanged[adjacentIndex]
                            ) < 0
                        ) {
                            backTrack();
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    };

    const fixTile = (index: number, tile: number) => {
        let currTileIndex = getEndOf(history.possibleTilesChanged[index]);
        while (currTileIndex > -1) {
            if (possibleTiles[index][currTileIndex] == tile) {
                break;
            }
            currTileIndex--;
        }

        if (currTileIndex == -1) {
            console.log(
                `SimpleTiledModel: Tile ${tile} at index ${index} is not in the tileset ` +
                    "or does not fit with other fixed tiles"
            );
            return false;
        }

        swap(possibleTiles[index], 0, currTileIndex);
        currTileIndex = getEndOf(history.possibleTilesChanged[index]);
        while (currTileIndex > 0) {
            removeTile(index, currTileIndex, currTileIndex);
            currTileIndex--;
        }

        history.possibleTilesChanged[index].push(0);
        history.indicesChanged.push([index]);

        tileMap[index] = possibleTiles[index][0];

        fixedTilesCount++;

        if (propagate(index)) {
            history.stack.push(-1);
            return true;
        }

        return false;
    };

    const backTrack = () => {
        let stackTop;

        do {
            let lastIndicesChanged = history.indicesChanged.pop();

            if (lastIndicesChanged === undefined) {
                console.log("SimpleTiledModel: Cannot backtrack");
                return false;
            }

            const fixedTileIndex = lastIndicesChanged[0];

            tileMap[fixedTileIndex] = -1;
            fixedTilesCount--;
            while (lastIndicesChanged.length > 0) {
                const index = lastIndicesChanged.pop();
                if (index !== undefined) {
                    let currTileIndex =
                        history.possibleTilesChanged[index].pop();
                    const end = getEndOf(history.possibleTilesChanged[index]);
                    if (currTileIndex !== undefined) {
                        currTileIndex++;
                        while (currTileIndex <= end) {
                            const tile =
                                tileset[possibleTiles[index][currTileIndex]];

                            // Backtrack proportionSum and plogpSum
                            const p = proportion[tile.frame].weight;
                            if (p > 0) {
                                proportionSums[index] += p;
                                plogpSums[index] += p * Math.log(p);
                            }

                            // Backtrack edges[N/E/S/W]Counts
                            updateEdgesCounts(
                                index,
                                possibleTiles[index][currTileIndex],
                                1
                            );

                            currTileIndex++;
                        }
                    }
                }
            }

            const fixedTileEnd = getEndOf(
                history.possibleTilesChanged[fixedTileIndex]
            );
            if (fixedTileEnd > 0) {
                removeTile(fixedTileIndex, 0, fixedTileEnd);
                history.possibleTilesChanged[fixedTileIndex].push(
                    fixedTileEnd - 1
                );
                history.stack.push(fixedTileIndex);
            }

            stackTop = getEndOf(history.stack);
            if (stackTop === -1) {
                history.stack.pop();
            }
        } while (stackTop === -1);

        return history.stack.length > 0;
    };

    return {
        init(tilesetData: Tile[], initWidth = 5, initHeight = 5, initRandNumGen: () => number) {
            width = initWidth;
            height = initHeight;
            size = width * height;

            randNumGen = initRandNumGen;

            tileset = tilesetData;
            tilesetSize = tileset.length;

            for (const tile of tileset) {
                if (proportion.hasOwnProperty(tile.frame)) {
                    proportion[tile.frame].count++;
                } else {
                    proportion[tile.frame] = {
                        count: 1,
                        weight: 1 / tilesetSize,
                    };
                }

                edgeAdd(edgesN, tile.edges[0]);
                edgeAdd(edgesE, tile.edges[1]);
                edgeAdd(edgesS, tile.edges[2]);
                edgeAdd(edgesW, tile.edges[3]);
            }

            frames = Object.keys(proportion).map((frame) => Number(frame));
            framesCount = frames.length;

            edgesNCounts = Array<EdgesCount>(size)
                .fill({})
                .map(() => Object.assign({}, edgesN));
            edgesECounts = Array<EdgesCount>(size)
                .fill({})
                .map(() => Object.assign({}, edgesE));
            edgesSCounts = Array<EdgesCount>(size)
                .fill({})
                .map(() => Object.assign({}, edgesS));
            edgesWCounts = Array<EdgesCount>(size)
                .fill({})
                .map(() => Object.assign({}, edgesW));

            possibleTiles = Array<Array<number>>(size)
                .fill([])
                .map(() => {
                    return Array<number>(tilesetSize)
                        .fill(0)
                        .map((_, ind) => ind);
                });
            possibleTilesSize = possibleTiles.length;

            tileMap = Array<number>(size).fill(-1);

            history = {
                stack: Array<number>(),
                indicesChanged: Array<Array<number>>(),
                possibleTilesChanged: Array<Array<number>>(possibleTilesSize)
                    .fill([])
                    .map(() => [tilesetSize - 1]),
            };

            proportionSums = Array<number>(size);
            plogpSums = Array<number>(size);
            initSums();

            isInitialized = true;
        },

        setProportion: hasInitializedWrapper(
            (newProportion: { [frame: number]: number }) => {
                const count = Object.keys(newProportion).length;
                if (count !== framesCount) {
                    console.log(
                        "SimpleTiledModel: The size did not match the number of unique frames in the tileset"
                    );
                    return false;
                }

                let sum = 0;
                let value = 0;
                for (const frame of Object.keys(newProportion)) {
                    const frameNum = Number(frame);
                    if (!frames.includes(frameNum)) {
                        console.log("SimpleTiledModel: Invalid frame:", frame);
                        return false;
                    }

                    value = newProportion[frameNum];
                    if (value < 0) {
                        console.log(
                            "SimpleTiledModel: Negative proportion for frame:",
                            frame
                        );
                        return false;
                    }

                    sum += value;
                }

                const scaler = Scaler(sum);

                for (const frame of Object.keys(newProportion)) {
                    const frameNum = Number(frame);
                    proportion[frameNum].weight =
                        scaler(newProportion[frameNum]) /
                        proportion[frameNum].count;
                }

                initSums();
                return true;
            }
        ),

        fixTiles: hasInitializedWrapper(
            (fixedTiles: { index: number; tile: number }[]) => {
                for (const { index, tile } of fixedTiles) {
                    if (!fixTile(index, tile)) {
                        return false;
                    }
                }

                history.stack = [];

                return true;
            }
        ),

        generateMap: hasInitializedWrapper(() => {
            while (fixedTilesCount < size) {
                if (!addPossibleFixedTiles()) {
                    backTrack();
                }

                let index_tile = selectTile();
                while (
                    index_tile.index > -1 &&
                    !fixTile(index_tile.index, index_tile.tile)
                ) {
                    index_tile = selectTile();
                }

                if (index_tile.index === -1 || fixedTilesCount < 0) {
                    console.log("SimpleTiledModel: Map generation Failed");
                    return;
                }
            }

            return tileMap.slice();
        }),

        getFrames: hasInitializedWrapper(() => {
            return frames.slice();
        }),

        getProportion: hasInitializedWrapper(() => {
            return Object.assign({}, proportion);
        }),
    };
};
