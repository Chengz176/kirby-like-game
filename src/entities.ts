import { GameObj, KaboomCtx } from "kaboom";
import { Coord2D, Player } from "./definitions";
import { FRAME_SIDE, SCALE } from "./constants";
import { SceneStates } from "./states";

const LEFT = -1;
const RIGHT = 1;

export function makePlayer(
    k: KaboomCtx,
    pos: Coord2D,
    mapWidth: number,
    mapHeight: number
) {
    //Create player entity
    const player = k.make([
        k.sprite("assets", { anim: "kirbIdle" }),
        k.area({
            shape: new k.Rect(k.vec2(4, 5.9), 8, 10),
        }),
        k.body(),
        k.pos(
            (pos.x - FRAME_SIDE / 2) * SCALE,
            (pos.y - FRAME_SIDE / 2) * SCALE
        ),
        k.scale(SCALE),
        k.doubleJump(Infinity),
        k.health(3),
        k.opacity(1),
        {
            speed: 300,
            direction: LEFT,
            isInhaling: false,
            isFull: false,
        },
        k.timer(),
        "player",
    ]);

    player.onCollide("enemy", async (enemy: GameObj) => {
        if (player.isInhaling && enemy.isInhalable) {
            // Inhale the enemy
            player.isInhaling = false;
            k.destroy(enemy);
            player.isFull = true;
            return;
        }

        if (player.hp() === 0) {
            // Respawn
            k.destroy(player);
            k.go(SceneStates.scenes[SceneStates.currentScene]);
            return;
        }

        // Get damage from colliding with the enemy
        player.hurt();
        // Damage animation
        await player.tween(
            player.opacity,
            0,
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear
        );
        await player.tween(
            player.opacity,
            1,
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear
        );
    });

    //Reached the exit door
    player.onCollide("exit", () => {
        SceneStates.currentScene =
            (SceneStates.currentScene + 1) % SceneStates.scenes.length;
        k.go(SceneStates.scenes[SceneStates.currentScene]);
    });

    // Effect and hitbox for inhaling
    const inhaleEffect = k.add([
        k.sprite("assets", { anim: "kirbInhaleEffect" }),
        k.pos(),
        k.scale(SCALE),
        k.opacity(0),
        "inhaleEffect",
    ]);

    const inhaleZone = player.add([
        k.area({
            shape: new k.Rect(k.vec2(0), 20, 4),
        }),
        k.pos(),
        "inhaleZone",
    ]);

    inhaleZone.onUpdate(() => {
        inhaleZone.pos = k.vec2(14 * player.direction, 8);
        inhaleEffect.pos = k.vec2(
            player.pos.x + 60 * player.direction,
            player.pos.y
        );
        inhaleEffect.flipX = player.direction === LEFT;
    });

    player.onUpdate(() => {
        // Camera follows the player
        k.camPos(
            k.vec2(
                Math.min(mapWidth - 500, Math.max(440, player.pos.x)),
                Math.min(mapHeight - 300, Math.max(230, player.pos.y))
            )
        );

        if (player.pos.y > mapHeight) {
            player.destroy();
            k.go(SceneStates.scenes[SceneStates.currentScene]);
        }
    });

    return player;
}

export function setControls(k: KaboomCtx, player: Player) {
    const inhaleEffectRef = k.get("inhaleEffect")[0];

    k.onKeyDown((key) => {
        switch (key) {
            case "left":
                player.flipX = true;
                player.direction = LEFT;
                player.move(player.direction * player.speed, 0);
                break;
            case "right":
                player.flipX = false;
                player.direction = RIGHT;
                player.move(player.direction * player.speed, 0);
                break;
            case "z":
                if (player.isFull) {
                    player.play("kirbFull");
                    inhaleEffectRef.opacity = 0;
                    break;
                }

                player.isInhaling = true;
                player.play("kirbInhaling");
                inhaleEffectRef.opacity = 1;
                break;
            default:
                break;
        }
    });

    k.onKeyPress((key) => {
        switch (key) {
            case "space":
                player.doubleJump();
                break;
            default:
                break;
        }
    });

    k.onKeyRelease((key) => {
        switch (key) {
            case "z":
                if (player.isFull) {
                    player.play("kirbInhaling");
                    const shootingStar = k.add([
                        k.sprite("assets", {
                            anim: "shootingStar",
                            flipX: player.direction === RIGHT,
                        }),
                        k.area({
                            shape: new k.Rect(k.vec2(5, 4), 6, 6),
                        }),
                        k.pos(
                            player.pos.x + player.direction * 80,
                            player.pos.y + 5
                        ),
                        k.scale(SCALE),
                        player.direction === LEFT
                            ? k.move(k.LEFT, 800)
                            : k.move(k.RIGHT, 800),
                        "shootingStar",
                    ]);

                    shootingStar.onCollide("platform", () =>
                        k.destroy(shootingStar)
                    );

                    player.isFull = false;
                    k.wait(1, () => player.play("kirbIdle"));
                    break;
                }

                inhaleEffectRef.opacity = 0;
                player.isInhaling = false;
                player.play("kirbIdle");
                break;
            default:
                break;
        }
    });
}

