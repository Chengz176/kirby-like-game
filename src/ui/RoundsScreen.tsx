import { useContext, useEffect, useRef, useState } from "react";
import kaboom, { EventController, KaboomCtx } from "kaboom";
import { FRAME_SIDE, SCALE } from "../constants";
import kirbLikeUrl from "../assets/kirby-like.png";
import { GameContext, GameDispatchContext } from "../GameContext";
import { Coord2D, GameDataAction } from "../definitions";
import { defineLoadingScene, defineRoundScene, Scene } from "../scenes";
import { initRandNumGen } from "../helpers";
import "../index.css";
import Control from "./Control";
import Info from "./Info";

let k: KaboomCtx;
let maxJump: number;

export default function RoundsScreen(this: any) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scene, setScene] = useState<Scene>();
    const [rounds, setRounds] = useState(-1);
    const [time, setTime] = useState<number>(0);
    const [seed, setSeed] = useState<number>(-1);
    const [hp, setHp] = useState<number>();
    const [numJump, setNumJump] = useState<number>(0);
    const [pause, setPause] = useState<boolean>(true);
    const [miniMap, setMiniMap] = useState<boolean>(true);
    const [info, setInfo] = useState<boolean>(true);
    const [screenshot, setScreenshot] = useState<string>("");

    useEffect(() => {
        if (gameDispatch !== null && rounds > -1 && k !== undefined) {
            gameDispatch({
                type: "nextScene",
                newScreenshot: screenshot,
                newSeed: seed,
                newTime: time,
            } as GameDataAction);

            if (gameData !== null && rounds < gameData.numRounds) {
                let newSeed = initRandNumGen().seed();
                if (
                    gameData.seeds.length > 0 &&
                    gameData.seeds[0] > 0 &&
                    gameData.numRounds === 1
                ) {
                    newSeed = gameData.seeds[0];
                }
                defineRoundScene(k, handleNextScene, newSeed).then((scene) => {
                    const kirb = scene.kirb;
                    maxJump = kirb.maxJump;
                    setHp(kirb.player.hp());
                    kirb.player.onHeal((amount) => {
                        setHp((prevHp) => prevHp! + amount!);
                    });
                    kirb.onJump(() => {
                        setNumJump((prevNum) => prevNum! + 1);
                    });
                    kirb.player.onGround(() => {
                        setNumJump(0);
                    });
                    setScene(scene);
                    setTime(0);
                    togglePause();
                    k.go("rounds");
                });
                setSeed(newSeed);
            } else {
                handleEnd();
            }
        }
    }, [rounds]);

    useEffect(() => {
        k = kaboom({
            width: 256 * SCALE,
            height: 144 * SCALE,
            scale: SCALE,
            letterbox: true,
            global: false,
            root: containerRef.current as HTMLDivElement,
        });

        k.loadSprite("assets", kirbLikeUrl, {
            sliceX: 9,
            sliceY: 10,
            anims: {
                kirbIdle: 0,
                kirbInhaling: 1,
                kirbFull: 2,
                kirbInhaleEffect: {
                    from: 3,
                    to: 8,
                    speed: 15,
                    loop: true,
                },
                shootingStar: 9,
                flame: { from: 36, to: 37, speed: 4, loop: true },
                guyIdle: 18,
                guyWalk: { from: 18, to: 19, speed: 4, loop: true },
                bird: { from: 27, to: 28, speed: 4, loop: true },
            },
        });

        defineLoadingScene(k);

        k.onSceneLeave((nextScene) => {
            if (nextScene === "loading") {
                handleNextScene();
            }
        });

        k.go("loading");

        return () => {
            k.quit();
            setRounds((prevRounds) => prevRounds - 1);
            togglePause();
            containerRef.current?.removeChild(
                document.getElementsByTagName("canvas")[0]
            );
        };
    }, []);

    const handleTimeIncrement = () => {
        setTime((prevTime) => prevTime + 1);
    };

    const togglePause = () => {
        setPause((prevState) => prevState !== true);
    };

    const toggleMiniMap = () => {
        setMiniMap((prevState) => prevState !== true);
    };

    const toggleInfo = () => {
        setInfo((prevState) => prevState !== true);
    };

    const gameData = useContext(GameContext);
    const gameDispatch = useContext(GameDispatchContext);

    const handleNextScene = () => {
        k.canvas.toBlob((blob) => {
            if (blob !== null) {
                setScreenshot(URL.createObjectURL(blob));
                setRounds((prevRound) => prevRound + 1);
                togglePause();
            }
        }, "image/jpeg");
    };

    const handleEnd = () => {
        if (gameDispatch !== null) {
            gameDispatch({
                type: "changedScreen",
                nextScreen: "end",
                newRounds: rounds,
            } as GameDataAction);
        }
    };

    return (
        <>
            <div
                id={"canvas-container"}
                ref={containerRef}
                className="container"
            >
                <div
                    style={{
                        position: "absolute",
                        height: "10%",
                        padding: "1% 0 0 1%",
                    }}
                >
                    {!pause ? (
                        <>
                            <HealthBar hp={hp} />
                            <EnergyBar maxJump={maxJump} numJump={numJump} />
                        </>
                    ) : null}
                </div>
                <div
                    style={{
                        width: "100%",
                        position: "absolute",
                        padding: "1%",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            width: "100%",
                            textShadow: "1px 1px black",
                        }}
                    >
                        {!pause ? `Round ${rounds + 1}` : null}
                    </h2>
                    {!pause ? (
                        <Timer
                            key={rounds}
                            time={time}
                            onTimeIncrement={handleTimeIncrement}
                        />
                    ) : null}
                </div>
            </div>
            {scene !== undefined ? (
                <>
                    <div
                        className="container"
                        style={{ pointerEvents: "none" }}
                    >
                        <MiniMap scene={scene} opacity={miniMap ? 0.5 : 0} />
                        <Control
                            toggleInfo={toggleInfo}
                            handleEnd={handleEnd}
                            scene={scene}
                            togglePause={togglePause}
                            miniMap={miniMap}
                            toggleMiniMap={toggleMiniMap}
                        />
                    </div>
                    {info ? <Info handleCloseInfo={toggleInfo} /> : null}
                </>
            ) : null}
        </>
    );
}

