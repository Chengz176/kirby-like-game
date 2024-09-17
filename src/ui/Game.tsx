import React, { useReducer } from "react";
import "../index.css";
import { GameData, GameDataAction } from "../definitions";
import StartScreen from "./StartScreen";
import EndScreen from "./EndScreen";
import { GameContext, GameDispatchContext } from "../GameContext";
import RoundsScreen from "./RoundsScreen";

export function Game() {
    const gameStatesReducer: React.Reducer<GameData, GameDataAction> = (
        gameData: GameData,
        action: GameDataAction
    ) => {
        switch (action.type) {
            case "changedScreen":
                return {
                    ...gameData,
                    currentScreen: action.nextScreen!,
                    numRounds:
                        action.newRounds === undefined ? -1 : action.newRounds,
                    seeds:
                        action.newSeed === undefined
                            ? [...gameData.seeds]
                            : [...gameData.seeds, action.newSeed],
                };
            case "nextScene":
                return {
                    ...gameData,
                    scenesScreenshot: [
                        ...gameData.scenesScreenshot,
                        action.newScreenshot,
                    ],
                    times: [...gameData.times, action.newTime!],
                    seeds: [...gameData.seeds, action.newSeed!],
                };
            case "reset":
                return {
                    ...gameData,
                    scenesScreenshot: [],
                    seeds: [],
                    times: [],
                };
            default: {
                throw Error("Invalid action: " + action.type);
            }
        }
    };

    const [gameData, dispatch] = useReducer(
        gameStatesReducer,
        null,
        createInitialGameStates
    );

    return (
        <div className="game-container">
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <GameContext.Provider value={gameData}>
                    <GameDispatchContext.Provider value={dispatch}>
                        {gameData.currentScreen === "start" ? (
                            <StartScreen />
                        ) : gameData.currentScreen === "rounds" ? (
                            <RoundsScreen />
                        ) : (
                            <EndScreen />
                        )}
                    </GameDispatchContext.Provider>
                </GameContext.Provider>
            </div>
        </div>
    );
}

function createInitialGameStates(): GameData {
    return {
        scenesScreenshot: [],
        currentScreen: "start",
        seeds: [],
        times: [],
        numRounds: -1,
    };
}
