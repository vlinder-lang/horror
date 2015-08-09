export let x = null;
export let y = null;

export function idWithSideEffectLOL(y) {
    x = y;
    return y;
}

export function sleep(z, continuation) {
    setTimeout(function() {
        y = z;
        continuation(z);
    }, 10);
}