function MiniMap({ scene, opacity }: { scene: Scene; opacity: number }) {
    const playerCanvasRef = useRef<HTMLCanvasElement>(null);
    const mapCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleOnScreen = (pos: Coord2D) => {
        if (mapCanvasRef.current !== null) {
            const mapCtx = mapCanvasRef.current.getContext("2d");
            if (mapCtx !== null) {
                mapCtx.fillStyle = "white";
                mapCtx.fillRect(
                    pos.x,
                    pos.y,
                    FRAME_SIDE * SCALE,
                    FRAME_SIDE * SCALE
                );
            }
        }
    };

    useEffect(() => {
        let controllers: EventController[] = [];
        controllers.push(
            scene.kirb.player.onUpdate(() => {
                if (playerCanvasRef.current !== null) {
                    const playerCtx = playerCanvasRef.current.getContext("2d");
                    if (playerCtx !== null) {
                        playerCtx.clearRect(0, 0, scene.width, scene.height);
                        playerCtx.fillStyle = "black";
                        playerCtx.fillRect(0, 0, scene.width, scene.height);
                        playerCtx.fillStyle = "crimson";
                        playerCtx.fillRect(
                            scene.kirb.player.pos.x,
                            scene.kirb.player.pos.y,
                            FRAME_SIDE * SCALE,
                            FRAME_SIDE * SCALE
                        );
                    }
                }
            })
        );

        controllers = controllers.concat(
            ...scene.platformOnScreen(handleOnScreen)
        );

        if (mapCanvasRef.current !== null && playerCanvasRef.current !== null) {
            mapCanvasRef.current.width = scene.width;
            mapCanvasRef.current.height = scene.height;
            playerCanvasRef.current.height = scene.height;
            playerCanvasRef.current.width = scene.width;
        }

        return () => {
            controllers.forEach((controller) => controller.cancel());
        };
    }, [scene]);

    return (
        <div className="mini-map-container" style={{ opacity: opacity }}>
            <canvas
                style={{ width: "100%", height: "100%", position: "absolute" }}
                ref={playerCanvasRef}
            />
            <canvas
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    background: "transparent",
                }}
                ref={mapCanvasRef}
            />
        </div>
    );
}

function EnergyBar({
    maxJump = 1,
    numJump = 0,
}: {
    maxJump?: number;
    numJump?: number;
}) {
    return (
        <div
            className="bar"
            style={{
                aspectRatio: `${maxJump} / 1`,
                justifyContent: "start",
                border: "1px solid black",
            }}
        >
            <div
                style={{
                    height: "100%",
                    width: `${((maxJump - numJump) / maxJump) * 100}%`,
                    backgroundColor: "white",
                    transition: "width 100ms",
                }}
            ></div>
        </div>
    );
}

function HealthBar({ hp = 0 }: { hp?: number }) {
    const hearts = Array<number>(hp).fill(0);
    return (
        <div
            style={{
                aspectRatio: `${hp} / 1`,
            }}
            className="bar"
        >
            {hearts.map((_, ind) => {
                return (
                    <div
                        style={{
                            width: "auto",
                            height: "100%",
                            aspectRatio: "1 / 1",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        key={ind}
                    >
                        <div className="heart" />
                    </div>
                );
            })}
        </div>
    );
}

function Timer({
    time,
    onTimeIncrement: handleTimeIncrement,
}: {
    time: number;
    onTimeIncrement: () => void;
}) {
    useEffect(() => {
        const timer = setInterval(() => {
            handleTimeIncrement();
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const minutes = Math.floor(time / 60)
        .toString()
        .padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");

    return (
        <div style={{ width: "100%" }}>
            <strong
                color="white"
                style={{ textShadow: "1px 1px black" }}
            >{`${minutes}:${seconds}`}</strong>
        </div>
    );
}
