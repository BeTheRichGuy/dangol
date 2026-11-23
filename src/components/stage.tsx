import type { ReactNode } from 'react';
import { Petals } from './petals';

export function Ambience() {
  return (
    <>
      <div className="dg-fixed-layer dg-bloom" aria-hidden="true" />
      <Petals />
    </>
  );
}

export function Stage({
  backdrop,
  children,
  ambience = false,
  night = false,
}: {

  backdrop: string;
  children: ReactNode;

  ambience?: boolean;

  night?: boolean;
}) {
  return (
    <div className={`dg-world ${night ? 'dg-world--night' : ''}`}>
      {}
      <div className="dg-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${backdrop})` }} />
      <div className="dg-column">
        {ambience ? <Ambience /> : null}
        {children}
      </div>
    </div>
  );
}
