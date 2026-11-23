import { REUNION_ART, REUNION_ART_READY, REUNION_STAND, reunionArtSrc, reunionPanelName } from '@/lib/reunion/art';
import type { ChapterRoom } from './themes';

export type PaidAspect = 'portrait' | 'square' | 'wide' | 'strip';

export interface PaidPanel {

  file: string;

  stand: string;

  ready: boolean;
  aspect: PaidAspect;
  objectPosition: string;

  mouth?: number;

  scene: string;

  alt?: string;

  src?: string;
}

export type ChapterPanels = readonly [PaidPanel, PaidPanel, PaidPanel];

const SLOTS = ['a', 'b', 'c'] as const;

const REVISED: Readonly<Record<string, string>> = {
  'match-01-a': 'muk',
  'match-01-b': 'muk',
  'match-01-c': 'muk',
  'match-02-a': 'muk',
  'match-02-b': 'muk',
  'match-02-c': 'muk',
  'match-03-a': 'muk',
  'match-03-b': 'muk',
  'match-03-c': 'muk',
  'match-04-a': 'muk',
  'match-04-b': 'muk',
  'match-04-c': 'muk',
  'match-05-a': 'muk',
  'match-05-b': 'muk',
  'match-05-c': 'muk',
  'match-06-a': 'muk',
  'match-06-b': 'muk',
  'match-06-c': 'muk',
  'match-07-a': 'muk',
  'match-07-b': 'muk',
  'match-07-c': 'muk',
  'match-08-a': 'muk',
  'match-08-b': 'muk',
  'match-08-c': 'muk',
  'love-01-b': 'v2',
  'love-05-c': 'v2',
  'love-08-a': 'v2',
};

export function paidFile(room: ChapterRoom, chapter: number, slot: 'a' | 'b' | 'c'): string {
  const base = `${room}-${String(chapter).padStart(2, '0')}-${slot}`;
  return `paid/${base}${REVISED[base] ? `-${REVISED[base]}` : ''}`;
}

export function paidPanelSrc(p: PaidPanel): string {
  return p.src ?? `/media/webtoon/${p.ready ? p.file : p.stand}.jpg`;
}

type Shot = readonly [stand: string, aspect: PaidAspect, scene: string];

const POSITION: Record<PaidAspect, string> = { wide: '50% 50%', portrait: '50% 25%', square: '50% 35%', strip: '50% 35%' };

function chapters(room: ChapterRoom, list: readonly (readonly [Shot, Shot, Shot])[], ready = true, mouths: Readonly<Record<string, number>> = {}): readonly ChapterPanels[] {
  return list.map((shots, i) => {
    const panel = (s: number): PaidPanel => {
      const [stand, aspect, scene] = shots[s];
      const mouth = mouths[`${i + 1}${SLOTS[s]}`];
      return { file: paidFile(room, i + 1, SLOTS[s]), stand, ready, aspect, objectPosition: POSITION[aspect], scene, ...(mouth !== undefined ? { mouth } : {}) };
    };
    return [panel(0), panel(1), panel(2)] as const;
  });
}

function reunionChapters(): readonly ChapterPanels[] {
  return Array.from({ length: 12 }, (_, i) => {
    const panel = (slot: 'a' | 'b' | 'c'): PaidPanel => {
      const name = reunionPanelName(i + 1, slot);
      const art = REUNION_ART[name];
      return { file: `reunion-u12/${name}`, src: reunionArtSrc(name), stand: REUNION_STAND[art.aspect], ready: REUNION_ART_READY, aspect: art.aspect, objectPosition: POSITION[art.aspect], scene: art.scene, alt: art.scene };
    };
    return [panel('a'), panel('b'), panel('c')] as const;
  });
}

const MUK_MOUTH: Readonly<Record<string, number>> = {
  '1a': 0.8, '1b': 0.55, '1c': 0.52, '2b': 0.54, '2c': 0.6, '3a': 0.74, '3b': 0.43, '3c': 0.6, '4a': 0.68, '4b': 0.52, '4c': 0.62,
  '5b': 0.57, '5c': 0.5, '6b': 0.37, '6c': 0.65, '7b': 0.5, '7c': 0.57, '8a': 0.39, '8c': 0.45,
};

