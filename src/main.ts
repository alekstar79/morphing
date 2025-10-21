import { useMorph } from '@/morph'
import './styles/main.css'

import dog1 from './images/dog1.jpg'
import dog2 from './images/dog2.jpg'
import dog3 from './images/dog3.jpg'
import dog4 from './images/dog4.jpg'
import dog5 from './images/dog5.jpg'

useMorph(
  document.querySelector('.morph-wrapper') as HTMLElement,
  [dog1, dog2, dog3, dog4, dog5],
  {
    pointCount: 21000,
    pointRadius: 3,
    autoPlay: true,
    loop: true,

    backgroundColor: 'transparent',

    canvasStyle: {
      maxWidth: '640px',
      maxHeight: '500px'
    }
  }
)
