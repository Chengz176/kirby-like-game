import { KaboomCtx } from "kaboom";
import {
    AIR_FRAME,
    DOOR_TOP_LEFT_FRAME,
    FRAME_SIDE,
    GRASS_FRAME,
    SCALE,
    SIGN_FRAME,
} from "./constants";
import { Coord2D, RectCollider, SpawnPoints, Tile } from "./definitions";
import { NWFC } from "./map_generator/NWFC";
import { initRandNumGen } from "./helpers";

export const makeMap = async (k: KaboomCtx, seed?: number) => {
    const randNumGen = initRandNumGen(seed);

    let width: number = 50 + Math.floor(randNumGen.randNum() * 21);
    let height: number = 40 + Math.floor(randNumGen.randNum() * 11);

    // Create a map component
    const map = k.make([
        k.scale(SCALE),
        k.pos(0),
        {
            width: width * FRAME_SIDE * SCALE,
            height: height * FRAME_SIDE * SCALE,
        },
    ]);

    // Add map boundaries
    for (let i = 0; i < width; i++) {
        map.add([
            k.sprite("assets", {
                frame: 62,
            }),
            k.anchor("center"),
            k.opacity(0.5),
            k.pos(FRAME_SIDE * i, FRAME_SIDE * (height - 1)),
            k.offscreen({ hide: true }),
        ]);
        map.add([
            k.sprite("assets", {
                frame: 62,
            }),
            k.anchor("center"),
            k.rotate(180),
            k.opacity(0.5),
            k.pos(FRAME_SIDE * i, 0),
            k.offscreen({ hide: true }),
        ]);
    }

    for (let i = 0; i < height; i++) {
        map.add([
            k.sprite("assets", {
                frame: 62,
            }),
            k.anchor("center"),
            k.rotate(90),
            k.opacity(0.5),
            k.pos(0, FRAME_SIDE * i),
            k.offscreen({ hide: true }),
        ]);
        map.add([
            k.sprite("assets", {
                frame: 62,
            }),
            k.anchor("center"),
            k.rotate(270),
            k.opacity(0.5),
            k.pos(FRAME_SIDE * (width - 1), FRAME_SIDE * i),
            k.offscreen({ hide: true }),
        ]);
    }

    let spawnPoints: SpawnPoints = {};

    const backgroundLayer = makeBackgroundLayer.bind(null, k, width, height);

    const makeLayers = [
        backgroundLayer("cloud-tileset.json", randNumGen.seed()),
        backgroundLayer("pillar-tileset.json", randNumGen.seed()),
        makeLevelLayer(k, width, height, "tileset.json", spawnPoints, randNumGen.seed()),
    ];

    await Promise.all(makeLayers).then((layers) => {
        layers.forEach((layer) => map.add(layer));
    });

    return { map, spawnPoints };
};

