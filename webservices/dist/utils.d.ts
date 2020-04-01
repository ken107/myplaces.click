export declare function groupBy<T>(array: T[], keySelector: (x: T) => string | number): {
    [key: string]: T[];
};
