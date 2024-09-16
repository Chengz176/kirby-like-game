import { FRAME_SIDE, AIR_FRAME, GRASS_FRAME } from "../../constants";
import { Coord2D, RectCollider, SpawnPoints, Tile } from "../../definitions";
import { initRandNumGen } from "../../helpers";
import { NWFC } from "../NWFC";

function levelLayerWorker(
    width: number,
    height: number,
    tileset: Tile[],
    seed?: number
) {
    const randNum = initRandNumGen(seed).randNum;

    const nwfc = new NWFC(tileset, width, height, randNum);
    const airProp = randNum() * 0.2 + 0.6;

    nwfc.frameProportions = { 0: airProp, 60: (7 * (1 - airProp)) / 12 };
    const tilemap = nwfc.generateMap();
    if (tilemap !== undefined) {
        const spawnPoints = getSpawnPoints(
            tileset,
            tilemap,
            width,
            height,
            randNum
        );

        const playerSpawnPoint = spawnPoints.player[0];
        const playerIndex =
            (playerSpawnPoint.y * width + playerSpawnPoint.x) / FRAME_SIDE;

        tilemap[playerIndex] = 1;

        const doorTopLeft: Coord2D = {
            x: Math.floor(randNum() * (width - 4)),
            y: Math.floor(randNum() * (height - 2)),
        };

        const doorIndex = doorTopLeft.x + 2 + (doorTopLeft.y + 1) * width;

        for (let i = 0; i < 5; i++) {
            const x = doorTopLeft.x + i;
            for (let j = 0; j < 3; j++) {
                const y = doorTopLeft.y + j;
                const index = y * width + x;
                tilemap[index] = 0;
            }
        }

        const isAirTile = Array<boolean>(tilemap.length).fill(false);

        for (let i = 0; i < tilemap.length; i++) {
            const tile = tileset[tilemap[i]];
            if (tile.frame === AIR_FRAME || tile.frame === GRASS_FRAME) {
                isAirTile[i] = true;
            }
        }

        while (!pathToDoor(playerIndex, doorIndex, width, isAirTile));

        for (let i = 0; i < tilemap.length; i++) {
            if (
                tileset[tilemap[i]].frame === GRASS_FRAME &&
                (i >= (height - 1) * width || isAirTile[i + width])
            ) {
                // Filter out floating grass frame
                tilemap[i] = 0;
            }
        }

        return {
            tilemap,
            doorTopLeft,
            colliders: getRectColliders(tilemap, width, height, isAirTile),
            spawnPoints,
            isAirTile,
        };
    }
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
            levelLayerWorker(
                width,
                height,
                tileset,
                e.data.hasOwnProperty("seed") ? e.data["seed"] : undefined
            )
        );
    }
};

function getRectColliders(
    tilemap: number[],
    width: number,
    height: number,
    isSpecialTile: boolean[]
) {
    const colliders: RectCollider[] = [];
    let possibleMerge: RectCollider[] = [];
    let temp: RectCollider[] = [];
    if (height > 0 && width > 0) {
        for (let i = 0; i < tilemap.length; i++) {
            const row = Math.floor(i / width);
            const col = i % width;
            if (!isSpecialTile[i]) {
                while ((i + 1) % width > 0 && !isSpecialTile[i + 1]) {
                    i++;
                }

                const endCol = (i % width) + 1;
                temp.push({
                    x: FRAME_SIDE * col,
                    y: FRAME_SIDE * row,
                    width: FRAME_SIDE * (endCol - col),
                    height: FRAME_SIDE,
                });
            }

            if ((i + 1) % width === 0) {
                let j = possibleMerge.length - 1;
                let k = temp.length - 1;
                while (j > -1 && k > -1) {
                    const bottomLeftX = possibleMerge[j].x;

                    const bottomRightX = bottomLeftX + possibleMerge[j].width;

                    const topLeftX = temp[k].x;

                    const topRightX = topLeftX + temp[k].width;

                    if (topRightX < bottomRightX) {
                        colliders.push(possibleMerge[j]);
                        j--;
                        continue;
                    }

                    if (
                        bottomRightX === topRightX &&
                        bottomLeftX === topLeftX
                    ) {
                        temp[k].x = possibleMerge[j].x;
                        temp[k].y = possibleMerge[j].y;
                        temp[k].height += possibleMerge[j].height;
                        j--;
                    }

                    k--;
                }

                while (j > -1) {
                    colliders.push(possibleMerge[j]);
                    j--;
                }

                possibleMerge = temp;
                temp = [];
            }
        }
        while (possibleMerge.length > 0) {
            colliders.push(possibleMerge.pop()!);
        }
    }
    return colliders;
}

