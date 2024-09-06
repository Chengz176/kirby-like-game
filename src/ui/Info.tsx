import { useState } from "react";
import { ControlButton, Arrow } from "./Control";
import InfoList, { InfoItem } from "./InfoList";
import Button from "./Button";

export default function Info({
    handleCloseInfo,
}: {
    handleCloseInfo: () => void;
}) {
    const infoPages = ["Controls", "Enemy", "Player"];
    const [page, setPage] = useState<number>(0);

    const handlePrev = () => {
        setPage((prevPage) => Math.max(0, prevPage - 1));
    };

    const handleNext = () => {
        setPage((prevPage) => Math.min(infoPages.length - 1, prevPage + 1));
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                width: "90%",
                height: "80%",
                backgroundColor: "lightpink",
                borderRadius: 10,
            }}
        >
            <div
                style={{
                    padding: "5% 10% 0 10%",
                    position: "relative",
                    width: "100%",
                    height: "90%",
                }}
            >
                {page === 0 ? (
                    <ControlsInfo />
                ) : page === 1 ? (
                    <EnemyInfo />
                ) : (
                    <PlayerInfo />
                )}
            </div>
            <div
                style={{
                    width: "100%",
                    height: "10%",
                    padding: "0 10%",
                    position: "relative",
                    bottom: 0,
                }}
            >
                {page > 0 ? (
                    <div
                        style={{
                            position: "absolute",
                            left: "10%",
                            width: "25%",
                            height: "100%",
                        }}
                    >
                        <Button
                            onClick={handlePrev}
                            text={`< ${infoPages[page - 1]}`}
                        />
                    </div>
                ) : null}
                {
                    <div
                        style={{
                            position: "absolute",
                            left: "40%",
                            width: "20%",
                            height: "100%",
                        }}
                    >
                        <Button onClick={handleCloseInfo} text={`close`} />
                    </div>
                }
                {page < infoPages.length - 1 ? (
                    <div
                        style={{
                            position: "absolute",
                            left: "65%",
                            width: "25%",
                            height: "100%",
                        }}
                    >
                        <Button
                            onClick={handleNext}
                            text={`${infoPages[page + 1]} >`}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ControlsInfo() {
    return (
        <InfoList title="Controls">
            <InfoItem
                demo={
                    <div>
                        <div
                            style={{
                                position: "relative",
                                width: "40%",
                                aspectRatio: "1 / 1",
                            }}
                        >
                            <ControlButton
                                onTouchStart={() => {}}
                                onTouchEnd={() => {}}
                                width="80%"
                                rotate="0deg"
                            >
                                <Arrow />
                            </ControlButton>
                        </div>
                        <div>
                            <strong>{"/ Key w"}</strong>
                        </div>
                    </div>
                }
                description={"Reset Kirb to initial state"}
            />
            <InfoItem
                demo={
                    <div>
                        <div
                            style={{
                                position: "relative",
                                width: "40%",
                                aspectRatio: "1 / 1",
                            }}
                        >
                            <ControlButton
                                onTouchStart={() => {}}
                                onTouchEnd={() => {}}
                                width="80%"
                                rotate="90deg"
                            >
                                <Arrow />
                            </ControlButton>
                        </div>
                        <div>
                            <strong>{"/ Key d"}</strong>
                        </div>
                    </div>
                }
                description={"Move right"}
            />
            <InfoItem
                demo={
                    <div>
                        <div
                            style={{
                                position: "relative",
                                width: "40%",
                                aspectRatio: "1 / 1",
                            }}
                        >
                            <ControlButton
                                onTouchStart={() => {}}
                                onTouchEnd={() => {}}
                                width="80%"
                                rotate="180deg"
                            >
                                <Arrow />
                            </ControlButton>
                        </div>
                        <div>
                            <strong>{"/ Key s"}</strong>
                        </div>
                    </div>
                }
                description={"Gain ability from inhaled enemy"}
            />
            <InfoItem
                demo={
                    <div>
                        <div
                            style={{
                                position: "relative",
                                width: "40%",
                                aspectRatio: "1 / 1",
                            }}
                        >
                            <ControlButton
                                onTouchStart={() => {}}
                                onTouchEnd={() => {}}
                                width="80%"
                                rotate="270deg"
                            >
                                <Arrow />
                            </ControlButton>
                        </div>
                        <div>
                            <strong>{"/ Key a"}</strong>
                        </div>
                    </div>
                }
                description={"Move left"}
            />
            <InfoItem
                demo={
                    <div>
                        <div
                            style={{
                                position: "relative",
                                width: "40%",
                                aspectRatio: "1 / 1",
                            }}
                        >
                            <ControlButton
                                onTouchStart={() => {}}
                                onTouchEnd={() => {}}
                                width="80%"
                            >
                                <strong
                                    style={{ fontSize: "1em", color: "silver" }}
                                >
                                    A
                                </strong>
                            </ControlButton>
                        </div>
                        <div>
                            <strong>{"/ Key j"}</strong>
                        </div>
                    </div>
                }
                description={"Inhale enemy / shoot star / throw fireball"}
            />
            <InfoItem
                demo={
                    <div>
                        <div
                            style={{
                                position: "relative",
                                width: "40%",
                                aspectRatio: "1 / 1",
                            }}
                        >
                            <ControlButton
                                onTouchStart={() => {}}
                                onTouchEnd={() => {}}
                                width="80%"
                            >
                                <strong
                                    style={{ fontSize: "1em", color: "silver" }}
                                >
                                    B
                                </strong>
                            </ControlButton>
                        </div>
                        <div>
                            <strong>{"/ Key k"}</strong>
                        </div>
                    </div>
                }
                description={"Jump"}
            />
            <InfoItem
                demo={
                    <div>
                        <div
                            style={{
                                position: "relative",
                                width: "40%",
                                aspectRatio: "1 / 1",
                            }}
                        >
                            <ControlButton
                                onTouchStart={() => {}}
                                onTouchEnd={() => {}}
                                width="80%"
                            >
                                <strong
                                    style={{ fontSize: "1em", color: "silver" }}
                                >
                                    Options
                                </strong>
                            </ControlButton>
                        </div>
                        <div>
                            <strong>{"/ Key b"}</strong>
                        </div>
                    </div>
                }
                description={"Show / Hide Options"}
            />
        </InfoList>
    );
}

function EnemyInfo() {
    return (
        <InfoList title="Enemy">
            <InfoItem
                demo={
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            position: "relative",
                        }}
                    >
                        <div
                            className="sprite-img guy-img"
                            style={{
                                position: "relative",
                                left: "16px",
                                top: "32px",
                                transform: "scale(3)",
                            }}
                        />
                    </div>
                }
                description={
                    <>
                        <p>
                            <strong>Name:</strong> Guy
                        </p>
                        <p>
                            <strong>HP:</strong> 2
                        </p>
                        <p>
                            <strong>Description:</strong> The enemy wanders
                            around on the platform.
                        </p>
                    </>
                }
            />
            <InfoItem
                demo={
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            position: "relative",
                        }}
                    >
                        <div
                            className="sprite-img flame-img"
                            style={{
                                position: "relative",
                                left: "16px",
                                top: "32px",
                                transform: "scale(3)",
                            }}
                        />
                    </div>
                }
                description={
                    <>
                        <p>
                            <strong>Name:</strong> Flame
                        </p>
                        <p>
                            <strong>HP:</strong> 1
                        </p>
                        <p>
                            <strong>Description:</strong> The enemy will jump
                            every 5 seconds. The enemy will throw fireballs when
                            reaching the highest point it can jump to.
                        </p>
                    </>
                }
            />
            <InfoItem
                demo={
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            position: "relative",
                        }}
                    >
                        <div
                            className="sprite-img bird-img"
                            style={{
                                position: "relative",
                                left: "16px",
                                top: "32px",
                                transform: "scale(3)",
                            }}
                        />
                    </div>
                }
                description={
                    <>
                        <p>
                            <strong>Name:</strong> Bird
                        </p>
                        <p>
                            <strong>HP:</strong> 1
                        </p>
                        <p>
                            <strong>Description:</strong> The enemy will fly
                            around every 2 seconds and tends to approach the
                            player.
                        </p>
                    </>
                }
            />
        </InfoList>
    );
}

