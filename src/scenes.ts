import { k } from "./kaboomCtx";
import { makeMap } from "./utils";
import { 
    makePlayer,
    makeBirdEnemy,
    makeFlameEnemy,
    makeGuyEnemy,
    setControls 
} from "./entities";
import { SceneStates } from "./states";

export async function defineScenes() {
    for (const scene of SceneStates.scenes) {
        k.loadSprite(scene, `${scene}.png`);

        const { map, spawnPoints } = await makeMap(k, scene);

        k.scene(scene, () => {
            k.setGravity(2100);
            k.add([
                k.rect(k.width(), k.height()),
                k.color(k.Color.fromHex("#f7d7db")),
                k.fixed()
            ]);
            
            k.add(map);
    
            const kirb = makePlayer(k, spawnPoints.player[0]);
    
            setControls(k, kirb);
    
            k.add(kirb);
            
            k.camScale(k.vec2(0.7));
    
            for (const flamePos of spawnPoints.flame) {
                makeFlameEnemy(k, flamePos);
            }
    
            for (const guyPos of spawnPoints.guy) {
                makeGuyEnemy(k, guyPos);
            }
    
            for (const birdPos of spawnPoints.bird) {
                k.loop(10, () => {
                    makeBirdEnemy(
                        k,
                        birdPos,
                        100 + Math.floor(300 * Math.random())
                    )
                })
            }
        });
    }
}