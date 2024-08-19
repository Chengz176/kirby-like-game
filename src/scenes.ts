import { makeMap } from "./map_generator/map";
import {
    makeBirdEnemy,
    makeFlameEnemy,
    makeGuyEnemy,
} from "./entities/enemies";
import { initRandNumGen } from "./helpers";
import { PlayerEntity } from "./entities/player";
import { BACKGROUND_COLOR, FRAME_SIDE, SCALE } from "./constants";
import { KaboomCtx } from "kaboom";
import { Coord2D, Map } from "./definitions";

export async function defineScene(
    k: KaboomCtx,
    sceneName: string,
    onNextScene: () => void,
    seed?: number,
) {
    const { map, spawnPoints } = await makeMap(k, seed);

    const kirb = new PlayerEntity(
        k,
        spawnPoints.player[0],
        map.width,
        map.height
    );
    
    const scene = new Scene(k, kirb, map);

    k.scene(sceneName, () => {
        k.setGravity(2100);
        k.setBackground(k.Color.fromHex(BACKGROUND_COLOR));

        k.add(map);

        kirb.add();

        k.camScale(k.vec2(1.1));

        for (const flamePos of spawnPoints.flame) {
            makeFlameEnemy(k, flamePos, map.height);
        }

        for (const guyPos of spawnPoints.guy) {
            makeGuyEnemy(k, guyPos, map.height);
        }

        const randNumGen = initRandNumGen(seed);
        for (const birdPos of spawnPoints.bird) {
            makeBirdEnemy(k, birdPos, randNumGen);
        }

        k.onSceneLeave((nextScene) => {
            if (nextScene === "loading") {
                onNextScene();
            }
        })
    });

    return scene;
}

export function defineLoadingScene(k: KaboomCtx) {
    k.scene("loading", () => {
        k.setBackground(k.BLACK);
        const kirb = k.add([
            k.sprite("assets", { anim: "kirbIdle" }),
            k.scale(SCALE),
            k.pos(
                k.width() - 2 * FRAME_SIDE * SCALE,
                k.height() - FRAME_SIDE * SCALE
            ),
            k.state("idle", ["idle", "inhale"]),
        ]);

        const inhaleEffect = k.add([
            k.sprite("assets", { anim: "kirbInhaleEffect" }),
            k.pos(
                k.width() - FRAME_SIDE * SCALE,
                k.height() - FRAME_SIDE * SCALE
            ),
            k.scale(SCALE),
            k.opacity(0),
            "inhaleEffect",
        ]);

        kirb.onStateEnter("idle", () => {
            k.wait(1, () => kirb.enterState("inhale"));
            kirb.play("kirbIdle");
            inhaleEffect.opacity = 0;
        });

        kirb.onStateEnter("inhale", () => {
            k.wait(1, () => kirb.enterState("idle"));
            kirb.play("kirbInhaling");
            inhaleEffect.opacity = 1;
        });
    });
}


export class Scene {
    #k: KaboomCtx;
    #kirb: PlayerEntity;
    #map: Map;
    #width: number;
    #height: number;
    
    constructor(k: KaboomCtx, kirb: PlayerEntity, map: Map) {
        this.#kirb = kirb;
        this.#map = map;
        this.#k = k;
        this.#width = map.width;
        this.#height = map.height;
    }

    get kirb() {
        return this.#kirb;
    }

    get k() {
        return this.#k;
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    pause() {
        this.kirb.player.paused = true;
        this.#k.get('enemy').forEach(enemy => {
            enemy.paused = true;
        })
        this.kirb.pauseControl();
    }

    resume() {
        this.kirb.player.paused = false;
        this.#k.get('enemy').forEach(enemy => {
            enemy.paused = false;
        })
        this.kirb.resumeControl();
    }

    platformOnScreen(handleOnScreen: (pos: Coord2D) => void) {
        this.#map.get('levelLayer')[0].get('platformTile').forEach(platform => {
            platform.onEnterScreen(() => {
                const pos = {
                    x: platform.pos.x * SCALE,
                    y: platform.pos.y * SCALE
                }
                handleOnScreen(pos);
            });
        })
    }
}