export interface BundleCopy {

  price: string;
  listPrice: string;
  lanterns: string;
  checkout: {
    title: string;

    orderName: string;
    productLabel: string;
    product: string;
    includesLabel: string;
    includes: string;
    lanternsLabel: string;
    lanternsValue: string;
    refundNotice: string;
    agree: string;
    after: string;
  };
  page: {
    back: string;
    title: string;
    lead: string;
    listLabel: string;
    lanternLine: string;
    howHeading: string;
    steps: readonly string[];
    includesHeading: string;

    more: string;
    partnerNote: string;
    subjectHeading: string;
    loginLead: string;
    loginNote: string;
    pickSelf: string;
    dockPay: (price: string) => string;
    dockLogin: string;
    dockPick: string;
    dockLuck: string;
    payNote: string;
    closed: string;
    closedNote: string;
    failed: string;
  };
  read: {
    title: string;
    confirming: string;
    confirmFailed: string;
    paid: string;
    lanternsArrived: string;
    lanternsLate: string;
    partnerHeading: string;
    partnerLead: string;
    partnerPickHint: string;
    partnerNeed: string;
    start: string;
    startNeedKind: string;
    writingHeading: string;
    writingNote: string;
    status: { waiting: string; writing: (done: number, total: number) => string; done: string; error: string };
    open: string;
    retry: string;
    allDone: string;
    archive: string;
    lost: string;
    toMain: string;
    other: string;
  };

  pick: {

    name: string;

    tabAll: string;
    price: string;

    list: string;
    badge: string;
    cta: string;
    checkout: {
      orderName: string;
      product: string;
      refundNotice: string;

      after: (partner: boolean, reunion: boolean) => string;
    };
    page: {
      title: string;
      lead: string;
      listLabel: string;
      chooseHeading: string;
      chooseHint: string;
      loginLead: string;
      chosen: (n: number, total: number) => string;
      steps: (partner: boolean, reunion: boolean) => readonly string[];
      partnerNote: string;
      reunionNote: string;
      dockPay: (price: string) => string;
      dockChoose: (left: number) => string;
      payNote: string;
    };
    read: {
      title: string;
      partnerLead: string;
      start: string;
      writingHeading: string;
      writingNote: string;
      allDone: string;

      reunionNote: string;
      reunionButton: string;

      reunionPaid: string;
    };
  };
}