function getSpawnPoints(
    tileset: Tile[],
    tilemap: number[],
    width: number,
    height: number,
    randNumGen: () => number
) {
    const spawnPoints: SpawnPoints = {};

    const grassPos: Coord2D[] = [];

    const playerSpawnPoint: Coord2D = {
        x: -1,
        y: -1,
    };
    let spawnPointCount = 0;

    for (let i = 0; i < tilemap.length; i++) {
        let row = Math.floor(i / width);
        let col = i % width;
        const tile = tileset[tilemap[i]];
        switch (tile.frame) {
            case AIR_FRAME:
                if (i + width < tilemap.length) {
                    const bottom = tileset[tilemap[i + width]];
                    if (
                        bottom.frame !== AIR_FRAME &&
                        bottom.frame !== GRASS_FRAME &&
                        Math.floor(randNumGen() * ++spawnPointCount) === 0
                    ) {
                        playerSpawnPoint.x = FRAME_SIDE * col;
                        playerSpawnPoint.y = FRAME_SIDE * row;
                    }
                }
                break;
            case GRASS_FRAME:
                // shuffle
                const j = Math.floor(randNumGen() * (grassPos.length + 1));
                if (j === grassPos.length) {
                    grassPos.push({
                        x: FRAME_SIDE * col,
                        y: FRAME_SIDE * row,
                    });
                } else {
                    grassPos.push(Object.assign({}, grassPos[j]));
                    grassPos[j] = {
                        x: FRAME_SIDE * col,
                        y: FRAME_SIDE * row,
                    };
                }
                break;
            default:
                break;
        }
    }

    if (playerSpawnPoint.x === -1) {
        if (grassPos.length === 0) {
            playerSpawnPoint.x = Math.floor(randNumGen() * width);
            playerSpawnPoint.y = Math.floor(randNumGen() * height);
        } else {
            playerSpawnPoint.x = grassPos[grassPos.length - 1].x;
            playerSpawnPoint.y = grassPos[grassPos.length - 1].y;
            grassPos.pop();
        }
    }

    spawnPoints.player = [playerSpawnPoint];

    const maxEnemy = Math.floor(tilemap.length / 300);
    const guyPosEnd = Math.floor(grassPos.length / 10);
    const flamePosEnd = Math.floor((2 * grassPos.length) / 10);
    spawnPoints.guy = grassPos.slice(0, Math.min(maxEnemy, guyPosEnd));
    spawnPoints.flame = grassPos.slice(
        guyPosEnd,
        Math.min(guyPosEnd + maxEnemy, flamePosEnd)
    );
    spawnPoints.bird = grassPos.slice(
        flamePosEnd,
        Math.min(flamePosEnd + maxEnemy, Math.floor((3 * grassPos.length) / 10))
    );

    return spawnPoints;
}

function pathToDoor(
    startIndex: number,
    endIndex: number,
    width: number,
    isAirTile: boolean[]
) {
    const visited = Array<boolean>(isAirTile.length).fill(false);

    const queue: number[] = [startIndex];
    let preClosest = -1;
    let closest = -1;
    let minDist = Number.MAX_SAFE_INTEGER;

    const endCoord: Coord2D = {
        x: endIndex % width,
        y: Math.floor(endIndex / width),
    };

    do {
        while (queue.length > 0) {
            const currIndex = queue.shift();
            if (currIndex !== undefined) {
                if (visited[endIndex]) {
                    break;
                }

                const adjacents = [
                    Math.max(-1, currIndex - width),
                    (currIndex + 1) % width === 0 ? -1 : currIndex + 1,
                    currIndex + width >= isAirTile.length
                        ? -1
                        : currIndex + width,
                    currIndex % width === 0 ? -1 : currIndex - 1,
                ];

                for (const adjacent of adjacents) {
                    if (adjacent > -1 && !visited[adjacent]) {
                        if (isAirTile[adjacent]) {
                            visited[adjacent] = true;
                            queue.push(adjacent);
                        } else {
                            const adjacentCoord: Coord2D = {
                                x: adjacent % width,
                                y: Math.floor(adjacent / width),
                            };

                            const dist =
                                Math.abs(adjacentCoord.x - endCoord.x) +
                                Math.abs(adjacentCoord.y - endCoord.y);

                            if (dist < minDist) {
                                preClosest = closest;
                                closest = adjacent;
                                minDist = dist;
                            }
                        }
                    }
                }
            }
        }

        if (visited[endIndex]) {
            break;
        }

        if (preClosest !== closest) {
            queue.push(closest);
            isAirTile[closest] = true;
            preClosest = closest;
        }
    } while (queue.length > 0);

    return visited[endIndex];
}
