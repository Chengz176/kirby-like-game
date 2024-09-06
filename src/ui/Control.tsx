import { PlayerEntity } from "../entities/player";
import "../index.css";
import React, { useEffect, useState } from "react";
import Button from "./Button";
import { Scene } from "../scenes";

export default function Control({
    handleEnd,
    scene,
    togglePause,
    miniMap,
    toggleMiniMap,
    toggleInfo,
}: {
    handleEnd: () => void;
    scene: Scene;
    togglePause: () => void;
    miniMap: boolean;
    toggleMiniMap: () => void;
    toggleInfo: () => void;
}) {
    const [control, setControl] = useState<boolean>(false);
    const [options, setOptions] = useState<boolean>(true);

    const toggleControl = () => {
        setControl((prevState) => prevState !== true);
    };

    if (!options) {
        scene.resume();
    } else {
        scene.pause();
    }

    const toggleOptions = () => {
        setOptions((prevState) => prevState !== true);
        togglePause();
    };

    const handleOptionsPressed = (e: KeyboardEvent) => {
        if (e.key === 'b') {
            toggleOptions();
        }
    }

    useEffect(() => {
        setControl(scene.k.isTouchscreen());
        if (!scene.k.isTouchscreen()) {
            scene.k.canvas.addEventListener("keydown", handleOptionsPressed);

            return () => {
                scene.k.canvas.removeEventListener("keydown", handleOptionsPressed);
            };
        }
    }, []);

    return (
        <>
            {control && scene !== undefined ? (
                <ControlMovement
                    playerEntity={scene.kirb}
                    toggleOptions={toggleOptions}
                />
            ) : null}
            {options ? (
                <ControlSetting
                    handleEnd={handleEnd}
                    control={control}
                    miniMap={miniMap}
                    toggleMiniMap={toggleMiniMap}
                    toggleControl={toggleControl}
                    toggleInfo={toggleInfo}
                />
            ) : null}
        </>
    );
}

function ControlSetting({
    handleEnd,
    control,
    miniMap,
    toggleControl,
    toggleMiniMap,
    toggleInfo,
}: {
    handleEnd: () => void;
    control: boolean;
    miniMap: boolean;
    toggleMiniMap: () => void;
    toggleControl: () => void;
    toggleInfo: () => void;
}) {
    return (
        <>
            <div
                style={{
                    pointerEvents: "none",
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                }}
            >
                <div
                    style={{
                        width: "60%",
                        position: "relative",
                        left: "20%",
                        top: "20%",
                        backgroundColor: "lightpink",
                        display: "flex",
                        rowGap: 10,
                        flexDirection: "column",
                        padding: 10,
                        borderRadius: 10,
                    }}
                >
                    <h3
                        style={{
                            textAlign: "center",
                            textShadow: "1px 1px black",
                        }}
                    >
                        Options
                    </h3>
                    <div style={{ display: "flex", columnGap: 10 }}>
                        <Button
                            onClick={toggleControl}
                            text={`Virtual Control: ${control ? "ON" : "OFF"}`}
                        />
                        <Button
                            onClick={toggleMiniMap}
                            text={`Mini-map: ${miniMap ? "ON" : "OFF"}`}
                        />
                    </div>

                    <div style={{ display: "flex", columnGap: 10 }}>
                        <Button onClick={toggleInfo} text="Info" />
                        <Button onClick={handleEnd} text="End Game" />
                    </div>
                </div>
            </div>
        </>
    );
}