async function makeLevelLayer(
    k: KaboomCtx,
    width: number,
    height: number,
    tilesetPath: string,
    spawnPoints: SpawnPoints,
    seed?: number
) {
    const randNum = initRandNumGen(seed).randNum;

    const map = k.make([k.pos(0)]);

    const data = await fetch(tilesetPath);
    const tileset: Tile[] = await data.json();

    const nwfc = new NWFC(tileset, width, height, randNum);
    const airProp = randNum() * 0.3 + 0.4;

    nwfc.frameProportions = { 0: airProp, 60: (7 * (1 - airProp)) / 12 };
    const tilemap = nwfc.generateMap();
    if (tilemap !== undefined) {
        Object.assign(
            spawnPoints,
            getSpawnPoints(tileset, tilemap, width, height, randNum)
        );

        const playerSpawnPoint = spawnPoints.player[0];
        const playerIndex =
            (playerSpawnPoint.y * width + playerSpawnPoint.x) / FRAME_SIDE;

        tilemap[playerIndex] = 1;

        map.add([
            k.sprite("assets", {
                frame: SIGN_FRAME - 1,
            }),
            k.anchor("center"),
            k.pos(playerSpawnPoint.x, playerSpawnPoint.y),
            k.offscreen({ hide: true }),
        ]);

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
                map.add([
                    k.sprite("assets", {
                        frame: DOOR_TOP_LEFT_FRAME + i + 9 * j - 1,
                    }),
                    k.anchor("center"),
                    k.pos(FRAME_SIDE * x, FRAME_SIDE * y),
                    k.offscreen({ hide: true }),
                ]);
            }
        }

        map.add([
            k.area({
                shape: new k.Rect(
                    k.vec2(-FRAME_SIDE / 2, -FRAME_SIDE / 2),
                    FRAME_SIDE,
                    FRAME_SIDE
                ),
                collisionIgnore: ["platform", "exit"],
            }),
            k.body({ isStatic: true }),
            k.pos(
                (doorTopLeft.x + 2) * FRAME_SIDE,
                (doorTopLeft.y + 1) * FRAME_SIDE
            ),
            k.offscreen({ hide: true }),
            "exit",
        ]);

        map.add([
            k.area({
                shape: new k.Rect(
                    k.vec2(-FRAME_SIDE / 2, -FRAME_SIDE / 2),
                    3 * FRAME_SIDE,
                    FRAME_SIDE / 3
                ),
                collisionIgnore: ["platform", "exit"],
            }),
            k.body({ isStatic: true }),
            k.pos(
                (doorTopLeft.x + 1) * FRAME_SIDE,
                (doorTopLeft.y + 2) * FRAME_SIDE
            ),
            k.offscreen({ hide: true }),
            "platform",
        ]);

        const isAirTile = Array<boolean>(tilemap.length).fill(false);

        for (let i = 0; i < tilemap.length; i++) {
            const tile = tileset[tilemap[i]];
            if (tile.frame === AIR_FRAME || tile.frame === GRASS_FRAME) {
                isAirTile[i] = true;
            }
        }

        while (
            !pathToDoor(
                playerIndex,
                doorIndex,
                width,
                isAirTile,
                tilemap,
                tileset
            )
        );

        for (let i = 0; i < tilemap.length; i++) {
            if (
                tileset[tilemap[i]].frame === GRASS_FRAME &&
                (i >= (height - 1) * width || isAirTile[i + width])
            ) {
                // Filter out floating grass frame
                tilemap[i] = 0;
            }
        }

        for (let i = 0; i < tilemap.length; i++) {
            let row = Math.floor(i / width);
            let col = i % width;
            const tile = tileset[tilemap[i]];
            if (tile.frame !== AIR_FRAME) {
                map.add([
                    k.sprite("assets", {
                        frame: tile.frame - 1,
                    }),
                    k.anchor("center"),
                    k.rotate(tile.rotation),
                    isAirTile[i] && tile.frame !== GRASS_FRAME
                        ? k.opacity(0.5)
                        : k.opacity(1),
                    k.pos(FRAME_SIDE * col, FRAME_SIDE * row),
                    k.offscreen({ hide: true }),
                ]);
            }
        }

        for (const collider of getRectColliders(
            tilemap,
            width,
            height,
            isAirTile
        )) {
            map.add([
                // Define hitbox of the object
                k.area({
                    shape: new k.Rect(
                        k.vec2(-FRAME_SIDE / 2, -FRAME_SIDE / 2),
                        collider.width,
                        collider.height
                    ),
                    collisionIgnore: ["platform", "exit"],
                }),
                k.body({ isStatic: true }),
                k.pos(collider.x, collider.y),
                k.offscreen({ hide: true }),
                "platform",
            ]);
        }
    }

    return map;
}

async function makeBackgroundLayer(
    k: KaboomCtx,
    width: number,
    height: number,
    tilesetPath: string,
    seed?: number
) {
    const randNum = initRandNumGen(seed).randNum;

    const res = await fetch(tilesetPath);
    const tileset = await res.json();

    const map = k.make([k.pos(0), k.z(-1)]);

    const nwfc = new NWFC(tileset, width, height, randNum);
    nwfc.frameProportions = { 0: 0.95 };
    const tilemap = nwfc.generateMap();
    if (tilemap !== undefined) {
        for (let i = 0; i < tilemap.length; i++) {
            let row = Math.floor(i / width);
            let col = i % width;
            const tile = tileset[tilemap[i]];
            if (tile.frame !== AIR_FRAME) {
                map.add([
                    k.sprite("assets", {
                        frame: tile.frame - 1,
                    }),
                    k.anchor("center"),
                    k.rotate(tile.rotation),
                    k.pos(FRAME_SIDE * col, FRAME_SIDE * row),
                    k.offscreen({ hide: true }),
                ]);
            }
        }
    }

    return map;
}

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

    const guyPosEnd = Math.floor(grassPos.length / 5);
    const flamePosEnd = Math.floor((2 * grassPos.length) / 5);
    spawnPoints.guy = grassPos.slice(0, guyPosEnd);
    spawnPoints.flame = grassPos.slice(guyPosEnd, flamePosEnd);
    spawnPoints.bird = grassPos.slice(
        flamePosEnd,
        Math.floor((3 * grassPos.length) / 5)
    );

    return spawnPoints;
}

function pathToDoor(
    startIndex: number,
    endIndex: number,
    width: number,
    isAirTile: boolean[],
    tilemap: number[],
    tileset: Tile[]
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
                            const topIndex = Math.max(-1, adjacent - width);
                            if (
                                topIndex > -1 &&
                                tileset[tilemap[topIndex]].frame === GRASS_FRAME
                            ) {
                                tilemap[topIndex] = 0;
                            }

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
