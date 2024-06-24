import { KaboomCtx } from "kaboom";
import { scale } from "./constants";
import { SpawnPoints } from "./libs/definitions";

export const makeMap = async (k: KaboomCtx, name: string) => {
    // Fetch the map data
    const res = await fetch(`./${name}.json`);
    const mapData = await res.json();

    // Create a map component
    const map = k.make([
        k.sprite(name),
        k.scale(scale),
        k.pos(0)
    ]);

    const spawnPoints: SpawnPoints = {};

    for (const layer of mapData.layers) {
        switch (layer.name) {
            case "colliders":
                // Objects in the level
                for (const collider of layer.objects) {
                    map.add([
                        // Define hitbox of the object
                        k.area({
                            shape: new k.Rect(
                                k.vec2(0),
                                collider.width,
                                collider.height
                            ),
                            collisionIgnore: ["platform", "exit"]
                        }),
                        k.body({isStatic: true}),
                        k.pos(collider.x, collider.y),
                        collider.name === "exit"
                            ? "exit"
                            : "platform"
                    ])
                }
                break;
            case "spawnpoints":
                // Spawnpoints of the entities in the map
                for (const spawnPoint of layer.objects) {
                    if (spawnPoints.hasOwnProperty(spawnPoint.name)) {
                        spawnPoints[spawnPoint.name].push({
                            x: spawnPoint.x,
                            y: spawnPoint.y
                        });
                        continue;
                    }
                    
                    spawnPoints[spawnPoint.name] = [{
                        x: spawnPoint.x,
                        y: spawnPoint.y
                    }];
                }
                break;
            default: break;
        }
    }

    return {map, spawnPoints};
}