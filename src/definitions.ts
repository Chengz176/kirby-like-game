import {
    AnchorComp,
    AreaComp,
    BodyComp,
    DoubleJumpComp,
    GameObj,
    HealthComp,
    OpacityComp,
    PosComp,
    ScaleComp,
    SpriteComp,
    TimerComp,
    ZComp,
} from "kaboom";

// Game
export type Coord2D = {
    x: number;
    y: number;
};

export type SpawnPoints = {
    [key: string]: Coord2D[];
};

// Entities
export type Entity = GameObj<
    SpriteComp &
        AreaComp &
        BodyComp &
        PosComp &
        ScaleComp &
        HealthComp &
        OpacityComp &
        TimerComp
>;

export type Player = Entity &
    GameObj<
        DoubleJumpComp &
            HealthComp &
            AnchorComp &
            OpacityComp & {
                speed: number;
                direction: number;
                isInhaling: boolean;
                enemyInhaled: number;
                canInhale: boolean;
            } & TimerComp
    >;

export type Map = GameObj<ScaleComp | PosComp | ZComp | {
    width: number;
    height: number;
}>;

export type GameData = {
    scenesScreenshot: string[];
    numRounds: number;
    times: number[];
    currentScreen: "start" | "rounds" | "end";
    seeds: number[];
};

export type GameDataAction = {
    type: "changedScreen" | "nextScene" | "reset";
    newScreenshot: string;
    nextScreen?: "start" | "rounds" | "end";
    newSeed?: number;
    newTime?: number;
    newRounds?: number;
};

// Map generation
export type RectCollider = {
    x: number;
    y: number;
    width: number;
    height: number;
};

// Simple Tiled Model
export type Tile = {
    edges: number[];
    frame: number;
    rotation: number;
};

export type EdgesCount = {
    [key: number]: number;
};
