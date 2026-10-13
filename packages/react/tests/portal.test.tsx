import { fireEvent, render, screen } from '@testing-library/react';
import { createContext, useContext } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Floaty, FloatyAnchor } from '../src';

const Theme = createContext('default');

function ThemeName() {
  return <button>{useContext(Theme)}</button>;
}

function App({
  onFloatyParentClick,
  onAnchorParentClick,
}: {
  onFloatyParentClick?: () => void;
  onAnchorParentClick?: () => void;
}) {
  return (
    <>
      <Theme.Provider value="floaty-tree">
        <div onClick={onFloatyParentClick}>
          <Floaty floatyId="p" transition={false}>
            <ThemeName />
          </Floaty>
        </div>
      </Theme.Provider>
      <Theme.Provider value="anchor-tree">
        <section data-testid="anchor-parent" onClick={onAnchorParentClick}>
          <FloatyAnchor floatyId="p" data-rect="0,0,100,50" />
        </section>
      </Theme.Provider>
    </>
  );
}

describe('portal side effects', () => {
  it('reads React context from where Floaty is rendered, not from the anchor', () => {
    render(<App />);
    expect(screen.getByRole('button').textContent).toBe('floaty-tree');
  });

  it("bubbles React events through Floaty's tree, not the anchor's", () => {
    const onFloatyParentClick = vi.fn();
    const onAnchorParentClick = vi.fn();
    render(
      <App onFloatyParentClick={onFloatyParentClick} onAnchorParentClick={onAnchorParentClick} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onFloatyParentClick).toHaveBeenCalledTimes(1);
    expect(onAnchorParentClick).not.toHaveBeenCalled();
  });

  it('bubbles native events to the layer and body, outside the anchor in the DOM', () => {
    render(<App />);
    const anchorParent = screen.getByTestId('anchor-parent');
    const button = screen.getByRole('button');
    const onAnchorParent = vi.fn();
    const onBody = vi.fn();
    anchorParent.addEventListener('click', onAnchorParent);
    document.body.addEventListener('click', onBody);

    button.click();
    expect(onAnchorParent).not.toHaveBeenCalled();
    expect(onBody).toHaveBeenCalledTimes(1);
    expect(anchorParent.contains(button)).toBe(false);
    expect(button.closest('[data-floaty="p"]')).not.toBeNull();
    expect(button.closest('[data-floaty-layer]')?.parentElement).toBe(document.body);
    document.body.removeEventListener('click', onBody);
  });
});
