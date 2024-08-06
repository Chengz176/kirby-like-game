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
