import { deepMerge } from '@/utils/deep-merge'
import { morphControls } from '@/morph-controls'

import { PoissonDiskSampler } from './poisson-disk-sampler.ts'
import { CircleTextureGenerator } from './circle-texture-generator.ts'
import { ImageProcessor } from './image-processor.ts'
import { MorphRenderer } from './morph-renderer.ts'

import { ImageDistribution } from './image-distribution.ts'
import { MorphPoint } from './point.ts'

interface MorphEngineSettings {
  imgWidth: number;
  imgHeight: number;
  className: string;
  pointCount: number;
  pointRadius: number;
  morphSpeed: number;
  autoPlay: boolean;
  loop: boolean;
  showProgress: boolean;
  transitionDuration: number;
  backgroundColor: string;
  canvasStyle: Record<string, string>;
}

interface MergeContext {
  path?: string;
  parent?: Record<string, any>;
  [key: string]: any;
}

export class MorphEngine
{
  static DEFAULT_SETTINGS: MorphEngineSettings = {
    imgWidth: 640,
    imgHeight: 500,
    className: 'morph-canvas',
    pointCount: 8000,
    pointRadius: 4,
    morphSpeed: 0.95,
    autoPlay: false,
    loop: false,
    showProgress: true,
    transitionDuration: 2000,
    backgroundColor: '#ffffff',
    canvasStyle: {}
  }

  public settings: MorphEngineSettings
  public container: HTMLElement
  public currentDistributionIndex: number
  public distributions: ImageDistribution[]
  public fromPoints: MorphPoint[]
  public toPoints: MorphPoint[]
  public isMorphing: boolean
  public currentRatio: number
  public animationId: number | null

  public canvas!: HTMLCanvasElement
  public controls!: HTMLElement
  public renderer!: MorphRenderer
  public imageProcessor!: ImageProcessor
  public circleTexture!: CircleTextureGenerator

  constructor(container: HTMLElement, settings: Partial<MorphEngineSettings> = {})
  {
    this.settings = deepMerge(
      MorphEngine.DEFAULT_SETTINGS,
      settings,
      this.mergeCustomizer.bind(this)
    ) as MorphEngineSettings

    this.container = container

    this.currentDistributionIndex = 0
    this.distributions = []
    this.fromPoints = []
    this.toPoints = []

    this.isMorphing = false
    this.currentRatio = 64
    this.animationId = null

    this.initializeComponents()
    this.initializeControls()
  }

  private mergeCustomizer(
    key: string,
    targetValue: any,
    sourceValue: any,
    context: MergeContext
  ): any {
    if (context.path?.includes('canvasStyle')) {
      if (typeof targetValue === 'object' && typeof sourceValue === 'object') {
        return { ...targetValue, ...sourceValue }
      }

      return sourceValue !== undefined ? sourceValue : targetValue
    }

    if (['imgWidth', 'imgHeight', 'pointCount', 'pointRadius'].includes(key)) {
      if (typeof sourceValue === 'number' && (sourceValue < 1 || sourceValue > 30000)) {
        return targetValue
      }
    }

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      return [...new Set([...targetValue, ...sourceValue])]
    }

