import { GameObj, KaboomCtx, PosComp, ZComp } from "kaboom";
import {
    AIR_FRAME,
    DOOR_TOP_LEFT_FRAME,
    FRAME_SIDE,
    GRASS_FRAME,
    SCALE,
    SIGN_FRAME,
} from "../constants";
import { SpawnPoints, Tile } from "../definitions";
import { initRandNumGen } from "../helpers";
import cloudTileset from "../assets/cloud-tileset.json";
import pillarTileset from "../assets/pillar-tileset.json";
import tileset from "../assets/tileset.json";

export const makeMap = async (k: KaboomCtx, seed?: number) => {
    const randNumGen = initRandNumGen(seed);

    const width: number = 50 + Math.floor(randNumGen.randNum() * 11);
    const height: number = 30 + Math.floor(randNumGen.randNum() * 11);

    // Create a map component
    const map = k.make([
        k.scale(SCALE),
        k.pos(0),
        {
            width: width * FRAME_SIDE * SCALE,
            height: height * FRAME_SIDE * SCALE,
        },
        k.z(-2),
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
        backgroundLayer(cloudTileset, randNumGen.seed()),
        backgroundLayer(pillarTileset, randNumGen.seed()),
        makeLevelLayer(
            k,
            width,
            height,
            tileset,
            spawnPoints,
            randNumGen.seed()
        ),
    ];

    await Promise.all(makeLayers).then((layers) => {
        layers.forEach((layer) => map.add(layer));
    });

    return { map, spawnPoints };
};

function makeLevelLayer(
    k: KaboomCtx,
    width: number,
    height: number,
    tileset: Tile[],
    spawnPoints: SpawnPoints,
    seed?: number
) {
    return new Promise((resolve: (map: GameObj<PosComp>) => void, reject) => {
        const worker = new Worker(
            new URL("./workers/levelLayer.ts", import.meta.url),
            { type: "module" }
        );

        worker.postMessage({
            width,
            height,
            tileset,
            spawnPoints,
            seed,
        });

        worker.onmessage = (e) => {
            worker.terminate();

            if (
                e.data instanceof Object &&
                e.data.hasOwnProperty("tilemap") &&
                e.data.hasOwnProperty("doorTopLeft") &&
                e.data.hasOwnProperty("colliders") &&
                e.data.hasOwnProperty("spawnPoints") &&
                e.data.hasOwnProperty("isAirTile")
            ) {
                const { tilemap, doorTopLeft, colliders, isAirTile } = e.data;

                Object.assign(spawnPoints, e.data["spawnPoints"]);

                const map = k.make([k.pos(0), "levelLayer"]);

                if (tilemap !== undefined) {
                    const playerSpawnPoint = spawnPoints.player[0];

                    map.add([
                        k.sprite("assets", {
                            frame: SIGN_FRAME - 1,
                        }),
                        k.anchor("center"),
                        k.pos(playerSpawnPoint.x, playerSpawnPoint.y),
                        k.offscreen({ hide: true }),
                    ]);

                    for (let i = 0; i < 5; i++) {
                        const x = doorTopLeft.x + i;
                        for (let j = 0; j < 3; j++) {
                            const y = doorTopLeft.y + j;
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
                            collisionIgnore: [
                                "platform",
                                "exit",
                                "enemy",
                                "fireball",
                            ],
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
                                !isAirTile[i] && tile.frame !== GRASS_FRAME
                                    ? "platformTile"
                                    : "",
                            ]);
                        }
                    }

                    for (const collider of colliders) {
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

                resolve(map);
            } else {
                reject();
            }
        };
    });
}

function makeBackgroundLayer(
    k: KaboomCtx,
    width: number,
    height: number,
    tileset: Tile[],
    seed?: number
) {
    return new Promise(
        (resolve: (map: GameObj<PosComp | ZComp>) => void, reject) => {
            const worker = new Worker(
                new URL("./workers/backgroundLayer.ts", import.meta.url),
                { type: "module" }
            );
            worker.postMessage({
                width,
                height,
                tileset,
                seed,
            });

            worker.onmessage = (e) => {
                worker.terminate();
                if (
                    e.data instanceof Object &&
                    e.data.hasOwnProperty("tilemap")
                ) {
                    const tilemap = e.data["tilemap"];

                    const map = k.make([k.pos(0), k.z(-1)]);

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

                    resolve(map);
                } else {
                    reject();
                }
            };
        }
    );
}
