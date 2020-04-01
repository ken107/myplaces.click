"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function groupBy(array, keySelector) {
    const result = {};
    for (var i = 0; i < array.length; i++) {
        const key = keySelector(array[i]);
        if (result[key])
            result[key].push(array[i]);
        else
            result[key] = [array[i]];
    }
    return result;
}
exports.groupBy = groupBy;
