export let x = null;

export function idWithSideEffectLOL(y) {
    x = y;
    return y;
}
