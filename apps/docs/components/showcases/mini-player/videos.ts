export interface Video {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: number;
  hue: number;
  description: string;
}

export const VIDEOS: Video[] = [
  {
    id: 'aurora',
    title: 'Aurora over Iceland',
    channel: 'North Light',
    views: '1.2M views',
    duration: 180,
    hue: 160,
    description:
      'Three nights on the road following the forecast, from Vik to Akureyri. Leave this page to dock the player — it keeps playing.',
  },
  {
    id: 'sourdough',
    title: 'Sourdough from scratch',
    channel: 'Slow Kitchen',
    views: '845K views',
    duration: 240,
    hue: 30,
    description:
      'A starter that forgives you, and a loaf that only needs ten minutes of work a day.',
  },
  {
    id: 'city',
    title: 'Night walk through the city',
    channel: 'Street Frames',
    views: '412K views',
    duration: 150,
    hue: 220,
    description:
      'Rain on pavement, neon reflections, and a soundtrack that never quite matches the steps.',
  },
  {
    id: 'desk',
    title: 'Building a quiet desk setup',
    channel: 'Soft Tools',
    views: '980K views',
    duration: 320,
    hue: 200,
    description:
      'Cable management, a matte lamp, and the one monitor arm that finally stopped wobbling.',
  },
  {
    id: 'rain',
    title: 'Rain sounds for deep work',
    channel: 'Open Window',
    views: '3.1M views',
    duration: 600,
    hue: 210,
    description: 'Two hours of steady rain against a wooden sill. No music, no ads, just weather.',
  },
  {
    id: 'trail',
    title: 'Trail run at first light',
    channel: 'Ridge Line',
    views: '267K views',
    duration: 210,
    hue: 110,
    description:
      'A ridge route above the fog line, filmed on a chest mount with almost no talking.',
  },
];

export function getVideo(id: string) {
  return VIDEOS.find((video) => video.id === id);
}
