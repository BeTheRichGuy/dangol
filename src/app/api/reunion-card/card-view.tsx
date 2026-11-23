import type { MonthKind } from '@/lib/reunion/cards';
import type { SaveCardBody, SaveCardModel } from './model';

export const SAVE_CARD_SIZE = { width: 1080, height: 1620 } as const;

const COLOR = {
  night: '#0f1530',
  ivory: '#FFF6E6',
  soft: 'rgba(255, 246, 230, 0.78)',
  gold: '#F6C98B',
  line: 'rgba(255, 246, 230, 0.26)',
  panel: 'rgba(15, 21, 48, 0.62)',
} as const;

const KIND_COLOR: Record<MonthKind, string> = { both: '#E0B24A', one: '#6FC1BC', care: '#E08A83', even: '#A9AEBB' };

export interface SaveCardFonts {
  serif: string;
  sans: string;

  sansWeight: 400 | 500;

  keepAll: boolean;
}

function Body({ body, f }: { body: SaveCardBody; f: SaveCardFonts }) {
  const text = { fontFamily: f.sans, fontWeight: f.sansWeight, color: COLOR.ivory, wordBreak: f.keepAll ? ('keep-all' as const) : ('normal' as const) };
  if (body.kind === 'window') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {body.rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 0 14px 26px', borderLeft: `10px solid ${KIND_COLOR[r.kind]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', fontFamily: f.serif, fontWeight: 500, fontSize: 50, color: COLOR.ivory }}>{r.when}</div>
              <div style={{ display: 'flex', padding: '2px 18px', border: `2px solid ${KIND_COLOR[r.kind]}`, borderRadius: 999, fontFamily: f.sans, fontWeight: 600, fontSize: 26, color: KIND_COLOR[r.kind] }}>{r.label}</div>
            </div>
            <div style={{ ...text, display: 'flex', fontSize: 32, lineHeight: 1.45 }}>{r.action}</div>
          </div>
        ))}
      </div>
    );
  }
  if (body.kind === 'kit') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {body.tones.map((t, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 26px', border: `2px solid ${COLOR.line}`, background: COLOR.panel }}>
            <div style={{ display: 'flex', fontFamily: f.sans, fontWeight: 600, fontSize: 26, color: COLOR.gold }}>{t.name}</div>
            <div style={{ ...text, display: 'flex', fontFamily: f.serif, fontWeight: 500, fontSize: 40, lineHeight: 1.4 }}>{t.line}</div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div style={{ display: 'flex', fontFamily: f.sans, fontWeight: 600, fontSize: 30, color: COLOR.gold }}>{body.dontTitle}</div>
          {body.dont.map((d, i) => (
            <div key={i} style={{ ...text, display: 'flex', fontSize: 28, lineHeight: 1.4, color: COLOR.soft }}>
              {d}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (body.kind === 'waiting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', fontFamily: f.serif, fontWeight: 500, fontSize: 48, color: COLOR.gold }}>{body.title}</div>
        {body.rules.map((r, i) => (
          <div key={i} style={{ ...text, display: 'flex', fontSize: 34, lineHeight: 1.5, paddingLeft: 24, borderLeft: `6px solid ${COLOR.line}` }}>
            {r}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 54 }}>
      <div style={{ ...text, display: 'flex', fontFamily: f.serif, fontWeight: 500, fontSize: 64, lineHeight: 1.45 }}>{body.line}</div>
      {body.dates.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', fontFamily: f.sans, fontWeight: 600, fontSize: 28, color: COLOR.gold }}>{body.datesLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {body.dates.map((d, i) => (
              <div key={i} style={{ display: 'flex', padding: '8px 26px', border: `2px solid ${COLOR.gold}`, borderRadius: 999, fontFamily: f.serif, fontWeight: 500, fontSize: 36, color: COLOR.ivory }}>
                {d}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SaveCardView({ model, art, fonts }: { model: SaveCardModel; art: string | null; fonts: SaveCardFonts }) {
  const { width, height } = SAVE_CARD_SIZE;
  return (
    <div style={{ width, height, display: 'flex', position: 'relative', backgroundColor: COLOR.night }}>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} width={width} height={height} alt="" style={{ position: 'absolute', left: 0, top: 0, width, height, objectFit: 'cover' }} />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          display: 'flex',
          backgroundImage: 'linear-gradient(to bottom, rgba(15,21,48,0.34) 0%, rgba(15,21,48,0.74) 28%, rgba(15,21,48,0.9) 100%)',
        }}
      />
      <div style={{ position: 'absolute', left: 0, top: 0, width, height, display: 'flex', flexDirection: 'column', padding: '96px 78px 72px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 34, marginBottom: 34, borderBottom: `2px solid ${COLOR.line}` }}>
          <div style={{ display: 'flex', fontFamily: fonts.serif, fontWeight: 500, fontSize: 78, lineHeight: 1.15, color: COLOR.ivory }}>{model.name}</div>
          <div style={{ display: 'flex', fontFamily: fonts.sans, fontWeight: fonts.sansWeight, fontSize: 32, lineHeight: 1.4, color: COLOR.soft, wordBreak: fonts.keepAll ? 'keep-all' : 'normal' }}>{model.caption}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: model.body.kind === 'song' ? 'center' : 'flex-start' }}>
          <Body body={model.body} f={fonts} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 24 }}>
          <div style={{ display: 'flex', fontFamily: fonts.sans, fontWeight: fonts.sansWeight, fontSize: 24, color: COLOR.soft, wordBreak: fonts.keepAll ? 'keep-all' : 'normal' }}>{model.footer}</div>
          <div style={{ display: 'flex', fontFamily: fonts.sans, fontWeight: 600, fontSize: 26, letterSpacing: 10, color: COLOR.soft }}>DANGOL</div>
        </div>
      </div>
    </div>
  );
}