function makeInhalable(k: KaboomCtx, enemy: GameObj) {
    enemy.onCollide("inhaleZone", () => {
        enemy.isInhalable = true;
    });

    enemy.onCollideEnd("inhaleZone", () => {
        enemy.isInhalable = false;
    });

    enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
        k.destroy(enemy);
        k.destroy(shootingStar);
    });

    const playerRef = k.get("player")[0];
    enemy.onUpdate(() => {
        if (playerRef.isInhaling && enemy.isInhalable) {
            enemy.move(playerRef.direction * -800, 0);
        }
    });
}

export function makeFlameEnemy(k: KaboomCtx, pos: Coord2D) {
    const flame = k.add([
        k.sprite("assets", { anim: "flame" }),
        k.scale(SCALE),
        k.pos(
            (pos.x - FRAME_SIDE / 2) * SCALE,
            (pos.y - FRAME_SIDE / 2) * SCALE
        ),
        k.area({
            shape: new k.Rect(k.vec2(4, 6), 8, 10),
            collisionIgnore: ["enemy"],
        }),
        k.body(),
        k.state("idle", ["idle", "jump"]),
        {
            isInhalable: false,
        },
        k.offscreen({ hide: true }),
        "enemy",
    ]);

    makeInhalable(k, flame);

    flame.onStateEnter("idle", () => {
        k.wait(1, () => flame.enterState("jump"));
    });

    flame.onStateEnter("jump", () => {
        flame.jump(1000);
    });

    flame.onStateUpdate("jump", () => {
        if (!flame.isJumping()) {
            flame.enterState("idle");
        }
    });
}

export function makeGuyEnemy(k: KaboomCtx, pos: Coord2D) {
    const guy = k.add([
        k.sprite("assets", { anim: "guyWalk" }),
        k.scale(SCALE),
        k.pos(
            (pos.x - FRAME_SIDE / 2) * SCALE,
            (pos.y - FRAME_SIDE / 2) * SCALE
        ),
        k.area({
            shape: new k.Rect(k.vec2(2, 3), 12, 13),
            collisionIgnore: ["enemy"],
        }),
        k.body(),
        k.state("idle", ["idle", "left", "right"]),
        {
            isInhalable: false,
            speed: 100,
        },
        k.offscreen({ hide: true }),
        "enemy",
    ]);

    makeInhalable(k, guy);

    const detectEdge = guy.add([
        k.area({
            shape: new k.Rect(k.vec2(), 1, 1),
        }),
        k.pos(),
        k.offscreen({ hide: true }),
        "nextPos",
    ]);

    const detectWall = guy.add([
        k.area({
            shape: new k.Rect(k.vec2(), 1, 1),
        }),
        k.pos(),
        k.offscreen({ hide: true }),
        "detectWall",
    ]);

    let nextState = "left";

    guy.onStateEnter("idle", () => {
        k.wait(1, () => {
            guy.enterState(nextState);
        });
    });

    guy.onStateUpdate("idle", () => {
        guy.move(0, 0);
    });

    guy.onStateEnter("left", () => {
        guy.flipX = false;
        detectWall.pos = k.vec2(1, 9);
        detectEdge.pos = k.vec2(1, 15);
    });

    guy.onStateUpdate("left", () => {
        guy.move(-guy.speed, 0);
    });

    guy.onStateEnd("left", () => {
        nextState = "right";
    });

    guy.onStateEnter("right", () => {
        guy.flipX = true;
        detectWall.pos = k.vec2(14, 9);
        detectEdge.pos = k.vec2(14, 15);
    });

    guy.onStateUpdate("right", () => {
        guy.move(guy.speed, 0);
    });

    guy.onStateEnd("right", () => {
        nextState = "left";
    });

    detectWall.onCollide("platform", () => {
        if (guy.state !== "idle") {
            guy.enterState("idle");
        }
    });

    detectEdge.onCollideEnd("platform", () => {
        if (guy.state !== "idle") {
            guy.enterState("idle");
        }
    });
}

export function makeBirdEnemy(k: KaboomCtx, pos: Coord2D, speed: number) {
    const bird = k.add([
        k.sprite("assets", { anim: "bird" }),
        k.scale(SCALE),
        k.pos(
            (pos.x - FRAME_SIDE / 2) * SCALE,
            (pos.y - FRAME_SIDE / 2) * SCALE
        ),
        k.area({
            shape: new k.Rect(k.vec2(4, 6), 8, 10),
            collisionIgnore: ["enemy"],
        }),
        k.body({
            isStatic: true,
        }),
        k.move(k.LEFT, speed),
        k.offscreen({
            hide: true,
            distance: 400,
        }),
        "enemy",
    ]);

    makeInhalable(k, bird);

    return bird;
}
