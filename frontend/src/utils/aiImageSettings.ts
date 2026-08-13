export const customImageSizeValue = 'custom'
export const minimumCustomImageDimension = 256
export const maximumCustomImageDimension = 4096

export function resolveImageRequestSize(selectedSize: string, width: number, height: number): string {
  if (selectedSize !== customImageSizeValue) return selectedSize
  if (!isValidCustomImageDimension(width) || !isValidCustomImageDimension(height)) return ''
  return `${width}x${height}`
}

export function isValidCustomImageDimension(value: number): boolean {
  return Number.isInteger(value)
    && value >= minimumCustomImageDimension
    && value <= maximumCustomImageDimension
}
