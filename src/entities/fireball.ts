import { GameObj, KaboomCtx, Vec2 } from "kaboom";
import { SCALE } from "../constants";

export const throwFireball = (
    k: KaboomCtx,
    initVel: Vec2,
    initPos: Vec2,
    fromTag: string
) => {
    const fireball = k.make([
        k.scale(SCALE),
        k.area({
            shape: new k.Rect(k.vec2(), 2, 2),
            collisionIgnore: [fromTag, "exit"],
        }),
        k.lifespan(1),
        k.circle(1),
        k.anchor("center"),
        k.body({ stickToPlatform: false }),
        k.color(142, 20, 56),
        k.pos(initPos),
        fromTag === "player" ? "fireball" : "enemy",
    ]);

    fireball.vel = initVel;

    fireball.onCollide("platform", (_, collision) => {
        if (collision?.isBottom() || collision?.isTop()) {
            fireball.vel = k.vec2(fireball.vel.x, -fireball.vel.y);
            return;
        }

        fireball.vel = k.vec2(-fireball.vel.x, fireball.vel.y);
    });

    fireball.onCollide("fireball", () => fireball.destroy());

    fireball.onCollide("player", () => fireball.destroy());

    fireball.onCollide("enemy", async (enemy: GameObj) => {
        fireball.destroy();
        enemy.hurt();
        if (enemy.hp() === 0) {
            enemy.destroy();
        }

        await enemy.tween(
            enemy.opacity,
            0,
            0.05,
            (val: number) => (enemy.opacity = val),
            k.easings.linear
        );
        await enemy.tween(
            enemy.opacity,
            1,
            0.05,
            (val: number) => (enemy.opacity = val),
            k.easings.linear
        );
    });

    return fireball;
};
