export interface Example {
  id: string;
  title: string;
  text: string;
}

export const EXAMPLES: Example[] = [
  {
    id: 'mini-player',
    title: 'Video mini player',
    text: 'Leave the watch page and the player docks in the corner — playback time keeps running.',
  },
  {
    id: 'support-chat',
    title: 'Support chat widget',
    text: 'A docked chip expands into a panel without losing the draft or message history.',
  },
  {
    id: 'order',
    title: 'Travelling order summary',
    text: 'The same summary moves from a header pill through checkout to a receipt.',
  },
];

export function getExample(id: string) {
  return EXAMPLES.find((example) => example.id === id);
}