function ControlMovement({
    playerEntity,
    toggleOptions,
}: {
    playerEntity: PlayerEntity;
    toggleOptions: () => void;
}) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    width: "30%",
                    height: "auto",
                    aspectRatio: "1 / 1",
                    backgroundColor: "transparent",
                    bottom: "1%",
                    left: "1%",
                }}
            >
                <ControlButton
                    onTouchStart={() => playerEntity.buttonDown("w")}
                    onTouchEnd={() => playerEntity.buttonUp("w")}
                    width="40%"
                    left="30%"
                >
                    <Arrow />
                </ControlButton>
                <ControlButton
                    onTouchStart={() => playerEntity.buttonDown("d")}
                    onTouchEnd={() => playerEntity.buttonUp("d")}
                    width="40%"
                    rotate="90deg"
                    top="30%"
                    left="60%"
                >
                    <Arrow />
                </ControlButton>
                <ControlButton
                    onTouchStart={() => playerEntity.buttonDown("s")}
                    onTouchEnd={() => playerEntity.buttonUp("s")}
                    width="40%"
                    rotate="180deg"
                    top="60%"
                    left="30%"
                >
                    <Arrow />
                </ControlButton>
                <ControlButton
                    onTouchStart={() => playerEntity.buttonDown("a")}
                    onTouchEnd={() => playerEntity.buttonUp("a")}
                    width="40%"
                    rotate="270deg"
                    top="30%"
                    right="60%"
                >
                    <Arrow />
                </ControlButton>
            </div>
            <div
                style={{
                    position: "absolute",
                    width: "30%",
                    height: "auto",
                    aspectRatio: "1 / 1",
                    backgroundColor: "transparent",
                    bottom: "1%",
                    right: "1%",
                }}
            >
                <ControlButton
                    onTouchStart={() => playerEntity.buttonDown("j")}
                    onTouchEnd={() => playerEntity.buttonUp("j")}
                    width="40%"
                    top="50%"
                    left="10%"
                >
                    <strong style={{ fontSize: "2em", color: "silver" }}>
                        A
                    </strong>
                </ControlButton>
                <ControlButton
                    onTouchStart={() => playerEntity.buttonDown("k")}
                    onTouchEnd={() => playerEntity.buttonUp("k")}
                    width="40%"
                    top="10%"
                    left="50%"
                >
                    <strong style={{ fontSize: "2em", color: "silver" }}>
                        B
                    </strong>
                </ControlButton>
            </div>
            <div
                style={{
                    position: "absolute",
                    backgroundColor: "transparent",
                    bottom: "20%",
                    right: "60%",
                    width: "fit-content",
                    height: "fit-content",
                }}
            >
                <ControlButton
                    onTouchEnd={toggleOptions}
                    onTouchStart={() => {}}
                    width={"fit-content"}
                >
                    <strong style={{ fontSize: "1rem", color: "silver" }}>
                        Options
                    </strong>
                </ControlButton>
            </div>
        </div>
    );
}

export function ControlButton({
    children,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    width,
    rotate = "0deg",
    top = 0,
    right = 0,
    bottom = 0,
    left = 0,
}: {
    children?: React.ReactNode;
    onTouchEnd?: () => void;
    onTouchStart?: () => void;
    width: React.CSSProperties["width"];
    rotate?: React.CSSProperties["rotate"];
    top?: React.CSSProperties["top"];
    right?: React.CSSProperties["right"];
    bottom?: React.CSSProperties["bottom"];
    left?: React.CSSProperties["left"];
}) {
    return (
        <div
            // className="control-button"
            style={{
                width,
                height: "fit-Content",
                position: "absolute",
                top,
                right,
                bottom,
                left,
            }}
        >
            <button
                style={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "1 / 1",
                    borderRadius: "50%",
                    rotate,
                    pointerEvents: "visible",
                    opacity: 0.5,
                }}
                onTouchStart={(event) => {
                    // event.preventDefault();
                    handleTouchStart!();
                    event.currentTarget.style.opacity = "1";
                }}
                onTouchEnd={(event) => {
                    event.preventDefault();
                    handleTouchEnd!();
                    event.currentTarget.style.opacity = "0.5";
                }}
            >
                {children}
            </button>
        </div>
    );
}

export function Arrow() {
    return (
        <div
            style={{
                position: "relative",
                bottom: "10%",
                left: "25%",
                width: "50%",
                height: "50%",
                background: "transparent",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "relative",
                    top: "50%",
                    right: 0,
                    width: "100%",
                    height: "100%",
                    rotate: "45deg",
                    backgroundColor: "silver",
                }}
            />
        </div>
    );
}
