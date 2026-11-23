import type { FateExtra } from '../ko/fate-extra';

export const FATE_EXTRA_EN: FateExtra = {
  type: {
    head: 'The shape of the two of you',
    sub: 'This type comes from how your two day stems (the heavenly character of each birth day) relate. The gold circle is you, the silver one is them.',
    me: 'You',
    you: 'Them',
    flow: {
      same: { name: 'Two of a kind', line: 'Your day stems belong to the same element. You often get each other without explaining, and you can also run out of steam in the same place at the same time.' },
      'self-feeds-other': { name: 'You carry the lantern', line: 'Your day stem feeds theirs. It comes naturally for you to give first and look after things, so it helps to let yourself be on the receiving end now and then.' },
      'other-feeds-self': { name: 'They hold the umbrella', line: 'Their day stem feeds yours. Leaning on them comes easily, and a thank-you said out loud is what keeps it lasting.' },
      'self-checks-other': { name: 'You set the direction', line: 'Your day stem holds theirs in check. It is easy to lead at your own pace, so try matching your stride to theirs once in a while.' },
      'other-checks-self': { name: 'They walk a step ahead', line: 'Their day stem holds yours in check. Following their pace can wear you down, so say your own pace out loud early on.' },
    },
    tone: {
      combine: 'On top of that, your day stems are joined by a stem combination, a pairing that tends to stay close once it gets close.',
      clash: 'On top of that, your day stems stand in a stem clash, a pairing where the friction makes each of you easier to see clearly.',
      plain: '',
    },
    element: { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' },
    link: {
      same: 'Same element',
      'self-feeds-other': 'You feed them',
      'other-feeds-self': 'They feed you',
      'self-checks-other': 'You check them',
      'other-checks-self': 'They check you',
    },
  },
  lines: {
    head: 'Where your eight characters touch',
    sub: 'Your chart is on top, theirs below. A line joins two characters, one from each of you, that form a combination, a clash or a tangle. Tap a row under the chart to light up its line.',
    me: 'You',
    you: 'Them',
    pillar: { year: 'Year', month: 'Month', day: 'Day', hour: 'Hour' },
    part: { stem: 'stem', branch: 'branch' },
    kind: {
      天干合: 'Stem combination', 天干沖: 'Stem clash', 六合: 'Six combination', 三合: 'Triple combination', 半合: 'Half combination', 方合: 'Directional combination',
      沖: 'Clash', 刑: 'Penalty', 自刑: 'Self-penalty', 破: 'Break', 害: 'Harm', 怨嗔: 'Resentment pair', 鬼門: 'Ghost gate',
    },
    tone: { harmony: 'Pulls together', clash: 'Face to face', tangle: 'Tangles' },
    line: {
      harmony: (mine, yours) => `Your ${mine} and their ${yours} pull toward each other. This is where the two of you tend to draw close.`,
      clash: (mine, yours) => `Your ${mine} and their ${yours} stand face to face. Friction here also makes you see each other clearly.`,
      tangle: (mine, yours) => `Your ${mine} and their ${yours} catch on each other a little. Misunderstandings can pile up here, so it helps to talk things through as they come.`,
    },
    summary: {
      some: (n) => (n === 1 ? 'There is 1 line where your two charts touch.' : `There are ${n} lines where your two charts touch.`),
      none: 'No strong lines connect your two charts. In that case it is the day stems and the overlap of elements that set the tone.',
    },
    more: (n) => `${n} more ${n === 1 ? 'line is' : 'lines are'} folded away. Combinations and clashes are shown first.`,
    hint: 'The characters joined by a line are the ones the reading draws on.',
  },
  years: {
    head: 'The temperature between you, year by year',
    sub: 'We checked the next seven years against each of your charts. A year where gold and silver light up together suits you both.',
    me: 'You',
    you: 'Them',
    kind: { both: 'A year for you both', one: 'A year for one of you', care: 'A year to go gently', even: 'A quiet year' },
    line: {
      both: 'Both of your currents line up this year. A good year to start something together.',
      one: 'Only one of you has the current this year. The one it suits can reach out first.',
      care: 'Plans can slip for both of you this year. Check with each other once more before big decisions.',
      even: 'No big waves this year. Keep walking side by side.',
    },
    summary: {
      some: (n) => (n === 1 ? '1 year suits you both.' : `${n} years suit you both.`),
      none: 'No year lines up exactly. Reach out to each other in the years that suit one of you.',
    },
    year: (y) => String(y),
  },
  country: {
    head: { self: 'Countries that suit you', pair: 'Countries to live in together' },
    sub: {
      self: 'We set the element that helps you and the season you were born in against each country. The largest gold pin is the first. Tap a pin or a name.',
      pair: 'We set both of your charts against each country at once. The largest gold pin is the first. Tap a pin or a name.',
    },
    rank: (n) => (n === 1 ? 'First' : n === 2 ? 'Second' : 'Third'),
    element: { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' },
    climate: { warm: 'warm', mild: 'mild', cool: 'cool', cold: 'cold' },
    reason: {
      self: {
        match: (el) => `A place where ${el}, the element that helps you, runs strong.`,
        feeds: (el) => `A place of ${el}, the element that feeds the one that helps you.`,
      },
      pair: {
        bothMatch: (el) => `A place where ${el}, the element that helps you both, runs strong.`,
        oneMatch: (el) => `A place where ${el}, the element that helps one of you, runs strong.`,
        feeds: (el) => `A place of ${el}, which backs up the element each of you needs.`,
      },
      climate: {
        self: { warm: 'You were born in winter and carry a lot of cold, so you breathe easier somewhere warm.', cool: 'You were born in summer and carry a lot of heat, so you breathe easier somewhere cool.' },
        pairBoth: { warm: 'You were both born in the cold season, so warm weather suits you.', cool: 'You were both born in the hot season, so cool weather suits you.' },
        pairOne: { warm: 'One of you was born in the cold season, so warm weather helps.', cool: 'One of you was born in the hot season, so cool weather helps.' },
      },
      plain: 'Nothing here works against you, so it is an easy place to try walking around.',
    },
    note: 'This only points to places whose mood matches your chart. For anything like moving abroad, visas or work, look into it separately and decide for yourself.',
    mapLabel: 'World map',
    vibe: {
      JP: 'Hot-spring steam and maple paths', NZ: 'Green hills and sheep', CA: 'Forest and lake mornings', CR: 'Rainforest and birdsong', IE: 'Green fields after rain', CL: 'A long land between mountains and sea',
      TH: 'Night markets and warm evening air', VN: 'Alleys smelling of coffee', PH: 'Islands the color of the sea', ID: 'Jungle and volcano islands', SG: 'A green city with late lights', MY: 'Mixed-language streets and tropical rain',
      AU: 'Huge sky and coastline', IN: 'Spice smells and bright cloth', ES: 'Slow afternoons and late dinners', IT: 'Cobblestones and afternoon sun', GR: 'White walls and blue sea', PT: 'Hill towns and sea wind',
      MX: 'Bright streets and sun', BR: 'Beach rhythm and rainforest', CH: 'Snowy peaks and lakes', AT: 'Mountain towns full of music', CZ: 'Stone bridges and old lanes', NP: 'Himalayan ridges',
      BT: 'Mountain monasteries and quiet valleys', MN: 'Endless grassland and starry nights', PE: 'Andean highlands and old stone roads', CO: 'Spring-like hill towns and coffee farms', TR: 'A city where sea meets continent', MA: 'Red walls and desert wind',
      GB: 'Rainy lanes and tea rooms', FR: 'Cafes and evenings by the river', DE: 'Forest walks and tidy streets', NL: 'Canals and bicycles', BE: 'Old squares and canal towns', PL: 'Old towns with red roofs',
      US: 'Big cities and open roads', AR: 'Tango lanes and wide plains', IS: 'Northern lights and hot springs', NO: 'Fjords and long summer light', SE: 'Lakeside forests and calm cities', FI: 'Forest, lakes and saunas',
      EE: 'Medieval lanes and sea wind', DK: 'Snug streets and the sea', HR: 'Blue sea and stone villages', LK: 'Tea hills and coast', MV: 'Coral-colored sea', FJ: 'Palm trees and clear water',
    },
  },
};
