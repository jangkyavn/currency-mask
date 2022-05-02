export function splice(idx: any, source: any, value: any) {
    return `${source.slice(0, idx)}${value}${source.slice(idx)}`;
};
