export class ImageProcessor
{
  public canvas: HTMLCanvasElement
  public ctx: CanvasRenderingContext2D
  public width: number
  public height: number

  constructor(width: number, height: number)
  {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!

    this.height = height
    this.width = width

    this.canvas.style.display = 'none'
    this.canvas.height = height
    this.canvas.width = width
  }

  loadImage(src: string): Promise<ImageData>
  {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.ctx.drawImage(img, 0, 0, this.width, this.height)
        resolve(this.ctx.getImageData(0, 0, this.width, this.height))
      }

      img.onerror = reject
      img.src = src
    })
  }
}