function PlayerInfo() {
    return (
        <InfoList title="Player">
            <InfoItem
                demo={
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            position: "relative",
                        }}
                    >
                        <div
                            className="sprite-img kirb-img"
                            style={{
                                position: "relative",
                                left: "16px",
                                top: "32px",
                                transform: "scale(3)",
                                animationName: "none",
                            }}
                        />
                    </div>
                }
                description={
                    <>
                        <p>
                            <strong>Name:</strong> Kirb
                        </p>
                        <p>
                            <strong>HP:</strong> 3
                        </p>
                        <p>
                            <strong>Description:</strong> The character
                            controlled by the player. By default, Kirb can jump
                            5 times consecutively without the need to land on
                            the ground in between. It can inhale one enemy at a
                            time, shoot one star at a time, and absorb ability
                            from the enemy. Absorbed ability will disappear when
                            colliding with an enemy. Kirb can only have one
                            ability.
                        </p>
                    </>
                }
            />
            <InfoItem
                demo={
                    <div
                        style={{
                            width: "48px",
                            aspectRatio: "1 / 1",
                            borderRadius: "50%",
                            backgroundColor: "black",
                            opacity: 0.5,
                        }}
                    ></div>
                }
                description={
                    <>
                        <p>
                            <strong>Ability Name:</strong> Shield
                        </p>
                        <p>
                            <strong>Description:</strong> Kirb absorbs this
                            ability from Guy. The shield will protect Kirb from
                            one hit of an enemy.
                        </p>
                    </>
                }
            />
            <InfoItem
                demo={
                    <div
                        style={{
                            width: "48px",
                            aspectRatio: "1 / 1",
                            borderRadius: "50%",
                            backgroundColor: "white",
                            opacity: 0.5,
                        }}
                    ></div>
                }
                description={
                    <>
                        <p>
                            <strong>Ability Name:</strong> Fly
                        </p>
                        <p>
                            <strong>Description:</strong> Kirb absorbs this
                            ability from Bird. This ability allowed Kirb to jump
                            indefinitely without the need to land on the ground
                            in between.
                        </p>
                    </>
                }
            />
            <InfoItem
                demo={
                    <div
                        style={{
                            width: "48px",
                            aspectRatio: "1 / 1",
                            borderRadius: "50%",
                            backgroundColor: "red",
                            opacity: 0.5,
                        }}
                    ></div>
                }
                description={
                    <>
                        <p>
                            <strong>Ability Name:</strong> Fire
                        </p>
                        <p>
                            <strong>Description:</strong> Kirb absorbs this
                            ability from Flame. This ability allowed Kirb to
                            throw fireballs.
                        </p>
                    </>
                }
            />
        </InfoList>
    );
}
