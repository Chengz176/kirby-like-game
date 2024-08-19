import React, { createContext } from "react";
import { GameData, GameDataAction } from "./definitions";

export const GameContext = createContext<GameData | null>(null);
export const GameDispatchContext =
    createContext<React.Dispatch<GameDataAction> | null>(null);
