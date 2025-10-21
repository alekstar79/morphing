export class CircleTextureGenerator
{
  public canvas: HTMLCanvasElement
  public ctx: CanvasRenderingContext2D
  public textureData: Uint8ClampedArray | null

  constructor()
  {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.textureData = null
  }

  generate(maxRadius: number, increment: number = 0.005): Uint8ClampedArray
  {
    const sections = Math.ceil(maxRadius / increment)
    const textureWidth = sections * Math.ceil(maxRadius * 2)
    const textureHeight = Math.ceil(maxRadius * 2)

    this.canvas.width = textureWidth
    this.canvas.height = textureHeight

    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, textureWidth, textureHeight)

    this.ctx.fillStyle = '#000000'
    let radius = increment
    let offset = 0

    while (radius <= maxRadius) {
      this.ctx.beginPath()
      this.ctx.arc(offset + radius, radius, radius, 0, Math.PI * 2)
      this.ctx.fill()
      offset += Math.ceil(maxRadius * 2)
      radius += increment
    }

    this.textureData = this.ctx.getImageData(0, 0, textureWidth, textureHeight).data

    return this.textureData
  }

  getPixel(x: number, y: number): number
  {
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) {
      return 255
    }

    const offset = (Math.floor(y) * this.canvas.width + Math.floor(x)) * 4

    return this.textureData ? this.textureData[offset] : 255
  }
}
