import { KaboomCtx, GameObj, Vec2, EventController } from "kaboom";
import {
    SCALE,
    FRAME_SIDE,
    FLAME_TYPE,
    GUY_TYPE,
    BIRD_TYPE,
} from "../constants";
import { Coord2D, Player } from "../definitions";
import { throwFireball } from "./fireball";

export class PlayerEntity {
    #LEFT = -1;
    #RIGHT = 1;
    #RELEASED = 1;
    #PRESSED = 2;
    #DOWN = 3;
    #DEFAULT_NUM_JUMP = 5;
    #DEFAULT_HP = 3;
    #player: Player;
    #inhaleEffectRef;
    #k: KaboomCtx;
    #ability = -1;
    #abilityEffect;
    #numJump = 0;
    #maxJumps = this.#DEFAULT_NUM_JUMP;
    #initialPos: Vec2;
    #moves: {
        [key: string]: number | undefined;
    } = {};
    #controls: EventController[] = [];

    constructor(
        k: KaboomCtx,
        pos: Coord2D,
        mapWidth: number,
        mapHeight: number
    ) {
        this.#k = k;
        //Create player entity
        const player = this.#k.make([
            this.#k.sprite("assets", { anim: "kirbIdle" }),
            this.#k.area({
                shape: new this.#k.Rect(this.#k.vec2(0, 2), 12, 11),
            }),
            this.#k.body(),
            this.#k.pos(pos.x * SCALE, (pos.y - FRAME_SIDE / 2) * SCALE),
            this.#k.anchor("center"),
            this.#k.scale(SCALE),
            this.#k.doubleJump(Infinity),
            this.#k.health(this.#DEFAULT_HP),
            this.#k.opacity(1),
            {
                speed: 300,
                direction: this.#RIGHT,
                isInhaling: false,
                enemyInhaled: -1,
                canInhale: true,
            },
            this.#k.timer(),
            "player",
        ]);

        this.#initialPos = player.pos;
        player.onCollide("enemy", async (enemy: GameObj) => {
            if (player.isInhaling) {
                // Inhale the enemy
                player.isInhaling = false;
                this.#k.destroy(enemy);

                player.enemyInhaled = enemy.type;
                this.#inhaleEffectRef.opacity = 0;
                return;
            }

            // Get damage from colliding with the enemy
            if (this.#ability === GUY_TYPE) {
                this.#reset();
                return;
            }

            this.#reset();

            player.heal(-1);

            if (player.hp() === 0) {
                // Respawn
                this.#respawn();
                return;
            }

            // Damage animation
            await player.tween(
                player.opacity,
                0,
                0.05,
                (val) => (player.opacity = val),
                this.#k.easings.linear
            );
            await player.tween(
                player.opacity,
                1,
                0.05,
                (val) => (player.opacity = val),
                this.#k.easings.linear
            );
        });

        //Reached the exit door
        player.onCollide("exit", () => {
            this.#k.go("loading");
        });

        // Effect for inhaling
        const inhaleEffect = this.#k.add([
            this.#k.sprite("assets", { anim: "kirbInhaleEffect" }),
            this.#k.pos(),
            this.#k.scale(SCALE),
            this.#k.opacity(0),
            "inhaleEffect",
        ]);

        player.onUpdate(() => {
            // Camera follows the player
            this.#k.camPos(
                this.#k.vec2(
                    Math.min(mapWidth - 500, Math.max(440, player.pos.x)),
                    Math.min(mapHeight - 300, Math.max(230, player.pos.y))
                )
            );

            inhaleEffect.pos = this.#k.vec2(
                player.pos.x + 60 * player.direction - (FRAME_SIDE / 2) * SCALE,
                player.pos.y - (FRAME_SIDE / 2) * SCALE
            );
            inhaleEffect.flipX = player.direction === this.#LEFT;

            if (player.pos.y > mapHeight) {
                player.heal(-3);
                this.#respawn();
            }
        });

        player.onGround(() => (this.#numJump = 0));

        this.#inhaleEffectRef = inhaleEffect;
        this.#player = player;

        this.#abilityEffect = this.#k.make([
            this.#k.scale(SCALE),
            this.#k.circle(2.5 * SCALE),
            this.#k.color(this.#k.YELLOW),
            this.#k.opacity(0),
            this.#k.follow(this.#player),
            this.#k.pos(),
            this.#k.z(-1),
            this.#k.timer(),
            "supportEffect",
        ]);
    }

    add() {
        this.removeControls();
        this.#controls = [];
        this.#k.add(this.#player);
        this.#k.add(this.#inhaleEffectRef);
        this.#k.add(this.#abilityEffect);
        this.#setControls();
    }

    pauseControl() {
        this.#controls.forEach((control) => (control.paused = true));
    }

    resumeControl() {
        this.#controls.forEach((control) => (control.paused = false));
    }

    removeControls() {
        this.#controls.forEach((control) => control.cancel());
    }

    get player() {
        return this.#player;
    }

    get maxJump() {
        return this.#maxJumps;
    }

    buttonDown(newMove: string) {
        this.#moves[newMove] = this.#PRESSED;
    }

    buttonUp(move: string) {
        this.#moves[move] = this.#RELEASED;
    }

    onJump(action: () => void) {
        this.#player.on("jump", action);
    }

    #setControls() {
        if (!this.#k.isTouchscreen()) {
            this.#controls.push(
                this.#k.onKeyDown((key) => {
                    switch (key) {
                        case "a":
                            this.#moveLeft();
                            break;
                        case "d":
                            this.#moveRight();
                            break;
                        case "j":
                            this.#inhaling();
                            break;
                        default:
                            break;
                    }
                })
            );

            this.#controls.push(
                this.#k.onKeyPress((key) => {
                    switch (key) {
                        case "k":
                            this.#jump();
                            break;
                        case "j":
                            this.#shootProjectile();
                            break;
                        case "s":
                            this.#setAbility();
                            break;
                        case "w":
                            this.#reset();
                            break;
                        default:
                            break;
                    }
                })
            );

            this.#controls.push(
                this.#k.onKeyRelease((key) => {
                    switch (key) {
                        case "j":
                            this.#inhaleEnd();
                            break;
                        default:
                            break;
                    }
                })
            );
            return;
        }

        this.#controls.push(
            this.#player.onUpdate(() => {
                for (const move of Object.keys(this.#moves)) {
                    if (this.#moves[move] !== undefined) {
                        switch (this.#moves[move]) {
                            case this.#DOWN:
                                switch (move) {
                                    case "a":
                                        this.#moveLeft();
                                        break;
                                    case "d":
                                        this.#moveRight();
                                        break;
                                    case "j":
                                        this.#inhaling();
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            case this.#PRESSED:
                                switch (move) {
                                    case "j":
                                        this.#shootProjectile();
                                        break;
                                    case "k":
                                        this.#jump();
                                        break;
                                    case "w":
                                        this.#reset();
                                        break;
                                    case "s":
                                        this.#setAbility();
                                        break;
                                    default:
                                        break;
                                }
                                this.#moves[move] = this.#DOWN;
                                break;
                            case this.#RELEASED:
                                switch (move) {
                                    case "j":
                                        this.#inhaleEnd();
                                        break;
                                    default:
                                        break;
                                }
                                this.#moves[move] = undefined;
                                break;
                            default:
                                break;
                        }
                    }
                }
            })
        );
    }

    #respawn() {
        this.#player.heal(this.#DEFAULT_HP);
        this.#reset();
        this.#numJump = 0;
        this.#moves = {};
        this.#player.moveTo(this.#initialPos);

        (async () => {
            for (let i = 0; i < 3; i++) {
                await this.#player.tween(
                    this.#player.opacity,
                    0,
                    0.15,
                    (val) => (this.#player.opacity = val),
                    this.#k.easings.linear
                );
                await this.#player.tween(
                    this.#player.opacity,
                    1,
                    0.15,
                    (val) => (this.#player.opacity = val),
                    this.#k.easings.linear
                );
            }
        })();
    }

    #moveLeft() {
        this.#player.flipX = true;
        this.#player.direction = this.#LEFT;
        this.#player.move(this.#player.direction * this.#player.speed, 0);
    }

    #moveRight() {
        this.#player.flipX = false;
        this.#player.direction = this.#RIGHT;
        this.#player.move(this.#player.direction * this.#player.speed, 0);
    }

    #inhaling() {
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

    #inhaleEnd() {
        if (this.#player.enemyInhaled === -1) {
            this.#player.play("kirbIdle");
            this.#player.isInhaling = false;
            this.#inhaleEffectRef.opacity = 0;
        }
    }

    #jump() {
        if (this.#numJump < this.#maxJumps) {
            this.#player.doubleJump();
            if (this.#maxJumps !== Infinity) {
                this.#numJump++;
                this.#player.trigger("jump");
            }
        }
    }

    #shootProjectile() {
        if (this.#ability == FLAME_TYPE) {
            this.#k.add(
                throwFireball(
                    this.#k,
                    this.#k.vec2(this.#player.direction * 1000, 0),
                    this.#player.pos,
                    "player"
                )
            );
            return true;
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

            return true;
        }

        return false;
    }

    #setAbility() {
        if (this.#player.enemyInhaled > -1) {
            const enemyInhaled = this.#player.enemyInhaled;
            this.#reset();
            this.#ability = enemyInhaled;
            switch (this.#ability) {
                case GUY_TYPE:
                    this.#abilityEffect.color = this.#k.BLACK;
                    break;
                case FLAME_TYPE:
                    this.#player.canInhale = false;
                    this.#abilityEffect.color = this.#k.RED;
                    break;
                case BIRD_TYPE:
                    this.#maxJumps = Infinity;
                    this.#abilityEffect.color = this.#k.WHITE;
                    break;
                default:
                    break;
            }

            this.#abilityEffect.tween(
                0,
                0.3,
                0.5,
                (val) => (this.#abilityEffect.opacity = val)
            );
        }
    }

    #reset() {
        this.#maxJumps = this.#DEFAULT_NUM_JUMP;

        if (this.#ability > -1) {
            this.#abilityEffect.tween(
                this.#abilityEffect.opacity,
                0,
                0.5,
                (val) => (this.#abilityEffect.opacity = val)
            );
            this.#ability = -1;
        }

        this.#player.canInhale = true;

        this.#player.enemyInhaled = -1;

        this.#player.play("kirbIdle");
    }
}
