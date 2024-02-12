export var isDebugMode= false;
export const isBrowser = (typeof window !== 'undefined');
export function setDebugMode(value)
{
    isDebugMode = value;
}
