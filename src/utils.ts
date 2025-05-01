export function calculateShadeHeight(top: number, bottom: number, totalHeight: number): number {
    return totalHeight - (top + bottom);
}

export function validatePosition(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function formatPosition(value: number): string {
    return `${value}%`;
}