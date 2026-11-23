'use client';

import Image from 'next/image';
import { InkBloom } from '@/components/mystic';
import { UI } from '@/content/ui';
import { useState, type ReactNode } from 'react';
import { MouthContext, SeenContext, usePanelSeen } from './panel-context';
import { useSeen } from './use-seen';
import './webtoon.css';

export { usePanelSeen };

export const PANEL_FALLBACK_IMAGE = '/media/webtoon/yul-full.jpg';

export type PanelAspect = 'portrait' | 'square' | 'wide' | 'strip' | 'tall';

export interface PanelProps {

  image?: string;

  alt?: string;

  aspect?: PanelAspect;

  tall?: boolean;

  children?: ReactNode;

  scene?: ReactNode;

  top?: ReactNode;

  align?: 'full' | 'left' | 'right' | 'narrow';

  hang?: boolean;

  objectPosition?: string;

  zoom?: { scale: number; origin: string };

  mouth?: number;

  eager?: boolean;

  overlap?: number;

  layer?: ReactNode;

  bloom?: boolean;

  dim?: boolean;

  glyph?: string;

  glyphSide?: 'left' | 'right';

  vision?: boolean;
  className?: string;

  label?: string;
}

export function Panel({
  image,
  alt = '',
  aspect,
  tall = false,
  children,
  scene,
  top,
  align = 'full',
  hang,
  objectPosition = '50% 30%',
  zoom,
  mouth,
  eager = false,
  overlap,
  layer,
  bloom = false,
  dim = false,
  glyph,
  glyphSide,
  vision = false,
  className = '',
  label,
}: PanelProps) {
  const [ref, seen] = useSeen<HTMLDivElement>({ threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  const hanging = hang ?? Boolean(image);
  const plain = !image && !scene;
  const shape: PanelAspect = aspect ?? (tall ? 'tall' : 'portrait');

  return (
    <SeenContext.Provider value={seen}>
      <MouthContext.Provider value={mouth ?? null}>
        <div
          ref={ref}
          role={label ? 'group' : undefined}
          aria-label={label}
          className={`wt-panel ${className}`}
          data-seen={seen}
          data-align={align === 'full' ? undefined : align}
          data-art={image ? '' : undefined}
          data-aspect={image && shape !== 'portrait' ? shape : undefined}
          data-bloom={image && bloom ? '' : undefined}
          data-dim={image && dim ? '' : undefined}
          data-vision={image && vision ? '' : undefined}
          data-glyph-side={glyphSide === 'left' ? 'left' : undefined}
          data-scene={scene ? '' : undefined}
          data-plain={plain ? '' : undefined}
        >
          <div className="wt-panel__frame">
            {image ? (
              bloom ? (
                <InkBloom active={seen} className="wt-panel__bloom">
                  <PanelArt key={image} src={image} alt={alt} objectPosition={objectPosition} zoom={zoom} eager={eager} />
                </InkBloom>
              ) : (
                <PanelArt key={image} src={image} alt={alt} objectPosition={objectPosition} zoom={zoom} eager={eager} />
              )
            ) : null}
            {plain ? <Atmosphere glyph={glyph} /> : null}
            {layer ? <div className="wt-dust-layer">{layer}</div> : null}
            {scene ? <div className="wt-panel__scene">{scene}</div> : null}
            {top ? <div className="wt-panel__top">{top}</div> : null}
            {plain && children ? <div className="wt-panel__plain">{children}</div> : null}
          </div>
          {}
          {plain ? (
            <span className="wt-sign" aria-hidden="true">
              {UI.common.yulHanja}
            </span>
          ) : null}
          {hanging && children ? (
            <div className="wt-panel__lines" style={overlap !== undefined ? { marginTop: -overlap } : undefined}>
              {children}
            </div>
          ) : null}
        </div>
      </MouthContext.Provider>
    </SeenContext.Provider>
  );
}

function Atmosphere({ glyph }: { glyph?: string }) {
  return (
    <div className="wt-atmos" aria-hidden="true">
      {glyph ? <span className="wt-atmos__glyph">{glyph}</span> : null}
      <i className="wt-atmos__orb" data-n="1" />
      <i className="wt-atmos__orb" data-n="2" />
      <i className="wt-atmos__orb" data-n="3" />
      <i className="wt-atmos__lantern" data-n="1" />
      <i className="wt-atmos__lantern" data-n="2" />
      <i className="wt-atmos__lantern" data-n="3" />
    </div>
  );
}

function PanelArt({
  src,
  alt,
  objectPosition,
  zoom,
  eager,
}: {
  src: string;
  alt: string;
  objectPosition: string;
  zoom?: { scale: number; origin: string };
  eager: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="wt-panel__art"
      style={zoom ? { transform: `scale(${zoom.scale})`, transformOrigin: zoom.origin } : undefined}
    >
      <Image
        src={failed ? PANEL_FALLBACK_IMAGE : src}
        alt={alt}
        fill
        sizes="(min-width: 520px) 480px, 100vw"
        loading={eager ? 'eager' : undefined}
        fetchPriority={eager ? 'high' : undefined}
        style={{ objectPosition }}
        onError={() => setFailed(true)}
      />
      <div className="wt-panel__veil" aria-hidden="true" />
    </div>
  );
}
