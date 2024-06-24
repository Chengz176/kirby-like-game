import { AreaComp, BodyComp, DoubleJumpComp, GameObj, HealthComp, OpacityComp, PosComp, ScaleComp, SpriteComp, TimerComp } from "kaboom";

export type Coord2D = {
    x: number;
    y: number;
}

export type SpawnPoints = {
    [key: string]: Coord2D[];
}

export type Player = GameObj<
    SpriteComp &
    AreaComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp &
    HealthComp &
    OpacityComp & 
    {
        speed: number;
        direction: number;
        isInhaling: boolean;
        isFull: boolean
    } &
    TimerComp
>;

