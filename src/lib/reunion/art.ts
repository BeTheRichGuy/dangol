export const REUNION_ART_DIR = '/media/reunion-u12';

export const REUNION_ART_READY = true;

export type ReunionAspect = 'wide' | 'square' | 'portrait';

export interface ReunionArt {

  aspect: ReunionAspect;

  where: string;

  scene: string;
}

export const REUNION_ART: Readonly<Record<string, ReunionArt>> = {
  "story-1": { aspect: 'wide', where: "방 첫 화면 칸 1(열기)", scene: "Wide establishing shot of the moonlit lakeside pavilion seen from the lotus pond: a gayageum resting on the wooden floor, U12 small in the frame seated beside it, big full moon, fireflies, plum branch in the top-left corner." },
  "story-2": { aspect: 'portrait', where: "방 첫 화면 칸 2(인사)", scene: "U12 sits at the pavilion, one hand raised in a soft welcoming gesture toward the viewer, warm knowing smile, half-lidded eyes, waist-up, moonlight rim light." },
  "story-3": { aspect: 'square', where: "방 첫 화면 칸 3(소금)", scene: "A small fluffy white kitten wearing a tiny red hat sleeps curled on a navy cushion beside the gayageum; only U12's hand with long sleeve gently rests near it. No face of hers." },
  "story-4": { aspect: 'wide', where: "방 첫 화면 칸 4(첫 소리)", scene: "Low camera at pond level: U12 plucks one string at the pavilion edge beyond a screen of lotus leaves, a ripple spreading across the water toward the viewer, fireflies lifting from the leaves." },
  "story-5": { aspect: 'square', where: "방 첫 화면 칸 5(눈)", scene: "Extreme close-up of U12's face from the nose up: deep violet-grey almond eyes with long lashes looking straight at the viewer, moon reflected in her pupils." },
  "story-6": { aspect: 'portrait', where: "방 첫 화면 칸 6(곁눈)", scene: "Seen from the dim corridor behind a half-open paper-lattice door, U12 glances back over her shoulder at the viewer with a teasing smile, a row of warm corridor lanterns receding behind her, waist-up." },
  "story-7": { aspect: 'portrait', where: "방 첫 화면 칸 7(내민 손)", scene: "U12 stands at the top of the pavilion's stone steps extending one open hand down toward the viewer as if helping them up, lantern light on the steps and the full moon behind her, shot from below." },
  "01-a": { aspect: 'wide', where: "1절 두 줄 맞춰 보기 ① 핵심 관찰", scene: "Golden dusk seen from the stone steps at the water's edge: the lantern-lit pavilion across the lotus pond with U12 small at her gayageum, tuning it, the first pale star above." },
  "01-b": { aspect: 'square', where: "1절 ② 이유·대비", scene: "Top-down close-up of the gayageum's strings and two wooden bridges set slightly apart, her fingertips about to align them, last orange daylight on the wood, no face." },
  "01-c": { aspect: 'portrait', where: "1절 ③ 한마디", scene: "Low angle from the floorboards: U12 leans over the gayageum toward the viewer with a gentle knowing smile, strings softly blurred in the foreground, dusk sky behind." },
  "02-a": { aspect: 'wide', where: "2절 우리가 울리던 소리 ①", scene: "Warm golden hour on the wooden veranda of a hanok courtyard in spring: U12 sits with her eyes closed and a soft nostalgic smile, listening, plum blossoms drifting down, two teacups side by side on the floorboards." },
  "02-b": { aspect: 'square', where: "2절 ②", scene: "Two paper lanterns glowing side by side on a blossoming plum branch, one slightly larger, petals drifting through the warm light, no person." },
  "02-c": { aspect: 'portrait', where: "2절 ③", scene: "Profile close-up through drifting plum petals: U12 touches her lower lip with one fingertip, a faint wistful smile, warm lantern light on her cheek, loose strands of hair." },
  "03-a": { aspect: 'wide', where: "3절 끊어진 자리 ①", scene: "Night rain begins over the pavilion, seen from the veranda edge with rain streaks and ripples on the pond: the gayageum with one string snapped and curling loose, U12's hand hovering above it, no face." },
  "03-b": { aspect: 'square', where: "3절 ②", scene: "Close-up of the snapped string curled on the polished wood with a few raindrops blown in, one wooden bridge toppled on its side, cold blue light, no person." },
  "03-c": { aspect: 'portrait', where: "3절 ③(쓴소리)", scene: "U12 in three-quarter profile on the rainy veranda, her eyes lowered to the snapped gayageum string in her lap with a heavy, unsmiling gaze, one hand pressing the loose string flat against the wood, rain falling beyond the eaves, not looking at the viewer, bust crop." },
  "04-a": { aspect: 'square', where: "4절 마지막 대화 복기 ①", scene: "A smartphone with a completely blank dark screen lies face-down on the wooden pavilion floor in moonlight, her fingertips just pulling away, no text." },
  "04-b": { aspect: 'wide', where: "4절 ②", scene: "Interior of a hanok room at night, framed by the dark doorway: U12 in profile beside an open sliding door gazing at the moon on the far water, a thin oil lamp, fireflies drifting outside." },
  "04-c": { aspect: 'portrait', where: "4절 ③", scene: "U12 seen from a back three-quarter angle in the dim room, looking down at her own open hand resting beside a cold teacup, eyes lowered, a quiet restrained expression with no tears and no smile, lamplight on her cheek and the moon faint in the window behind her, bust crop." },
  "05-a": { aspect: 'square', where: "5절 내 쪽의 되풀이 ①", scene: "Her hands moving the same wooden bridge of the gayageum back and forth, a faint motion trail, no face." },
  "05-b": { aspect: 'wide', where: "5절 ②", scene: "A long stone staircase climbing a pine-covered hill at night, lanterns at every landing repeating into the distance, U12 small on the steps as if climbing the same flight again." },
  "05-c": { aspect: 'portrait', where: "5절 ③(쓴소리)", scene: "Tilted low angle through overlapping bamboo leaves: U12 raises one eyebrow with a teasing stern smirk, chin lifted, bust crop." },
  "06-a": { aspect: 'wide', where: "6절 그 사람 차트의 결 ①", scene: "An empty second navy cushion across from the gayageum in the moonlit pavilion, U12 partially visible at the edge of the frame, no second person." },
  "06-b": { aspect: 'square', where: "6절 ②", scene: "Her hand holds a single closed lotus bud above the dark water, moonlight on the petals, no face." },
  "06-c": { aspect: 'portrait', where: "6절 ③", scene: "Seen through hanging bamboo blinds: U12 tilts her head thoughtfully with one finger on her chin, soft stripes of lantern light across her face, bust crop." },
  "07-a": { aspect: 'wide', where: "7절 다시 이어도 되는 조건 ①", scene: "U12 seen from behind at a fork of three paths in moonlit mist: a stone bridge over the pond, a bamboo-grove path, and a lantern-lit lane between tiled walls." },
  "07-b": { aspect: 'square', where: "7절 ②", scene: "Her hand lines up three smooth dark stones on the wooden floor beside the gayageum, no face." },
  "07-c": { aspect: 'portrait', where: "7절 ③", scene: "On a moonlit stone bridge with mist below: U12 raises one finger as if asking one question, wind in her hair and sleeves, shot from slightly below, waist-up." },
  "08-a": { aspect: 'wide', where: "8절 재회 창 ①", scene: "View from the pavilion's upper loft over the lake: the moon low over the hills and a second, fainter moon-glow rising on the opposite side, rows of lanterns across the water, no person." },
  "08-b": { aspect: 'square', where: "8절 ②", scene: "On the pavilion loft floor, two wooden bridges of the gayageum set slightly apart with a thin pale thread of moonlight stretching between them toward the far shore, hope and uncertainty in the quiet empty light, no person, no face." },
  "08-c": { aspect: 'portrait', where: "8절 ③", scene: "U12 seen from behind and slightly below on the pavilion loft balcony, one hand resting on the railing and her face turned in profile toward the fainter second moon-glow, a hopeful yet uncertain expression, night wind in her long hair and sleeves, waist-up." },
  "09-a": { aspect: 'wide', where: "9절 연락 키트 ①", scene: "Inside a hanok room after the rain has stopped: U12 kneels at a low table in warm lamplight with a smartphone propped against a teacup, reading it with a gentle smile, the window open to a blue night, no text." },
  "09-b": { aspect: 'square', where: "9절 ②", scene: "Close-up of two thumbs on a phone with a blank glowing screen, moonlight on her sleeve, no face, no text." },
  "09-c": { aspect: 'portrait', where: "9절 ③", scene: "Peeking around a half-open lattice door: U12 puts one finger to her lips in a playful shushing gesture, mischievous eyes, warm light behind her." },
  "10-a": { aspect: 'wide', where: "10절 만남 설계도 ①", scene: "A tea pavilion on a hillside terrace at dusk, set for two: two navy cushions, a low table with two steaming cups, a small lantern with an empty paper shade, town lights below, no people." },
  "10-b": { aspect: 'square', where: "10절 ②", scene: "Her hands pouring tea from a small teapot into one cup, steam rising, no face." },
  "10-c": { aspect: 'portrait', where: "10절 ③", scene: "Standing in a tiled-wall lane at dusk with a small paper lantern in her hand: U12 tilts her head with a warm inviting gaze, waist-up." },
  "11-a": { aspect: 'wide', where: "11절 다시 이어졌다면 ①", scene: "Dawn at a wooden ferry dock on a misty river: U12 smiles gently at the end of the dock beside a moored boat, rose-gold light on the water, medium wide shot." },
  "11-b": { aspect: 'square', where: "11절 ②", scene: "Her hand gently adjusting one bridge of the gayageum in dawn light, no face." },
  "11-c": { aspect: 'portrait', where: "11절 ③", scene: "Walking toward the viewer along a dewy riverside path: U12 with a calm confident smile, morning sun flaring behind her, waist-up." },
  "12-a": { aspect: 'wide', where: "12절 놓는다면 ①", scene: "U12 seen from behind walking away along a long plank bridge across the misty lake at first light, long hair swaying, wide shot." },
  "12-b": { aspect: 'square', where: "12절 ②", scene: "Her hand releasing a blank pale lotus-shaped paper boat lantern onto the dark pond, soft glow, no face, no text." },
  "12-c": { aspect: 'portrait', where: "12절 ③(마지막 한 곡)", scene: "U12 at the water's edge at first light, kneeling beside the pond with her open palm as a pale paper lantern drifts away, a relieved serene smile just beginning, eyes open and following the lantern, morning breeze lifting her hair, bust crop." },
  "free-hello": { aspect: 'portrait', where: "무료 랜딩 인사(첫 칸)", scene: "U12 at the pavilion gate greeting the viewer with a knowing half-smile; a blossoming plum branch crosses the top-left corner, petals drifting, slightly out of focus; waist-up." },
  "free-ask-1": { aspect: 'square', where: "무료 입력 칸 배경(아래에서 빼꼼)", scene: "U12 tilts her head with a curious, gentle look straight at the viewer, her whole face and shoulders fully visible with the face in the upper two thirds of the frame, soft moonlit lanterns glowing behind her, bust crop." },
  "free-ask-2": { aspect: 'portrait', where: "무료 입력 칸 2", scene: "U12 sits on a veranda at night with her chin resting on her hand, listening with gentle eyes, a steaming teacup beside her and rain-washed courtyard stones glistening behind, waist-up." },
  "free-ritual-1": { aspect: 'wide', where: "무료 의식 1(줄 고르기)", scene: "Overhead view looking down into the pavilion: U12 tuning the gayageum with one finger on a bridge, concentrating, lantern glow pooling on the wooden floor." },
  "free-ritual-2": { aspect: 'wide', where: "무료 의식 2(첫 음)", scene: "Seen from the far shore across the water: the small lit pavilion in the distance as a ripple from one plucked string spreads across the whole pond and fireflies lift." },
  "free-ritual-3": { aspect: 'wide', where: "무료 의식 3(여운)", scene: "The ripple reaches the far shore, moon and lotus reflected, U12 listening with eyes closed, small in the frame." },
  "free-pitch": { aspect: 'wide', where: "무료 결제 유도", scene: "The pavilion door slightly ajar with warm light spilling out, U12's silhouette waiting inside beside the gayageum, dark pond in front." },
  "share-card": { aspect: 'portrait', where: "저장·공유 카드 배경(한 곡 카드)", scene: "Empty moonlit lotus pond with the pavilion small in the distance, big moon, fireflies, large calm empty space in the upper half for text added later, no text, no person." },
};

export const REUNION_ART_NAMES = Object.keys(REUNION_ART);

export const REUNION_STAND: Record<ReunionAspect, string> = { wide: 'stand-wide', square: 'stand-square', portrait: 'stand-portrait' };

export function reunionArtSrc(name: string): string {
  const art = REUNION_ART[name];
  if (!art) throw new Error(`unknown reunion art: ${name}`);
  return `${REUNION_ART_DIR}/${REUNION_ART_READY ? name : REUNION_STAND[art.aspect]}.jpg`;
}

export function reunionPanelName(chapter: number, slot: 'a' | 'b' | 'c'): string {
  return `${String(chapter).padStart(2, '0')}-${slot}`;
}
