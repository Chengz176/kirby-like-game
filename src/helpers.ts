import { k } from "./kaboomCtx";

export const initRandNumGen = (initSeed?: number) => {
    let seed =
        initSeed !== undefined
            ? initSeed
            : Date.now() + Math.floor(Math.random() * 1e6);

    return () => {
        k.randSeed(seed);
        const rand = k.rand();
        seed = k.randSeed();
        return rand;
    };
};