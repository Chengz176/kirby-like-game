import { useContext, useEffect, useState } from "react";
import { GameDispatchContext } from "../GameContext";
import { GameDataAction } from "../definitions";
import titleUrl from "../assets/title.svg";
import { BACKGROUND_COLOR } from "../constants";
import Button from "./Button";
import { initRandNumGen } from "../helpers";

export default function StartScreen() {
    const gameDispatch = useContext(GameDispatchContext);
    const [mode, setMode] = useState<0 | 1 | 2 | 3>(0);
    const [seed, setSeed] = useState<string>("");
    const [isValidSeed, setIsValidSeed] = useState<boolean>(false);
    const [rounds, setRounds] = useState<number>(1);
    useEffect(() => {
        if (gameDispatch !== null) {
            gameDispatch({ type: "reset" } as GameDataAction);
        }
    }, []);

    const handlePlay = () => {
        if (gameDispatch !== null) {
            switch (mode) {
                case 2:
                    if (isValidSeed) {
                        gameDispatch({
                            type: "changedScreen",
                            nextScreen: "rounds",
                            newRounds: 1,
                            newSeed: Number(seed),
                        } as GameDataAction);
                    }
                    break;
                case 3:
                    gameDispatch({
                        type: "changedScreen",
                        nextScreen: "rounds",
                        newRounds: rounds,
                    } as GameDataAction);
                    break;
                default:
                    break;
            }
        }
    };

    const handleSeedChange = (newSeed: string) => {
        setSeed(newSeed);

        const num = Number(newSeed);
        const isInRange = num > 0 && num < randNumUpperBound;
        const isPositiveInteger = /^\d+$/.test(newSeed);
        setIsValidSeed(isInRange || isPositiveInteger);
    };

    const handleRoundsChange = (newRounds: number) => {
        setRounds(newRounds);
    };

    const handleBack = () => {
        setMode(1);
        setSeed("");
        setRounds(1);
    };

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor: BACKGROUND_COLOR,
            }}
        >
            <object
                data={titleUrl}
                type="image/svg+xml"
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "80%",
                    top: "-20%",
                    overflow: "hidden",
                }}
            />

            <div className="input-list-container">
                {mode === 0 ? (
                    <Button key={1} onClick={() => setMode(1)} text="Play" />
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            rowGap: "10px",
                        }}
                    >
                        {mode === 2 ? (
                            <SeedInputBox
                                seed={seed}
                                isValidSeed={isValidSeed}
                                onChange={handleSeedChange}
                            />
                        ) : mode === 3 ? (
                            <RoundsSlider
                                rounds={rounds}
                                onDrag={handleRoundsChange}
                            />
                        ) : null}
                        {mode === 1 ? (
                            <>
                                <Button
                                    key={2}
                                    onClick={() => setMode(2)}
                                    text={"Select Map"}
                                />
                                <Button
                                    key={3}
                                    onClick={() => setMode(3)}
                                    text={"Rounds"}
                                />
                            </>
                        ) : null}
                        {mode === 2 || mode === 3 ? (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    columnGap: "10%",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <Button onClick={handleBack} text="Back" />
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        position: "relative",
                                    }}
                                >
                                    <Button onClick={handlePlay} text="Go!" />
                                    {mode === 2 && !isValidSeed ? (
                                        <div
                                            className="sprite-img guy-img"
                                            style={{
                                                position: "absolute",
                                                right: 8,
                                                bottom: 8,
                                                left: "auto",
                                            }}
                                        />
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

const randNumUpperBound = initRandNumGen().upperBound();
function SeedInputBox({
    seed,
    isValidSeed,
    onChange: handleChange,
}: {
    seed: string;
    isValidSeed: boolean;
    onChange: (newSeed: string) => void;
}) {
    const [isWarning, setIsWarning] = useState<boolean>(false);
    return (
        <div className="input-container">
            <label
                htmlFor="seed"
                style={{
                    display: "block",
                    textShadow: "1px 1px black",
                    fontSize: "1rem",
                    textAlign: "center",
                    padding: 10,
                }}
            >
                Seed:
            </label>
            <div
                style={{
                    height: "80%",
                    width: "60%",
                    position: "relative",
                }}
            >
                <input
                    type="text"
                    id="seed"
                    style={{
                        borderRadius: "10px",
                        border: !isValidSeed ? "2px solid red" : "",
                        height: "100%",
                        width: "80%",
                        padding: 1,
                        color: "black",
                    }}
                    value={seed}
                    onChange={(e) => handleChange(e.target.value)}
                />

                {!isValidSeed ? (
                    <div
                        style={{
                            display: "inline-block",
                            aspectRatio: 1 / 1,
                            paddingLeft: 1,
                        }}
                        onClick={() =>
                            setIsWarning((prevState) => prevState !== true)
                        }
                    >
                        <strong
                            style={{
                                color: "red",
                                fontSize: "1rem",
                                cursor: "pointer",
                            }}
                        >
                            !
                        </strong>
                    </div>
                ) : (
                    ""
                )}

                {isWarning ? (
                    <div
                        style={{
                            position: "absolute",
                            color: "red",
                            fontSize: "0.6rem",
                            bottom: "100%",
                            border: "1px solid black",
                            backgroundColor: "white",
                            padding: 1,
                        }}
                    >
                        Please Enter a whole number between 1 and{" "}
                        {randNumUpperBound - 1}
                    </div>
                ) : null}
            </div>
            <div
                style={{
                    width: "20%",
                    height: "100%",
                    position: "relative",
                }}
            >
                <div className="sprite-img flame-img" style={{ bottom: 0 }} />
            </div>
        </div>
    );
}

const MAX_ROUNDS = 30;
function RoundsSlider({
    rounds,
    onDrag: handleDrag,
}: {
    rounds: number;
    onDrag: (newRounds: number) => void;
}) {
    const [isDrag, setIsDrag] = useState<boolean>(false);
    const [pos, setPos] = useState<number>(0);
    return (
        <div
            className="input-container"
            style={{
                columnGap: "10%",
                touchAction: 'none',
            }}
        >
            <span
                style={{
                    display: "block",
                    textShadow: "1px 1px black",
                    fontSize: "0.7rem",
                    textAlign: "center",
                    padding: 10,
                    width: "20%",
                }}
            >
                {rounds} {rounds === 1 ? "Round" : "Rounds"}
            </span>
            <div
                style={{
                    width: "60%",
                    height: "80%",
                    position: "relative",
                    borderLeft: "10px solid black",
                    borderRight: "10px solid black",
                }}
                onPointerDown={(e) => {
                    e.preventDefault();
                    setIsDrag(true);
                }}
                onPointerUp={() => {
                    setIsDrag(false);
                }}
                onPointerMove={(e) => {
                    e.preventDefault();
                    if (isDrag) {
                        const newPos =
                            (e.clientX -
                                e.currentTarget.getBoundingClientRect().x) /
                            e.currentTarget.clientWidth;
                        if (newPos < 0 || newPos > 1) {
                            return;
                        }
                        handleDrag(Math.ceil(newPos * MAX_ROUNDS));
                        setPos(newPos);
                    }
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "10%",
                        position: "relative",
                        top: "49%",
                        backgroundColor: "black",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            transformOrigin: "center",
                            transform: "rotateY(180deg)",
                            left: `${pos * 100}%`,
                        }}
                    >
                        <div className="sprite-img bird-img"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
