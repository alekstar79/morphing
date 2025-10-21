import { ImageDistribution } from '@/image-distribution'
import { MorphPoint } from '@/point'

export class PoissonDiskSampler
{
  public width: number
  public height: number
  public cellSize: number
  public gridWidth: number
  public gridHeight: number
  public grid: (MorphPoint | null)[][]

  constructor(width: number, height: number, radius: number)
  {
    this.width = width
    this.height = height
    this.cellSize = radius / Math.sqrt(2)
    this.gridWidth = Math.ceil(width / this.cellSize)
    this.gridHeight = Math.ceil(height / this.cellSize)
    this.grid = this.buildGrid()
  }

  private buildGrid(): (MorphPoint | null)[][]
  {
    const grid: (MorphPoint | null)[][] = []
    for (let i = 0; i < this.gridWidth; i++) {
      grid[i] = new Array(this.gridHeight).fill(null)
    }

    return grid
  }

  private setGridPoint(gridX: number, gridY: number, value: MorphPoint | null): void
  {
    if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
      this.grid[gridX][gridY] = value
    }
  }

  private getNeighborhood(gridX: number, gridY: number, offset: number = 2): MorphPoint[]
  {
    const minX = Math.max(0, gridX - offset)
    const maxX = Math.min(this.gridWidth - 1, gridX + offset)
    const minY = Math.max(0, gridY - offset)
    const maxY = Math.min(this.gridHeight - 1, gridY + offset)

    const neighbors: MorphPoint[] = []
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (this.grid[x][y]) {
          neighbors.push(this.grid[x][y]!)
        }
      }
    }

    return neighbors
  }

  private isInNeighborhood(point: MorphPoint, minDistance: number): boolean
  {
    const gridPoint = point.toGrid(this.cellSize)
    const neighbors = this.getNeighborhood(gridPoint.x, gridPoint.y)

    return neighbors.some(neighbor =>
      point.distanceTo(neighbor) < minDistance
    )
  }

  distribute(maxPoints: number, radius: number, imageData: ImageData): ImageDistribution
  {
    const processList = []
    const result = []

    let maxRadius = 0
    let minRadius = Infinity

    const firstPoint = new MorphPoint(this.width * 0.5, this.height * 0.5)

    processList.push(firstPoint)

    const firstGridPoint = firstPoint.toGrid(this.cellSize)

    this.setGridPoint(firstGridPoint.x, firstGridPoint.y, firstPoint)

    while (result.length < maxPoints && processList.length > 0) {
      const randomIndex = Math.floor(Math.random() * processList.length)
      const point: MorphPoint = processList[randomIndex]

      let added = false
      for (let attempt = 0; attempt < 20; attempt++) {
        const newPoint: MorphPoint = point.generateRandomAround(radius)

        if (!newPoint.isInRectangle(this.width, this.height)) continue
        if (this.isInNeighborhood(newPoint, radius)) continue

        const pixelX = Math.floor(newPoint.x)
        const pixelY = Math.floor(newPoint.y)

        if (pixelX >= this.width || pixelY >= this.height) continue

        const pixelOffset = (pixelY * this.width + pixelX) * 4
        const r = imageData.data[pixelOffset]
        const g = imageData.data[pixelOffset + 1]
        const b = imageData.data[pixelOffset + 2]

        if (r === 0xff && g === 0xff && b === 0xff) continue

        newPoint.color = (r << 16) | (g << 8) | b
        newPoint.red = r
        newPoint.green = g
        newPoint.blue = b
        newPoint.id = maxPoints - result.length

        const intensity = 1 - (r + g + b) / (3 * 255)

        newPoint.radius = ((newPoint.id * 2 / maxPoints + intensity) / 4) * radius * 1.2

        result.push(newPoint)
        processList.push(newPoint)

        const newGridPoint = newPoint.toGrid(this.cellSize)

        this.setGridPoint(newGridPoint.x, newGridPoint.y, newPoint)

        maxRadius = Math.max(maxRadius, newPoint.radius)
        minRadius = Math.min(minRadius, newPoint.radius)

        added = true
        break
      }

      if (!added) {
        processList.splice(randomIndex, 1)
      }
    }

    return new ImageDistribution(imageData, result, maxRadius, minRadius)
  }
}
