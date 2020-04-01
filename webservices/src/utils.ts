
export function groupBy<T>(array: T[], keySelector: (x: T) => string|number): {[key: string]: T[]} {
    const result: {[key: string]: T[]} = {};
    for (var i=0; i<array.length; i++) {
        const key = keySelector(array[i]);
        if (result[key]) result[key].push(array[i]); else result[key] = [array[i]];
    }
    return result;
}
