import { KaboomCtx, GameObj } from "kaboom";
import {
    SCALE,
    FRAME_SIDE,
    FLAME_TYPE,
    GUY_TYPE,
    BIRD_TYPE,
} from "../constants";
import { Coord2D, Player } from "../definitions";
import { SceneStates } from "../states";
import { throwFireball } from "./fireball";

export class PlayerEntity {
    #LEFT = -1;
    #RIGHT = 1;
    #DEFAULT_NUM_JUMP = 7;
    #DEFAULT_HP = 3;
    #player: Player;
    #inhaleEffectRef;
    #k: KaboomCtx;
    #support = -1;
    #supportEffect;
    #numJump = 0;
    #maxJumps = this.#DEFAULT_NUM_JUMP;

    constructor(
        k: KaboomCtx,
        pos: Coord2D,
        mapWidth: number,
        mapHeight: number
    ) {
        this.#k = k;
        //Create player entity
        const player = k.make([
            k.sprite("assets", { anim: "kirbIdle" }),
            k.area({
                shape: new k.Rect(k.vec2(0, 2), 12, 11),
            }),
            k.body(),
            k.pos(pos.x * SCALE, pos.y * SCALE),
            k.anchor("center"),
            k.scale(SCALE),
            k.doubleJump(Infinity),
            k.health(this.#DEFAULT_HP),
            k.opacity(1),
            {
                speed: 300,
                direction: this.#RIGHT,
                isInhaling: false,
                enemyInhaled: -1,
                canInhale: true,
            },
            k.timer(),
            "player",
        ]);

        player.onCollide("enemy", async (enemy: GameObj) => {
            if (player.isInhaling) {
                // Inhale the enemy
                player.isInhaling = false;
                k.destroy(enemy);

                player.enemyInhaled = enemy.type;
                this.#inhaleEffectRef.opacity = 0;
                return;
            }

            // Get damage from colliding with the enemy
            if (this.#support === GUY_TYPE) {
                this.reset();
                return;
            }

            this.reset();

            player.hurt();

            if (player.hp() === 0) {
                // Respawn
                k.destroy(player);
                k.go(SceneStates.scenes[SceneStates.currentScene]);
                return;
            }

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

        // Effect for inhaling
        const inhaleEffect = k.add([
            k.sprite("assets", { anim: "kirbInhaleEffect" }),
            k.pos(),
            k.scale(SCALE),
            k.opacity(0),
            "inhaleEffect",
        ]);

        player.onUpdate(() => {
            // Camera follows the player
            k.camPos(
                k.vec2(
                    Math.min(mapWidth - 500, Math.max(440, player.pos.x)),
                    Math.min(mapHeight - 300, Math.max(230, player.pos.y))
                )
            );

            inhaleEffect.pos = k.vec2(
                player.pos.x + 60 * player.direction - (FRAME_SIDE / 2) * SCALE,
                player.pos.y - (FRAME_SIDE / 2) * SCALE
            );
            inhaleEffect.flipX = player.direction === this.#LEFT;

            if (player.pos.y > mapHeight) {
                player.destroy();
                k.go(SceneStates.scenes[SceneStates.currentScene]);
            }
        });

        player.onGround(() => (this.#numJump = 0));

        this.#inhaleEffectRef = inhaleEffect;
        this.#player = player;

        this.#supportEffect = k.add([
            this.#k.scale(SCALE),
            k.circle(2.5 * SCALE),
            k.color(this.#k.YELLOW),
            k.opacity(0),
            k.follow(this.#player),
            k.pos(),
            k.z(-1),
            k.timer(),
            "supportEffect",
        ]);
    }

    get player() {
        return this.#player;
    }

    moveLeft() {
        this.#player.flipX = true;
        this.#player.direction = this.#LEFT;
        this.#player.move(this.#player.direction * this.#player.speed, 0);
    }

    moveRight() {
        this.#player.flipX = false;
        this.#player.direction = this.#RIGHT;
        this.#player.move(this.#player.direction * this.#player.speed, 0);
    }

    inhaling() {
        if (this.#player.enemyInhaled > -1) {
            this.#player.play("kirbFull");
            this.#inhaleEffectRef.opacity = 0;
            return;
        }

        if (this.#player.canInhale) {
            this.#player.isInhaling = true;
            this.#player.play("kirbInhaling");
            this.#inhaleEffectRef.opacity = 1;
        }
    }

    inhaleEnd() {
        if (this.#player.enemyInhaled === -1) {
            this.#player.play("kirbIdle");
            this.#player.isInhaling = false;
            this.#inhaleEffectRef.opacity = 0;
        }
    }

    jump() {
        if (this.#numJump < this.#maxJumps) {
            this.#player.doubleJump();
            this.#numJump++;
        }
    }

    shootProjectile() {
        if (this.#support == FLAME_TYPE) {
            this.#k.add(
                throwFireball(
                    this.#k.vec2(this.#player.direction * 1000, 0),
                    this.#player.pos,
                    "player"
                )
            );
            return;
        }

        if (this.#player.enemyInhaled > -1) {
            this.#player.play("kirbInhaling");
            const shootingStar = this.#k.add([
                this.#k.sprite("assets", {
                    anim: "shootingStar",
                    flipX: this.#player.direction === 1,
                }),
                this.#k.area({
                    shape: new this.#k.Rect(this.#k.vec2(0), 6, 6),
                }),
                this.#k.pos(
                    this.#player.pos.x + this.#player.direction * 80,
                    this.#player.pos.y + 5
                ),
                this.#k.anchor("center"),
                this.#k.rotate(0),
                this.#k.scale(SCALE),
                this.#player.direction === -1
                    ? this.#k.move(this.#k.LEFT, 800)
                    : this.#k.move(this.#k.RIGHT, 800),
                "shootingStar",
                this.#k.offscreen({
                    hide: true,
                }),
            ]);

            shootingStar.onCollide("platform", () =>
                this.#k.destroy(shootingStar)
            );

            shootingStar.onUpdate(() => {
                shootingStar.angle = (shootingStar.angle + 30) % 360;
            });

            this.#player.enemyInhaled = -1;
            this.#player.canInhale = false;

            this.#k.wait(1, () => {
                this.#player.canInhale = true;
                this.#player.play("kirbIdle");
            });
        }
    }

    setSupport() {
        if (this.#player.enemyInhaled > -1) {
            const enemyInhaled = this.#player.enemyInhaled;
            this.reset();
            this.#support = enemyInhaled;
            switch (this.#support) {
                case GUY_TYPE:
                    this.#supportEffect.color = this.#k.BLACK;
                    break;
                case FLAME_TYPE:
                    this.#player.canInhale = false;
                    this.#supportEffect.color = this.#k.RED;
                    break;
                case BIRD_TYPE:
                    this.#maxJumps = Infinity;
                    this.#supportEffect.color = this.#k.WHITE;
                    break;
                default:
                    break;
            }

            this.#supportEffect.tween(
                0,
                0.3,
                0.5,
                (val) => (this.#supportEffect.opacity = val)
            );
        }
    }

    reset() {
        this.#maxJumps = this.#DEFAULT_NUM_JUMP;

        if (this.#support > -1) {
            this.#supportEffect.tween(
                this.#supportEffect.opacity,
                0,
                0.5,
                (val) => (this.#supportEffect.opacity = val)
            );
            this.#support = -1;
        }

        this.#player.canInhale = true;

        this.#player.enemyInhaled = -1;

        this.#player.play("kirbIdle");
    }
}

export function setControls(k: KaboomCtx, playerEntity: PlayerEntity) {
    k.onKeyDown((key) => {
        switch (key) {
            case "a":
                playerEntity.moveLeft();
                break;
            case "d":
                playerEntity.moveRight();
                break;
            case "j":
                playerEntity.inhaling();
                break;
            default:
                break;
        }
    });

    k.onKeyPress((key) => {
        switch (key) {
            case "k":
                playerEntity.jump();
                break;
            case "j":
                playerEntity.shootProjectile();
                break;
            case "s":
                playerEntity.setSupport();
                break;
            case "w":
                playerEntity.reset();
                break;
            default:
                break;
        }
    });

    k.onKeyRelease((key) => {
        switch (key) {
            case "j":
                playerEntity.inhaleEnd();
                break;
            default:
                break;
        }
    });
}