    return undefined
  }

  private initializeComponents(): void
  {
    this.canvas = document.createElement('canvas')
    this.canvas.className = this.settings.className
    this.container.appendChild(this.canvas)

    Object.assign(this.canvas.style, this.settings.canvasStyle)

    // If the background is transparent, add the appropriate style
    if (this.settings.backgroundColor === 'transparent') {
      this.canvas.style.background = 'transparent'
    }

    this.renderer = new MorphRenderer(
      this.canvas,
      this.settings.imgWidth,
      this.settings.imgHeight,
      this.settings.backgroundColor
    )

    this.imageProcessor = new ImageProcessor(
      this.settings.imgWidth,
      this.settings.imgHeight
    )

    this.circleTexture = new CircleTextureGenerator()

    this.canvas.addEventListener('click', () => this.next())
  }

  private initializeControls(): void
  {
    // Create control panel
    this.controls = document.createElement('div')

    this.controls.classList.add('morph-controls')
    this.controls.innerHTML = morphControls()

    this.container.appendChild(this.controls)

    // Add event listeners
    this.controls.querySelector('#prev-btn')!.addEventListener('click', () => this.prev())
    this.controls.querySelector('#next-btn')!.addEventListener('click', () => this.next())
    this.controls.querySelector('#play-btn')!.addEventListener('click', () => this.play())
  }

  private updateControls(): void
  {
    const counter = this.controls.querySelector('#image-counter')!
    counter.textContent = `${this.currentDistributionIndex + 1}/${this.distributions.length}`

    const playBtn = this.controls.querySelector('#play-btn')!
    playBtn.textContent = this.settings.autoPlay ? 'Stop' : 'Play' // ■ Stop ▶ Play
  }

  async loadImages(imageUrls: string[]): Promise<boolean>
  {
    if (!imageUrls || imageUrls.length < 2) {
      throw new Error('At least 2 images are required')
    }

    try {
      // Load all images
      const imageDataArray = await Promise.all(
        imageUrls.map(url => this.imageProcessor.loadImage(url))
      )

      // Create distributions for each image
      this.distributions = await Promise.all(
        imageDataArray.map((imageData) => {
          const sampler = new PoissonDiskSampler(
            this.settings.imgWidth,
            this.settings.imgHeight,
            this.settings.pointRadius
          )

          return sampler.distribute(
            this.settings.pointCount,
            this.settings.pointRadius,
            imageData
          )
        })
      )

      // Generate circle texture using max radius from all distributions
      const maxRadius = Math.max(...this.distributions.map(d => d.maxRadius))

      this.circleTexture.generate(maxRadius)

      // Set initial state
      this.fromPoints = this.distributions[0].points.map(p => p.clone())
      this.toPoints = this.distributions[1].points.map(p => p.clone())

      this.renderer.drawPoints(this.fromPoints)
      this.updateControls()

      if (this.settings.autoPlay) {
        setTimeout(() => this.next(), 1000)
      }

      return true
    } catch (error) {
      console.error('Error loading images:', error)
      throw error
    }
  }

  async addImage(imageUrl: string): Promise<ImageDistribution>
  {
    try {
      const imageData = await this.imageProcessor.loadImage(imageUrl)

      const sampler = new PoissonDiskSampler(
        this.settings.imgWidth,
        this.settings.imgHeight,
        this.settings.pointRadius
      )

      const distribution = sampler.distribute(
        this.settings.pointCount,
        this.settings.pointRadius,
        imageData
      )

      this.distributions.push(distribution)
      this.updateControls()

      return distribution
    } catch (error) {
      console.error('Error adding image:', error)
      throw error
    }
  }

  getCurrentImageIndex(): number
  {
    return this.currentDistributionIndex
  }

  getImageCount(): number
  {
    return this.distributions.length
  }

  gotoImage(index: number): boolean
  {
    if (index < 0 || index >= this.distributions.length || this.isMorphing) {
      return false
    }

    this.currentDistributionIndex = index

    const nextIndex = (index + 1) % this.distributions.length

    this.fromPoints = this.distributions[index].points.map(p => p.clone())
    this.toPoints = this.distributions[nextIndex].points.map(p => p.clone())

    this.renderer.drawPoints(this.fromPoints)
    this.updateControls()

    return true
  }

  next(): void
  {
    if (this.isMorphing || this.distributions.length < 2) return

    this.isMorphing = true
    this.currentRatio = 64

    const nextIndex = (this.currentDistributionIndex + 1) % this.distributions.length

    this.toPoints = this.distributions[nextIndex].points.map(p => p.clone())

    this.morph(() => {
      this.currentDistributionIndex = nextIndex
      this.isMorphing = false

      this.updateControls()

      if (this.settings.autoPlay && (this.settings.loop || nextIndex !== 0)) {
        setTimeout(() => this.next(), this.settings.transitionDuration)
      }
    })
  }

  prev(): void
  {
    if (this.isMorphing || this.distributions.length < 2) return

    this.isMorphing = true
    this.currentRatio = 64

    const prevIndex = (this.currentDistributionIndex - 1 + this.distributions.length) % this.distributions.length

    this.toPoints = this.distributions[prevIndex].points.map(p => p.clone())

    this.morph(() => {
      this.currentDistributionIndex = prevIndex
      this.isMorphing = false

      this.updateControls()
    })
  }

  private morph(onComplete: (() => void) | null = null): void
  {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    const startTime = Date.now()
    const duration = this.settings.transitionDuration

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      this.currentRatio = 64 * Math.pow(0.95, elapsed / 16)

      this.renderer.renderMorphFrame(
        this.fromPoints,
        this.toPoints,
        this.currentRatio,
        this.circleTexture,
        this.settings.showProgress ? progress : 0
      )

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        if (onComplete) onComplete()
      }
    }

    this.animationId = requestAnimationFrame(animate)
  }

  play(): void
  {
    this.settings.autoPlay = !this.settings.autoPlay
    this.updateControls()

    if (this.settings.autoPlay && !this.isMorphing) {
      this.next()
    }
  }

  destroy(): void
  {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    this.canvas.removeEventListener('click', this.next as any)

    if (this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas)
    }

    if (this.container.contains(this.controls)) {
      this.container.removeChild(this.controls)
    }
  }
}
