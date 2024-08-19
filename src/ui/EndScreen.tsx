import { useContext } from "react";
import { GameContext, GameDispatchContext } from "../GameContext";
import { BACKGROUND_COLOR } from "../constants";
import InfoList, { InfoItem } from "./InfoList";
import Button from "./Button";
import { GameDataAction } from "../definitions";

export default function EndScreen() {
    const gameData = useContext(GameContext);
    const gameDispatch = useContext(GameDispatchContext);

    let totalTime = 0;
    for (let i = 0; i < gameData!.numRounds; i++) {
        totalTime += gameData!.times[gameData!.times.length - 1 - i];
    }

    const handleStart = () => {
        if (gameDispatch !== null) {
            gameDispatch({
                type: "changedScreen",
                nextScreen: "start",
            } as GameDataAction);
        }
    };

    const totalMinutes = Math.floor(totalTime / 60)
        .toString()
        .padStart(2, "0");
    const totalSeconds = (totalTime % 60).toString().padStart(2, "0");

    const roundsSummary = [];
    for (let i = 0; i < gameData!.numRounds; i++) {
        const time = gameData!.times[gameData!.times.length - 1 - i];
        const minutes = Math.floor(time / 60)
            .toString()
            .padStart(2, "0");
        const seconds = (time % 60).toString().padStart(2, "0");

        roundsSummary.push({
            round: gameData!.numRounds - i,
            screenshot:
                gameData!.scenesScreenshot[
                    gameData!.scenesScreenshot.length - 1 - i
                ],
            time: `${minutes}:${seconds}`,
            seed: gameData!.seeds[gameData!.seeds.length - 1 - i],
        });
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: BACKGROUND_COLOR,
                flexDirection: "column",
                rowGap: 10,
            }}
        >
            <h2 style={{textAlign: 'center'}}>
                You completed {gameData!.numRounds} rounds in {totalMinutes}:
                {totalSeconds}!
            </h2>
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "80%",
                    padding: "0 10%",
                }}
            >
                <InfoList title="Summary">
                    {roundsSummary.map((summary) => (
                        <InfoItem
                            key={summary.round}
                            demo={
                                <img
                                    style={{ width: "100%", height: "100%" }}
                                    src={summary.screenshot}
                                />
                            }
                            description={
                                <>
                                    <p>
                                        <strong>Round:</strong> {summary.round}
                                    </p>
                                    <p>
                                        <strong>Time:</strong> {summary.time}
                                    </p>
                                    <p>
                                        <strong>Seed:</strong> {summary.seed}
                                    </p>
                                </>
                            }
                        />
                    ))}
                </InfoList>
            </div>

            <div className="input-list-container" style={{bottom: '10%'}}>
                <Button onClick={handleStart} text="Back to Home" />
            </div>
        </div>
    );
}
