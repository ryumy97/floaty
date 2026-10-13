export interface Video {
  id: string;
  title: string;
  channel: string;
  /** Length in seconds. */
  duration: number;
  views: string;
  /** Hue of the generated artwork. */
  hue: number;
  description: string;
}

export const VIDEOS: Video[] = [
  {
    id: 'aurora',
    title: 'Chasing the aurora across Iceland',
    channel: 'North Light',
    duration: 754,
    views: '1.2M views',
    hue: 160,
    description: 'Three nights on the road following the forecast, from Vik to Akureyri.',
  },
  {
    id: 'sourdough',
    title: 'Sourdough from scratch, the lazy way',
    channel: 'Slow Kitchen',
    duration: 1302,
    views: '845K views',
    hue: 30,
    description: 'A starter that forgives you, and a loaf that only needs ten minutes of work.',
  },
  {
    id: 'synth',
    title: 'Building a synthesizer on a breadboard',
    channel: 'Analog Hours',
    duration: 2215,
    views: '310K views',
    hue: 280,
    description: 'Oscillator, filter and envelope, one chip at a time.',
  },
  {
    id: 'tides',
    title: 'Why the tides are not where you think',
    channel: 'Plain Physics',
    duration: 618,
    views: '2.4M views',
    hue: 205,
    description: 'Two bulges, one Moon, and the continents that get in the way.',
  },
  {
    id: 'bonsai',
    title: 'Ten years of one juniper bonsai',
    channel: 'Small Forest',
    duration: 940,
    views: '512K views',
    hue: 110,
    description: 'A time-lapse of every repot, wire and cut since 2016.',
  },
  {
    id: 'citybikes',
    title: 'The city that rebuilt itself for bikes',
    channel: 'Street Level',
    duration: 1488,
    views: '978K views',
    hue: 350,
    description: 'How Utrecht went from car parks to the largest bike garage in the world.',
  },
];

export function getVideo(id: string): Video | undefined {
  return VIDEOS.find((video) => video.id === id);
}

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
