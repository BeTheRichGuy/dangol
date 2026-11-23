export interface DmCopy {

  hello: (name: string, line: string) => string;

  pitch: string;

  privacy: string;

  cardSubtitle: string;

  button: string;

  xmas: { pitch: string; cardSubtitle: string; button: string };
}

export const DM_EN: DmCopy = {
  hello: (name, line) => `Thanks for the comment! Yul picked a charm for you.\n\n${name}: ${line}`,
  pitch: 'There are more charms waiting at DANGOL. Add your birth date there and you can look at the year ahead and plan for it.',
  privacy: 'Please type your birth date on the site only, never in this chat.',
  cardSubtitle: 'More charms, plus a look at the year ahead from your birth date.',
  button: 'Get more charms',
  xmas: {
    pitch: 'Thinking about them this Christmas? See the best days to reach out for free.',
    cardSubtitle: 'You & them this Christmas: check the best days to reach out, free.',
    button: 'See best days free',
  },
};