export const BUNDLE_COPY: BundleCopy = {
  price: '$7.90',
  listPrice: '$31.45',
  lanterns: '15 lanterns',
  checkout: {
    title: 'Checkout',
    orderName: 'DANGOL five-room bundle',
    productLabel: 'Product',
    product: 'All five rooms, one reading each (digital content, not a top-up)',
    includesLabel: 'Includes',
    includes: 'Five readings, plus 15 lanterns for the chat',
    lanternsLabel: 'Bonus',
    lanternsValue: '15 lanterns, added right after payment',
    refundNotice:
      'Once payment is confirmed, all five readings can start. It is digital content, so refunds are limited once writing has begun. Lanterns are a bonus for this purchase: they have no cash value and cannot be refunded or transferred. If we fail to deliver a reading, we will redo it or refund you.',
    agree: 'I have read the notice above, the Terms and the Refund Policy, and I agree.',
    after: 'Once you have paid, you will add the person for Muk’s compatibility room, and then all five readings start together.',
  },
  page: {
    back: 'Back',
    title: 'Five rooms, all at once',
    lead: 'Life, Ten-Year Chapters, Love, Muk’s Compatibility and 2027: one purchase, five full readings written together.',
    listLabel: 'Bought one by one',
    lanternLine: '15 lanterns land in your account the moment you pay.',
    howHeading: 'How it goes',
    steps: ['Pick whose chart to read and pay once.', 'Tell us who Muk’s compatibility reading is about.', 'All five readings are written at the same time. It takes a few minutes.'],
    includesHeading: 'What is inside',
    more: 'See each room',
    partnerNote: 'Muk’s compatibility room needs a second person. You add them after you pay, before the writing starts.',
    subjectHeading: 'Whose chart should we read?',
    loginLead: 'The lanterns go into your account, so the bundle needs a login.',
    loginNote: 'Sign in with one tap. Your readings are saved to your archive too.',
    pickSelf: 'Pick the person for all five readings.',
    dockPay: (price) => `Pay ${price} for all five`,
    dockLogin: 'Sign in to buy the bundle',
    dockPick: 'Pick a person to start',
    dockLuck: 'Answer one question first',
    payNote: 'One payment, five readings, 15 lanterns.',
    closed: 'The bundle is not open here yet.',
    closedNote: 'Single rooms are open. The bundle will follow.',
    failed: 'We could not finish the payment. Please check your payment history and try again.',
  },
  read: {
    title: 'Your five readings',
    confirming: 'Confirming your payment…',
    confirmFailed: 'We could not confirm the payment yet. If you already paid, do not pay again. Check once more.',
    paid: 'Paid. Thank you.',
    lanternsArrived: '15 lanterns are in your account.',
    lanternsLate: 'Your 15 lanterns are on the way and will show up shortly.',
    partnerHeading: 'Who is Muk’s compatibility reading about?',
    partnerLead: 'Pick the other person. When you start, all five readings are written at once.',
    partnerPickHint: 'Choose one person from your saved people, or add someone new.',
    partnerNeed: 'Choose the other person first.',
    start: 'Start all five readings',
    startNeedKind: 'Choose how you two know each other.',
    writingHeading: 'Writing your five readings',
    writingNote: 'It takes two to five minutes. Keep this screen open and do not leave it. When all five are written, you can open each one.',
    status: {
      waiting: 'Waiting',
      writing: (done, total) => `Writing ${done}/${total}`,
      done: 'Ready',
      error: 'Hit a snag',
    },
    open: 'Read it',
    retry: 'Try again',
    allDone: 'All five readings are here.',
    archive: 'Find them anytime in your archive.',
    lost: 'We lost the details for this purchase in this tab. Start again from the bundle page. If you already paid, you will not be charged twice.',
    toMain: 'Back to the shrine',
    other: 'Back to the bundle page',
  },
  pick: {
    name: 'Pick any 3',
    tabAll: 'All five rooms',
    price: '$5.60',
    list: '$18.87',
    badge: 'Your pick',
    cta: 'Pick 3 readings',
    checkout: {
      orderName: 'DANGOL pick-3 bundle',
      product: 'Pick 3: the three readings you choose, one reading each (digital content, not a top-up)',
      refundNotice:
        'Once payment is confirmed, your three readings can start. It is digital content, so refunds are limited once writing has begun. If we fail to deliver a reading, we will redo it or refund you. Lanterns are not included.',
      after: (partner, reunion) =>
        `Once you have paid, ${partner ? 'you will add the person for Muk’s compatibility room, and then ' : ''}your readings start together and are saved to your archive.${reunion ? ' The reunion reading starts after you fill in a short form.' : ''}`,
    },
    page: {
      title: 'Any three readings, one price',
      lead: 'Choose three of the six readings and get them written together.',
      listLabel: 'Bought one by one',
      chooseHeading: 'Choose three readings',
      chooseHint: 'It has to be exactly three.',
      loginLead: 'Your readings are saved to your archive, so the pick-3 bundle needs a login.',
      chosen: (n, total) => `${n} of ${total} chosen`,
      steps: (partner, reunion) => [
        'Pick whose chart to read and pay once.',
        ...(partner ? ['Tell us who Muk’s compatibility reading is about.'] : []),
        'Your readings are written at the same time. It takes a few minutes.',
        ...(reunion ? ['For the reunion reading, fill in a short form and start it right after.'] : []),
      ],
      partnerNote: 'Muk’s compatibility room needs a second person. You add them after you pay, before the writing starts.',
      reunionNote: 'The reunion reading begins with a few questions about your situation, so after you pay you answer them on the free reunion page and start it from there.',
      dockPay: (price) => `Pay ${price} for your three`,
      dockChoose: (left) => (left === 1 ? 'Choose 1 more reading' : `Choose ${left} more readings`),
      payNote: 'One payment, three readings. Lanterns are not included.',
    },
    read: {
      title: 'Your three readings',
      partnerLead: 'Pick the other person. When you start, your readings are written at once.',
      start: 'Start the readings',
      writingHeading: 'Writing your readings',
      writingNote: 'It takes two to five minutes. Keep this screen open and do not leave it. When they are written, you can open each one.',
      allDone: 'All your readings are here.',
      reunionNote: 'The reunion reading needs a few answers first. You have already paid, so you will not be charged again.',
      reunionButton: 'Answer and start',
      reunionPaid: 'Already paid with your pick-3 bundle',
    },
  },
};
