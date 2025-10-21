interface GridPoint {
  x: number;
  y: number;
}

export class MorphPoint
{
  public x: number
  public y: number
  public color: number
  public radius: number
  public id: number
  public red: number
  public green: number
  public blue: number

  constructor(
    x: number = 0,
    y: number = 0,
    color: number = 0,
    radius: number = 0,
    id: number = 0
  ) {
    this.x = x
    this.y = y
    this.color = color
    this.radius = radius
    this.id = id

    this.red = color >> 16
    this.green = (color >> 8) & 0xff
    this.blue = color & 0xff
  }

  clone(): MorphPoint
  {
    return new MorphPoint(this.x, this.y, this.color, this.radius, this.id)
  }

  distanceTo(otherPoint: MorphPoint): number
  {
    const dx = this.x - otherPoint.x
    const dy = this.y - otherPoint.y

    return Math.sqrt(dx * dx + dy * dy)
  }

  toGrid(cellSize: number): GridPoint
  {
    return {
      x: Math.floor(this.x / cellSize),
      y: Math.floor(this.y / cellSize)
    }
  }

  generateRandomAround(minDistance: number): MorphPoint
  {
    const radius = minDistance * (Math.random() + 1)
    const angle = 2 * Math.PI * Math.random()

    return new MorphPoint(
      this.x + radius * Math.cos(angle),
      this.y + radius * Math.sin(angle)
    )
  }

  isInRectangle(width: number, height: number): boolean
  {
    return this.x >= 0 && this.x <= width && this.y >= 0 && this.y <= height
  }

  interpolateTo(targetPoint: MorphPoint, ratio: number): MorphPoint
  {
    const red = this.red + (targetPoint.red - this.red) / ratio
    const green = this.green + (targetPoint.green - this.green) / ratio
    const blue = this.blue + (targetPoint.blue - this.blue) / ratio
    const x = this.x + (targetPoint.x - this.x) / ratio
    const y = this.y + (targetPoint.y - this.y) / ratio
    const radius = this.radius + (targetPoint.radius - this.radius) / ratio

    return new MorphPoint(x, y, (red << 16) | (green << 8) | blue, radius, this.id)
  }

  isSimilarTo(otherPoint: MorphPoint, threshold: number = 0.005): boolean
  {
    return (
      Math.abs(this.x - otherPoint.x) <= threshold &&
      Math.abs(this.y - otherPoint.y) <= threshold &&
      Math.abs(this.red - otherPoint.red) <= threshold &&
      Math.abs(this.green - otherPoint.green) <= threshold &&
      Math.abs(this.blue - otherPoint.blue) <= threshold &&
      Math.abs(this.radius - otherPoint.radius) <= threshold
    )
  }
}
