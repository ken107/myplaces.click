import { raw } from 'objection';
export function matchAgainst(col: string, keywords: string) {
    const againstParts = [].concat(...(keywords || '').split(/ +/)
        .map((p: string) => [p + '*', '* ' + p + '*']));

    return raw(`MATCH (??) AGAINST("${againstParts.map(() => '+?').join(' ')}" IN BOOLEAN MODE)`,
        col, ...againstParts);
}
