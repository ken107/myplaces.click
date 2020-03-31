import minimist from 'minimist';

const args: {
    knexFile: string,
    env: string,
    _: string[],
} = minimist(process.argv.slice(2)) as any;

export default args;
