import Link from 'next/link';
import './example.css';

export const metadata = { title: 'Floaty examples (Next.js)' };

const EXAMPLES = [
  {
    href: '/tube',
    title: 'Video app with a mini player',
    text: 'The player moves between the watch page and a docked mini player on every other page, and keeps playing.',
    shows: 'priority fallback, loading.tsx anchors, morphing between forms',
  },
  {
    href: '/gallery',
    title: 'Photo gallery with a modal route',
    text: 'Photos open in a modal built with intercepting and parallel routes, and fly back into the grid when it closes.',
    shows: 'one floatyId per item, @modal + (.) routes, stacking in the overlay',
  },
  {
    href: '/homes',
    title: 'Home search with a shared map',
    text: 'One interactive map moves between the split view, a full-screen map and a listing preview, keeping its pan and zoom.',
    shows: 'self-measuring content, anchor state changing behavior',
  },
  {
    href: '/acme',
    title: 'Support chat widget',
    text: 'A chat docked on every page expands into the support page, keeping the conversation, scroll position and your draft.',
    shows: 'DOM state (scroll, input) across routes, animated anchor resize',
  },
  {
    href: '/dashboard',
    title: 'Dashboard with live widgets',
    text: 'Live widgets move between the grid, a detail page and its side rail, without losing their data streams.',
    shows: 'many floaties moving at once, three forms per widget',
  },
  {
    href: '/shop',
    title: 'Shop with a travelling order summary',
    text: 'The order summary goes from the header to the cart sidebar, through checkout, to the receipt.',
    shows: 'state across a multi-step flow, form changes per step',
  },
];

export default function Examples() {
  return (
    <div className="ex">
      <header className="ex-header">
        <span className="ex-logo">Floaty examples</span>
      </header>
      <div className="ex-page">
        <h1 className="ex-title">Examples</h1>
        <ul className="ex-hub">
          {EXAMPLES.map(({ href, title, text, shows }) => (
            <li key={href}>
              <Link href={href}>
                <strong>{title}</strong>
                <p>{text}</p>
                <span className="ex-meta">{shows}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