export const PAID_PANELS: Record<ChapterRoom, readonly ChapterPanels[]> = {
  reunion: reunionChapters(),

  life: chapters('life', [

    [
      ['yul-upper', 'wide', 'Low angle from a few steps below the red-lacquered temple gate: glowing stone lantern posts flank the top step and small Yul stands in the open doorway holding a lantern at his side.'],
      ['yul-explain', 'square', "Closer on the same red gate and steps: Yul's single hand (white sleeve, navy cuff) holds that same lantern out toward the viewer over the stone steps; no other hand."],
      ['yul-blink-face', 'portrait', "Close shot on the same steps: Yul's face lit from below by the lantern, the red gate glowing behind him, eyes narrowed with amused interest, a knowing half-smile."],
    ],

    [
      ['yul-tea-offer', 'wide', 'Moonlit courtyard: five shallow clay bowls in a loose ring on the paving, the center one holding a small sapling; tiny Yul sits far off at a bench.'],
      ['yul-oho', 'square', "Close on those same five bowls and the sapling at the center; Yul's index finger drifts over them without settling on any one."],
      ['yul-smirk-face', 'portrait', 'Over-the-shoulder shot from behind Yul, who raises a lantern beside one stone basin: light pools on that spot while the rest of the courtyard stays in shadow.'],
    ],

    [
      ['yul-inner-door', 'square', "Top-down on a round lacquer table with a lantern at its center and round white navy-edged cushions around it; only the edge of Yul's white sleeve enters the frame."],
      ['yul-read', 'wide', 'Medium shot: Yul sits across that same round table and leans his forearms between two white navy-edged cushions, calm look, lamplight on his face, green lattice windows behind.'],
      ['yul-face', 'portrait', 'Table-height low angle: the lantern and cushions sharp in the foreground while Yul, chin resting on his hand, is softly blurred behind them.'],
    ],

    [
      ['yul-serious-dim', 'wide', 'Wide view of a raked gravel garden in the blue light before dawn, one worn circular path of footprints looping back on itself, tiny Yul standing on the veranda at the edge.'],
      ['yul-backdoor-v2', 'square', "Low close-up: Yul's shoes at the edge of a worn spiral of footprints in raked gravel, about to step out of it."],
      ['yul-serious', 'portrait', 'Back view: Yul holds a lantern low to light the untouched gravel beyond the footprint circle, his long shadow stretching ahead.'],
    ],

    [
      ['yul-laugh', 'wide', "Wide shot of a moonlit lotus pond: Yul kneels at the water's edge holding a football-sized rough dark rock with faint golden cracks in both hands; hall and lanterns behind."],
      ['yul-reassure', 'square', "Close-up of two hands cupping that same rough rock, golden hairline cracks and flecks on its surface, the pond and lanterns behind; Yul's sleeves frame the shot."],
      ['yul-door-hand', 'portrait', 'Close shot beside the pond: Yul holds that same rock, its cracks glowing, laughing delighted, his face lit by its glow.'],
    ],

    [
      ['yul-hand-wait-v2', 'wide', 'Wide view of a workshop: Yul stands at the open threshold with one hand on the end of the long workbench; hanging tools and a lantern glow inside.'],
      ['yul-door-hand', 'square', "Close-up of Yul's hand (white sleeve, navy cuff) resting on that same cluttered workbench, hanging tools and a balance scale above, window light behind."],
      ['yul-talk-face', 'portrait', 'Yul at a worktable working on a small piece with both hands, eyes on his work, workshop shelves glowing behind.'],
    ],

    [
      ['yul-candy-ease', 'wide', 'Over-the-shoulder view into a dim storehouse of rice jars and hanging lanterns; a small balance scale with rice stands on the shelf at left as Yul looks over the rows.'],
      ['yul-laugh', 'square', "Close-up of that same balance scale with rice in one pan; Yul's fingers hold it by the cord to steady it, jars lining the shelves behind."],
      ['yul-over-shoulder', 'portrait', 'Yul stands among big jars with a hand on his head, ruefully amused, lantern light on the clay.'],
    ],

    [
      ['yul-laugh-sleeve', 'wide', 'Down a long wooden corridor with red lattice doors and rose-pink light ahead; Yul has stopped midway, seen from behind.'],
      ['yul-over-shoulder', 'square', "Same corridor: Yul's open hand (white sleeve, navy cuff) gestures toward the glowing doorway at the far end; petals on the pink floor."],
      ['yul-smirk-face', 'portrait', 'Still in that corridor, Yul glances back over his shoulder at the viewer with a playful grin, rose light on one cheek.'],
    ],

    [
      ['yul-tea-offer', 'wide', 'Wide view of a shrine kitchen at first light: big cauldrons on an earthen stove, and Yul sits small in white near the window.'],
      ['yul-candy-ease', 'square', "Top-down on a low meal tray with three spoons of different sizes and several bowls, one bowl set slightly apart at the tray's edge; Yul's hand is just entering the frame."],
      ['yul-read', 'portrait', 'Yul sits on the kitchen floor before an open doorway holding a warm bowl in both hands, blue dawn behind him.'],
    ],

    [
      ['yul-balcony', 'wide', "Wide night view from a pavilion railing: paper lanterns drift outside at different distances, sizes and brightness while Yul's hand rests on the rail."],
      ['yul-reassure', 'portrait', 'Yul leans back from a bright lantern hanging too close, tired but kind.'],
      ['yul-balcony-back-v2', 'square', "Close-up of Yul's hands knotting a new lantern cord onto the railing, one slow knot."],
    ],

    [
      ['yul-balcony-back-v2', 'wide', 'High wide view from the roof ridge at dusk: tiny Yul sits on the tiles, a bronze bell and a white cloth pennant hang from the eave corner beside him, city lights and hills below.'],
      ['yul-explain', 'square', 'Close-up of that same bronze bell and white cloth pennant at the eave above where Yul sits, both pulled to one side by the wind.'],
      ['yul-upper', 'portrait', 'Low-angle back silhouette: Yul at the roof edge holds a lantern high as a pale glow rises along one edge of the horizon.'],
    ],

    [
      ['yul-tea-offer', 'wide', 'The opening red gate again from the foot of the steps: tiny Yul stays at the threshold holding the lantern as the visitor leaves down the stairs.'],
      ['yul-serious', 'square', "Same red gate and steps: Yul's hand (white sleeve, navy cuff) holds the same lantern out toward the viewer walking away, handing it back."],
      ['yul-talk-full', 'portrait', "Close shot: Yul meets the viewer's eyes with a short, sincere smile in the lantern light."],
    ],
  ]),

  decades: chapters('decades', [

    [
      ['year-room-tall', 'wide', "Extreme high wide view from a hilltop pavilion at night: a winding river with eight lanterns along its banks, some dim, some bright, some dark; tiny Mansin at the hill's edge points a fan at it."],
      ['year-fan-low', 'square', "Water-level close-up from Mansin's ferry: one stretch of the night river is rough and rippling, another calm as glass, lantern reflections shimmering on both."],
      ['year-eyes', 'portrait', 'Close shot: Mansin sits on the gunwale of a small ferry with a pole in hand and gives the viewer a dry smile, lantern-lit riverbank behind him.'],
    ],

    [
      ['year-stars-empty', 'wide', 'Wide view of a misty reed bank at night: two burned-down lanterns glow low among the reeds as the ferry drifts past, Mansin standing at the bow seen from behind.'],
      ['year-lantern-ots', 'square', "Close-up of Mansin's pale hand resting on the shade of a dimming lantern, feeling how warm it still is."],
      ['year-portrait', 'portrait', "Over-the-shoulder view from the stern: Mansin's white hair in the foreground, the reed bank and its fading lanterns shrinking into mist behind the ferry."],
    ],

    [
      ['year-hello', 'wide', 'Low-angle wide shot of rapids between dark rocks: the brightest lantern of the river burns on the bank while Mansin braces the ferry with a pole, seen in profile.'],
      ['year-rice-top', 'square', "Close-up of Mansin's hand gripping a wooden pole as white water breaks around it."],
      ['year-fan-low', 'portrait', "Close shot: Mansin's face in the spray, one eye glinting, a dry look of warning."],
    ],

    [
      ['year-room-tall', 'wide', 'Wide view of ten stepping stones across a shallow ford under moonlight, each at a different height and gap; Mansin stands on the first stone, seen from behind.'],
      ['year-lantern-ots', 'square', 'Low-angle view of stepping stones of uneven height across the shallow ford with a wide gap in the middle, while Mansin strides across them far ahead, seen from behind.'],
      ['year-eyes', 'portrait', 'Mansin stands among the moonlit stepping stones pointing at one stone with one hand, a folded fan in the other, smiling.'],
    ],

    [
      ['year-portrait', 'wide', 'Wide view of a long wooden bridge in mist ending at a dark ferry gate with a single line of light under it; Mansin stands mid-bridge, seen from behind.'],
      ['year-stars-empty', 'square', "Close-up of the thin line of warm light under a closed ferry gate, Mansin's black shoe tip and long shadow reaching toward it."],
      ['year-hello', 'portrait', 'Three-quarter shot: Mansin glances back over one shoulder with the closed fan at his lips, a secretive smile, the misty bridge behind him.'],
    ],

    [
      ['year-room-tall', 'wide', "Extreme wide view of the river widening toward a night sea, tiny distant lantern points on the horizon; Mansin's ferry is a single dot on the water."],
      ['year-eyes', 'square', "Close-up: a blank paper lantern leaves Mansin's hand and floats away on the dark current, glowing."],
      ['year-fan-low', 'portrait', 'Low-angle back view: Mansin leans against the ferry rail looking up at the stars, the folded fan held at his side.'],
    ],

    [
      ['year-portrait', 'wide', 'The ferry touches the first jetty in blue dawn: Mansin stands on the boat seen from behind, one pale hand held out toward the shore.'],
      ['year-lantern-ots', 'square', "Close-up of Mansin's hand shaking river water off after setting down the pole, dawn light on the wet fingers."],
      ['year-rice-top', 'portrait', 'Back view: Mansin points the ferry pole at a thin pale-blue line of dawn above the far hills.'],
    ],
  ]),

  love: chapters('love', [

    [
      ['love-room-wide', 'wide', 'High overhead view of a low red-threaded room: crossing red threads and rose lanterns, a spinning wheel in the middle, small Yeon standing at the wheel, one thread running out the open window.'],
      ['love-hello', 'square', "Close-up of Yeon's fingers testing the thickness of a fresh red thread coming off the spinning wheel."],
      ['love-eyes-thread', 'portrait', 'Three-quarter shot: Yeon holds the end of a red thread to her lips, smiling.'],
    ],

    [
      ['love-knot-hands', 'wide', 'Wide view of a sunny dyeing yard: a big crimson vat in the foreground and a pale apricot vat behind it, Yeon seen from behind between them.'],
      ['love-pull-low', 'square', "Close-up of Yeon's hands lowering a thread into the pale vat, slowly taking on color."],
      ['love-smile-side', 'portrait', 'Yeon smiles at the viewer with a red thread wound around her raised fingers, rose lanterns glowing behind her.'],
    ],

    [
      ['love-knot-hands', 'wide', 'Sunset veranda: a tangled ball of red thread on the boards with loose ends splaying out; Yeon sits with one knee up, seen from behind.'],
      ['love-portrait', 'square', "Top-down on the center of a tangled knot where two red threads cross at the same spot, Yeon's fingertip at the edge."],
      ['love-window-ots', 'portrait', 'Yeon lifts one strand out of a tangle of red thread with a raised hand, narrowing her eyes, firm.'],
    ],

    [
      ['love-window-ots', 'wide', 'Low-angle wide shot of two tiled rooftops with a red thread stretched between them, taut in one stretch and sagging in another; tiny Yeon on the roof.'],
      ['love-pull-low', 'square', "Close-up of two brass bells, one large and one small, hanging from the red thread and swaying differently in the wind beside Yeon's hand."],
      ['love-eyes-thread', 'portrait', 'Back view: Yeon on the roof pins a clothespin onto the red thread to hold one spot.'],
    ],

    [
      ['love-room-wide', 'wide', 'Floating stone stairs through clouds at sunset with seven rose lanterns of different brightness, Yeon seen from behind at the foot of the stairs.'],
      ['love-knot-hands', 'square', "Close-up of one rose lantern on a step and a red thread tied to the stair railing beside Yeon's hand."],
      ['love-smile-side', 'portrait', 'Yeon sits on a middle step with a rose lantern glowing in her lap, looking back at the viewer.'],
    ],

    [
      ['love-room-wide', 'wide', 'One-point perspective down a long eaves corridor with twelve brass bells at even intervals swinging by different amounts; tiny Yeon walks along it.'],
      ['love-eyes-thread', 'square', "Close-up of Yeon's raised hand reaching for one of the brass bells to stop its sound."],
      ['love-hello', 'portrait', 'Back view: Yeon polishes each brass bell with her sleeve as she walks the corridor.'],
    ],

    [
      ['love-portrait', 'wide', 'A courtyard platform at night: two teacups, one steaming and one empty opposite; Yeon holds one end of a red thread that trails into the dark.'],
      ['love-window-ots', 'square', "Close-up of Yeon's fingers holding the end of a red thread, the other end vanishing into darkness beyond her reach."],
      ['love-smile-side', 'portrait', 'Close shot: Yeon offers a teacup toward the viewer with a smile.'],
    ],

    [
      ['love-hello', 'wide', 'A rose-pink doorway at the end of a corridor; Yeon stands in the corridor before it, facing the viewer.'],
      ['love-knot-hands', 'square', "Close-up of Yeon's hands tying a knot in the red thread, deliberately leaving it a little loose."],
      ['love-pull-low', 'portrait', 'Yeon opens the rose-pink door and glances back over her shoulder with a playful smile, one hand pointing off to the side.'],
    ],
  ]),

  match: chapters('match', [

    [
      ['muk-stand-wide', 'wide', 'Rainy shrine porch at night: Muk stands at one end under the eave in his black gat, jangdo at his waist; a second person is a small back-view silhouette at the far end, one lantern between them.'],
      ['muk-stand-square', 'square', "Close on Muk's hand resting on the sheathed jangdo at his waist while rain drips from the eave; only the edge of another person's sleeve enters the frame."],
      ['muk-stand-portrait', 'portrait', 'Muk looks straight at the viewer from under the black gat, rain dripping from the brim, a faint dry smirk, tear mole visible, collar loosened.'],
    ],

    [
      ['muk-stand-wide', 'wide', "Over Muk's shoulder at a porch rail in the rain: another person seen only from behind stands a step ahead while Muk's shadow leans toward them."],
      ['muk-stand-square', 'square', 'Muk tilts the brim of his black gat and stretches one arm toward the viewer to shield them from the rain, face half in shadow.'],
      ['muk-stand-portrait', 'portrait', 'Muk glances back over his shoulder at the viewer, collar loosened, rain on his lashes, an unreadable half-lidded look.'],
    ],

    [
      ['muk-stand-wide', 'wide', 'Two cushions on a lantern-lit rainy porch, one near the light and one near the dark; Muk sits on one with the gat beside him, the other cushion empty.'],
      ['muk-stand-square', 'square', "Muk's forearm with old pale scars rests on the porch floor an inch from another hand's fingertips, not touching, rain beyond."],
      ['muk-stand-portrait', 'portrait', 'Muk sits with one knee up wringing rain from his wet sleeve, looking sideways at the viewer with tired half-lidded red-tinged eyes.'],
    ],

    [
      ['muk-stand-wide', 'wide', 'At the shrine gate in a curtain of rain Muk holds one palm up from under the eave toward the viewer, catching raindrops, gat low.'],
      ['muk-stand-square', 'square', "Close on two hands, Muk's with a black jade ring and another person's, each holding one end of a folded dark cloth between them."],
      ['muk-stand-portrait', 'portrait', "Muk's face close and slightly lowered, a raindrop on his tear mole, red-tinged eyes on the viewer under the gat brim."],
    ],

    [
      ['muk-stand-wide', 'wide', 'Muk and another person seen from behind climb shrine steps side by side in the rain, in step, lanterns glowing on both sides.'],
      ['muk-stand-square', 'square', "Muk's sheathed jangdo and the corner of another person's bundle bump at a narrow doorway, both wet with rain."],
      ['muk-stand-portrait', 'portrait', 'Muk turns away with his arms folded and his jaw set, looking at the floor, rain and lantern bokeh behind him.'],
    ],

    [
      ['muk-stand-wide', 'wide', "The porch after an argument: two lines of wet footprints lead away in opposite directions, one lantern burning, Muk's silhouette at the far end."],
      ['muk-stand-square', 'square', "Close on Muk's hand stopped on a sliding door frame, not opening it, rain-dark wood."],
      ['muk-stand-portrait', 'portrait', 'Muk looks back over his shoulder at the viewer, the first small honest look, his guard slightly lowered.'],
    ],

    [
      ['muk-stand-wide', 'wide', "Shrine rooftop at dusk after the rain: Muk sits at the edge seen from behind with another person's silhouette beside him, a faint moon between breaking clouds."],
      ['muk-stand-square', 'square', "A string of twelve small paper lanterns above Muk's head, some lit and some dark, the rain easing."],
      ['muk-stand-portrait', 'portrait', 'Muk bare-headed with the black gat held in one hand, the rain stopped, a quiet half-smile.'],
    ],

    [
      ['muk-stand-wide', 'wide', "Blue dawn at the shrine gate: Muk stands holding the gat at his side, rain stopped, another person's silhouette stepping through the gate."],
      ['muk-stand-square', 'square', "Close on the small sleeping white kitten Sogeum in a red hat curled at the end of the wet porch with Muk's boot beside it."],
      ['muk-stand-portrait', 'portrait', 'Muk bare-headed in soft dawn light looks straight at the viewer with a small, rare smile.'],
    ],
  ], true, MUK_MOUTH),

  year: chapters('year', [

    [
      ['year-room-tall', 'wide', "New Year's dawn at the mountain pavilion: the first sunrise breaks red-gold over a sea of clouds behind the red pillars and railing where Mansin stands, seen from behind."],
      ['year-portrait', 'square', "Later, the same pavilion under night stars: a new lantern that Mansin has just lit hangs beside a red pillar (a time skip, not the same moment as the dawn)."],
      ['year-eyes', 'portrait', 'Next morning on the same pavilion terrace in bright sky: Mansin holds the closed fan and gives a dry smile at the viewer (time skip, not the same moment).'],
    ],

    [
      ['year-stars-empty', 'wide', 'Wide view of a mountain garden path winding upward through blossoms, green leaves, red leaves and snow in four stretches; tiny Mansin walks at the bottom.'],
      ['year-fan-low', 'square', "Low close-up of Mansin's straw sandal stepping onto a stone where a single footprint holds both melted snow water and fallen petals."],
      ['year-hello', 'portrait', 'Mansin rests on a boulder midway up the path, the folded fan across his knee.'],
    ],

    [
      ['year-room-tall', 'wide', 'Low-angle wide view of a crossroads in a mountain garden: four stone lanterns on four paths glowing at different strengths; Mansin stands at the center, seen from behind.'],
      ['year-rice-top', 'square', "Close-up of a moss-covered stone lantern whose flame has shrunk to a small drowsy glow, Mansin's sleeve at the edge."],
      ['year-portrait', 'portrait', 'Close shot: Mansin raises one finger beside a stone lantern with his closed fan in the other hand, one eyebrow raised.'],
    ],

    [
      ['year-stars-empty', 'wide', 'Wide night view of a curved stone bridge over a mountain pond with thirteen stone lanterns lit in a line at different strengths; Mansin stands mid-bridge, seen from behind.'],
      ['year-lantern-ots', 'square', "Wide low view over a still mountain pond at night: lantern reflections ripple differently on the water beside Mansin's bridge."],
      ['year-eyes', 'portrait', 'Mansin tucks his white hair back with one hand and smiles in the glow of the stone lanterns.'],
    ],

    [
      ['year-fan-low', 'wide', 'Wide view of Mansin walking through the garden courtyard in bright afternoon sun toward the open path, seen from behind.'],
      ['year-portrait', 'square', "Close-up of a steaming teacup on a low table in the cool shade of the pavilion, Mansin's sleeve resting at the edge."],
      ['year-hello', 'portrait', 'Silhouette of Mansin standing in front of a round moon-shaped window, the folded fan in hand.'],
    ],

    [
      ['year-portrait', 'wide', 'The same pavilion as the opening view, now in evening snow: snow on the roof, stone lanterns glowing, tiny Mansin on the veranda.'],
      ['year-lantern-ots', 'square', "Close-up of Mansin's hand brushing snow off a stone lantern to uncover its glow."],
      ['year-room-tall', 'portrait', 'Three-quarter shot: Mansin points one hand toward one side of the frame in the falling snow, the closed fan in the other, with a dry smile, a thin line of first light on the ridge behind him.'],
    ],
  ]),
};
