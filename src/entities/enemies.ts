import { GameObj, KaboomCtx } from "kaboom";
import { Coord2D, Entity, Player } from "../definitions";
import {
    BIRD_TYPE,
    FLAME_TYPE,
    FRAME_SIDE,
    GUY_TYPE,
    SCALE,
    TND_CONSTANTS,
} from "../constants";
import { throwFireball } from "./fireball";

function makeInhalable(k: KaboomCtx, enemy: Entity) {
    enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
        k.destroy(enemy);
        k.destroy(shootingStar);
    });

    const playersRef = k.get("player") as Player[];
    enemy.onUpdate(() => {
        let moveX = 0;
        let moveY = 0;
        const enemyX = enemy.pos.x / SCALE;
        const enemyY = enemy.pos.y / SCALE;
        for (const playerRef of playersRef) {
            if (playerRef.isInhaling) {
                const playerX = playerRef.pos.x / SCALE;
                const playerY = playerRef.pos.y / SCALE;
                if (
                    enemyX * playerRef.direction >=
                    playerX * playerRef.direction
                ) {
                    const diffX = playerRef.direction * (enemyX - playerX);
                    const diffY = enemyY - playerY;
                    const gap = 3 * FRAME_SIDE;
                    if (
                        diffX < gap &&
                        Math.abs(diffY) <= (3 * FRAME_SIDE) / 4
                    ) {
                        moveX +=
                            (playerRef.direction * -800 * (gap - diffX)) / gap;
                        moveY += (diffY / Math.abs(diffY)) * 100;
                    }
                }
            }
        }

        enemy.move(moveX, moveY);
    });
}

export function makeFlameEnemy(k: KaboomCtx, pos: Coord2D, mapHeight: number) {
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
        k.health(1),
        k.opacity(),
        k.timer(),
        {
            isInhalable: false,
            type: FLAME_TYPE,
        },
        k.offscreen({ hide: true }),
        "enemy",
    ]);

    makeInhalable(k, flame);

    flame.onStateEnter("idle", () => {
        k.wait(5, () => flame.enterState("jump"));
    });

    flame.onStateEnter("jump", () => {
        flame.jump(1000);
    });

    flame.onStateUpdate("jump", () => {
        if (!flame.isJumping() && !flame.isOffScreen()) {
            k.add(
                throwFireball(
                    k.vec2(-200, 50),
                    k.vec2(
                        flame.pos.x + (FRAME_SIDE / 2) * SCALE,
                        flame.pos.y + (FRAME_SIDE / 2) * SCALE
                    ),
                    "enemy"
                )
            );
            k.add(
                throwFireball(
                    k.vec2(200, 50),
                    k.vec2(
                        flame.pos.x + (FRAME_SIDE / 2) * SCALE,
                        flame.pos.y + (FRAME_SIDE / 2) * SCALE
                    ),
                    "enemy"
                )
            );
            flame.enterState("idle");
        }
    });

    flame.onUpdate(() => {
        if (flame.pos.y > mapHeight) {
            flame.destroy();
        }
    })
}

export function makeGuyEnemy(k: KaboomCtx, pos: Coord2D, mapHeight: number) {
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
        k.health(2),
        k.opacity(),
        k.timer(),
        {
            isInhalable: false,
            speed: 100,
            type: GUY_TYPE,
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

    guy.onUpdate(() => {
        if (guy.pos.y > mapHeight) {
            guy.destroy();
        }
    })

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

export function makeBirdEnemy(
    k: KaboomCtx,
    pos: Coord2D,
    randNumGen: {
        randNum(): number;
        seed(newSeed?: number): number;
        rand_TND(): number;
    }
) {
    const bird = k.add([
        k.sprite("assets", { anim: "bird", flipX: true }),
        k.scale(SCALE),
        k.pos(pos.x * SCALE, pos.y * SCALE),
        k.area({
            shape: new k.Rect(k.vec2(0), 12, 12),
            collisionIgnore: ["enemy"],
        }),
        k.body({
            isStatic: true,
        }),
        k.anchor("center"),
        k.rotate(0),
        k.offscreen({
            hide: true,
            distance: 400,
        }),
        k.health(1),
        k.opacity(),
        k.state("hover", ["hover", "fly"]),
        {
            speed: 100 + Math.floor(300 * randNumGen.randNum()),
            type: BIRD_TYPE,
        },
        k.timer(),
        "enemy",
    ]);
    makeInhalable(k, bird);

    bird.onStateEnter("hover", () => {
        bird.angle = 0;
        bird.flipY = false;
        k.wait(2, () => {
            bird.enterState("fly");
        });
    });

    bird.onStateUpdate("hover", () => {
        bird.move(0, 0);
    });

    bird.onStateEnter("fly", () => {
        const playersRef = k.get("player") as Player[];
        let minDist = Number.MAX_VALUE;
        let targetPlayer: Player | undefined;
        for (const playerRef of playersRef) {
            const dist = Math.sqrt(
                (playerRef.pos.x - bird.pos.x) ** 2 +
                    (playerRef.pos.y - bird.pos.y) ** 2
            );
            if (dist < minDist) {
                minDist = dist;
                targetPlayer = playerRef;
            }
        }

        const angle = birdMoveAngle(targetPlayer, bird, randNumGen);

        bird.flipY = angle > Math.PI / 2 && angle < (3 * Math.PI) / 2;

        bird.angle = (angle * 180) / Math.PI;

        k.wait(2, () => {
            bird.enterState("hover");
        });
    });

    bird.onStateUpdate("fly", () => {
        bird.move(
            bird.speed * Math.cos((bird.angle * 2 * Math.PI) / 360),
            bird.speed * Math.sin((bird.angle * 2 * Math.PI) / 360)
        );
    });

    return bird;
}

function birdMoveAngle(
    targetPlayer: Player | undefined,
    bird: Entity,
    randNumGen: {
        randNum(): number;
        seed(newSeed?: number): number;
        rand_TND(): number;
    }
) {
    if (targetPlayer === undefined) {
        return -1;
    }

    const playerPos: Coord2D = {
        x: targetPlayer.pos.x / SCALE,
        y: targetPlayer.pos.y / SCALE,
    };

    const birdPos: Coord2D = {
        x: bird.pos.x / SCALE,
        y: bird.pos.y / SCALE,
    };

    const vec: Coord2D = {
        x: playerPos.x - birdPos.x,
        y: birdPos.y - playerPos.y,
    };

    if (vec.x === 0 && vec.y === 0) {
        return -1;
    }

    const dist = Math.sqrt(vec.x ** 2 + vec.y ** 2);
    let baseAngle = Math.acos(vec.x / dist);

    if (vec.y > 0) {
        baseAngle = 2 * Math.PI - baseAngle;
    }

    if (dist < 7 * FRAME_SIDE) {
        return baseAngle;
    }

    const offset =
        (randNumGen.rand_TND() * (2 * Math.PI)) /
        (TND_CONSTANTS.b - TND_CONSTANTS.a);

    const angle = (2 * Math.PI + baseAngle + offset) % (2 * Math.PI);

    return angle;
}
