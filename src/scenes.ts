import { k } from "./kaboomCtx";
import { makeMap } from "./map_generator/map";
import {
    makeBirdEnemy,
    makeFlameEnemy,
    makeGuyEnemy,
} from "./entities/enemies";
import { SceneStates } from "./states";
import { initRandNumGen } from "./helpers";
import { PlayerEntity, setControls } from "./entities/player";
import { BACKGROUND_COLOR } from "./constants";

export async function defineScenes(seed?: number) {
    for (const scene of SceneStates.scenes) {
        const { map, spawnPoints } = await makeMap(k, seed);

        k.scene(scene, () => {
            k.setGravity(2100);
            k.setBackground(k.Color.fromHex(BACKGROUND_COLOR));

            k.add(map);

            const kirb = new PlayerEntity(
                k,
                spawnPoints.player[0],
                map.width,
                map.height
            );

            setControls(k, kirb);

            k.add(kirb.player);

            k.camScale(k.vec2(1.1));

            for (const flamePos of spawnPoints.flame) {
                makeFlameEnemy(k, flamePos);
            }

            for (const guyPos of spawnPoints.guy) {
                makeGuyEnemy(k, guyPos);
            }

            const randNumGen = initRandNumGen(seed);
            for (const birdPos of spawnPoints.bird) {
                makeBirdEnemy(k, birdPos, randNumGen);
            }
        });
    }
}
