import { TND_CONSTANTS } from "./constants";
import { k } from "./kaboomCtx";

export const initRandNumGen = (initSeed?: number) => {
    let seed =
        initSeed !== undefined
            ? initSeed
            : Date.now() + Math.floor(Math.random() * 1e6);

    return {
        randNum() {
            k.randSeed(seed);
            const rand = k.rand();
            seed = k.randSeed();
            return rand;
        },

        seed(newSeed?: number) {
            if (newSeed !== undefined) {
                return k.randSeed(newSeed);
            }

            return seed;
        },

        rand_TND() {
            const phi = (x: number) => {
                return Math.exp((-1 * x ** 2) / 2) / Math.sqrt(2 * Math.PI);
            };

            while (true) {
                const i =
                    TND_CONSTANTS.i_a +
                    Math.floor(
                        this.randNum() *
                            (TND_CONSTANTS.i_b - TND_CONSTANTS.i_a + 1)
                    );

                if (i <= TND_CONSTANTS.i_a + 1) {
                    const u = this.randNum();
                    const x = TND_CONSTANTS.x_i[i] + TND_CONSTANTS.d_i[i] * u;
                    if (x >= TND_CONSTANTS.a) {
                        const v = this.randNum();
                        const y = TND_CONSTANTS.y_max_i[i] * v;
                        if (y <= TND_CONSTANTS.y_min_i[i] || y <= phi(x)) {
                            return x;
                        }
                    }
                } else if (i >= TND_CONSTANTS.i_b - 1) {
                    const u = this.randNum();
                    const x = TND_CONSTANTS.x_i[i] + TND_CONSTANTS.d_i[i] * u;
                    if (x <= TND_CONSTANTS.b) {
                        const v = this.randNum();
                        const y = TND_CONSTANTS.y_max_i[i] * v;
                        if (y <= TND_CONSTANTS.y_min_i[i] || y <= phi(x)) {
                            return x;
                        }
                    }
                } else {
                    const u = this.randNum();
                    const y = TND_CONSTANTS.y_max_i[i] * u;
                    if (y <= TND_CONSTANTS.y_min_i[i]) {
                        return (
                            TND_CONSTANTS.x_i[i] + u * TND_CONSTANTS.delta_i[i]
                        );
                    }

                    const v = this.randNum();
                    const x = TND_CONSTANTS.x_i[i] + TND_CONSTANTS.d_i[i] * v;
                    if (y <= phi(x)) {
                        return x;
                    }
                }
            }
        },
    };
};
