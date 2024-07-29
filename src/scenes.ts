import { k } from "./kaboomCtx";
import { makeMap } from "./map";
import {
    makePlayer,
    makeBirdEnemy,
    makeFlameEnemy,
    makeGuyEnemy,
    setControls,
} from "./entities";
import { SceneStates } from "./states";
import { initRandNumGen } from "./helpers";

export async function defineScenes(seed?: number) {
    for (const scene of SceneStates.scenes) {
        const { map, spawnPoints } = await makeMap(k, seed);

        k.scene(scene, () => {
            k.setGravity(2100);
            k.setBackground(k.Color.fromHex("#f7d7db"));

            k.add(map);

            const kirb = makePlayer(
                k,
                spawnPoints.player[0],
                map.width,
                map.height
            );

            setControls(k, kirb);

            k.add(kirb);

            k.camScale(k.vec2(1.1));

            for (const flamePos of spawnPoints.flame) {
                makeFlameEnemy(k, flamePos);
            }

            for (const guyPos of spawnPoints.guy) {
                makeGuyEnemy(k, guyPos);
            }

            const randNumGen = initRandNumGen(seed);
            for (const birdPos of spawnPoints.bird) {
                k.loop(10, () => {
                    makeBirdEnemy(
                        k,
                        birdPos,
                        100 + Math.floor(300 * randNumGen.randNum())
                    );
                });
            }
        });
    }
}
