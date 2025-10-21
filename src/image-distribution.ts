import { MorphPoint } from '@/point'

export class ImageDistribution
{
  public id: string
  public imageData: ImageData
  public points: MorphPoint[]
  public maxRadius: number
  public minRadius: number

  constructor(
    imageData: ImageData,
    points: MorphPoint[],
    maxRadius: number,
    minRadius: number
  ) {
    this.id = Math.random().toString(36).substring(2, 11)
    this.imageData = imageData
    this.maxRadius = maxRadius
    this.minRadius = minRadius
    this.points = points
  }

  getPointCount(): number
  {
    return this.points.length
  }

  findClosestPoint(point: MorphPoint, maxDistance: number = 50): MorphPoint | null
  {
    let closestPoint: MorphPoint | null = null
    let minDistance = Infinity

    for (const p of this.points) {
      const dist = point.distanceTo(p)

      if (dist < minDistance && dist < maxDistance) {
        minDistance = dist
        closestPoint = p
      }
    }

    return closestPoint
  }
}
