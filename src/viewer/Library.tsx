import { useEffect, useMemo, useState } from 'react';
import { SlideContext } from 'slide-maker/runtime';
import { deck, runtimeCss, styles, templates } from 'virtual:slide-maker/library';
import { Copy, Deck, Download } from './Icons';
import { Preview } from './Preview';
import * as api from './api';
import type { LibraryStyle, LibraryTemplate } from './types';

/** Which of the two axes the sidebar is walking. */
type Axis = 'template' | 'style';

/** The slide metadata a template's runtime components read in a preview. */
function metaFor(template: LibraryTemplate) {
  return { index: 0, total: 1, deckTitle: template.label, id: template.name };
}

function Rendered({ template }: { template: LibraryTemplate }) {
  const Component = template.module.default;
  if (!Component) {
    return (
      <div className="sm-slide sm-error-slide">
        <div className="sm-error-title">{template.name} has no default export</div>
      </div>
    );
  }
  return (
    <SlideContext.Provider value={metaFor(template)}>
      <Component />
    </SlideContext.Provider>
  );
}

export function Library() {
  const [axis, setAxis] = useState<Axis>('template');
  const [templateName, setTemplateName] = useState(templates[0]?.name ?? '');
  const [styleName, setStyleName] = useState(deck?.style ?? styles[0]?.name ?? '');
  const [flash, setFlash] = useState<string | null>(null);

  const template =
    templates.find((t) => t.name === templateName) ?? (templates[0] as LibraryTemplate | undefined);
  const style =
    styles.find((s) => s.name === styleName) ?? (styles[0] as LibraryStyle | undefined);

  const list: Array<LibraryTemplate | LibraryStyle> = axis === 'template' ? templates : styles;
  const selected = axis === 'template' ? template?.name : style?.name;
  const choose = axis === 'template' ? setTemplateName : setStyleName;

  // One timer for whatever the latest message is, so a second action does not
  // clear the first one's notice early.
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.tagName === 'INPUT') return;
      if (!list.length) return;
      const index = list.findIndex((item) => item.name === selected);
      if (event.key === 'ArrowDown' || event.key === 'j') {
        event.preventDefault();
        choose(list[Math.min(list.length - 1, index + 1)].name);
      } else if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault();
        choose(list[Math.max(0, index - 1)].name);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        setAxis((current) => (current === 'template' ? 'style' : 'template'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [list, selected, choose]);

  const copy = async () => {
    if (!template) return;
    try {
      await navigator.clipboard.writeText(template.jsx);
      setFlash(`Copied ${template.name}`);
    } catch {
      setFlash('Could not reach the clipboard');
    }
  };

  const addToDeck = async () => {
    if (!template) return;
    try {
      const { file } = await api.insertTemplate(template.name);
      setFlash(`Added ${file}`);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not add the slide');
    }
  };

  /* The cards: one template across every style, or one style across every
     template. Both directions answer the same question from opposite ends. */
  const cards = useMemo(() => {
    if (axis === 'template') {
      if (!template) return [];
      return styles.map((s) => ({
        key: s.name,
        caption: s.label,
        sub: s.tags.join(' · '),
        css: s.css,
        template,
        jump: null as null | (() => void),
      }));
    }
    if (!style) return [];
    return templates.map((t) => ({
      key: t.name,
      caption: t.label,
      sub: t.tags.join(' · '),
      css: style.css,
      template: t,
      jump: () => {
        setTemplateName(t.name);
        setAxis('template');
      },
    }));
  }, [axis, template, style]);

  const heading = axis === 'template' ? template : style;

  return (
    <div className="sm-lib">
      <header className="sm-lib-top">
        <div className="sm-lib-top-left">
          <span className="sm-mark">
            <Deck />
          </span>
          <span className="sm-lib-wordmark">Template library</span>
          <span className="sm-crumb" aria-hidden="true">
            /
          </span>
          <span className="sm-lib-count">
            {templates.length} templates · {styles.length} styles
          </span>
        </div>
        <div className="sm-lib-top-right">
          {flash && <span className="sm-lib-flash">{flash}</span>}
          <div className="sm-lib-toggle" role="tablist" aria-label="Browse by">
            <button
              type="button"
              role="tab"
              aria-selected={axis === 'template'}
              className={`sm-lib-tab${axis === 'template' ? ' sm-lib-tab-on' : ''}`}
              onClick={() => setAxis('template')}
            >
              One template, every style
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={axis === 'style'}
              className={`sm-lib-tab${axis === 'style' ? ' sm-lib-tab-on' : ''}`}
              onClick={() => setAxis('style')}
            >
              One style, every template
            </button>
          </div>
        </div>
      </header>

      <div className="sm-lib-body">
        <nav className="sm-lib-rail" aria-label={axis === 'template' ? 'Templates' : 'Styles'}>
          {list.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`sm-lib-railitem${item.name === selected ? ' sm-lib-railitem-on' : ''}`}
              onClick={() => choose(item.name)}
              aria-current={item.name === selected}
            >
              <span className="sm-lib-railname">{item.label}</span>
              {item.origin === 'local' && <span className="sm-lib-tag">local</span>}
            </button>
          ))}
        </nav>

        <main className="sm-lib-main">
          <div className="sm-lib-head">
            <div className="sm-lib-head-text">
              <h1 className="sm-lib-title">{heading?.label}</h1>
              <p className="sm-lib-desc">{heading?.description}</p>
            </div>
            {axis === 'template' && template && (
              <div className="sm-lib-actions">
                <button type="button" className="sm-btn" onClick={copy} title="Copy the JSX">
                  <Copy />
                  Copy JSX
                </button>
                {deck && (
                  <button
                    type="button"
                    className="sm-btn sm-btn-primary"
                    onClick={addToDeck}
                    title={`Append a slide to ${deck.title}`}
                  >
                    <Download />
                    Add to deck
                  </button>
                )}
              </div>
            )}
          </div>

          {heading?.guidance && <p className="sm-lib-guidance">{heading.guidance}</p>}

          <div className="sm-lib-grid">
            {cards.map((card) => (
              <figure key={card.key} className="sm-lib-card">
                <Preview css={card.css} runtimeCss={runtimeCss} title={card.caption}>
                  <Rendered template={card.template} />
                </Preview>
                <figcaption className="sm-lib-cap">
                  {card.jump ? (
                    <button type="button" className="sm-lib-caplink" onClick={card.jump}>
                      {card.caption}
                    </button>
                  ) : (
                    <span className="sm-lib-capname">{card.caption}</span>
                  )}
                  <span className="sm-lib-capsub">{card.sub}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
