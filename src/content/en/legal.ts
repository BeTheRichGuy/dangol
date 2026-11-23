import { REUNION_PRICE_TEXT } from '@/lib/reunion/product';
import { BUSINESS } from '../business';
import { roomPriceSections } from '../pricing';
import { ROOMS_COPY } from './rooms';
import { ROOMS_KO } from '../ko/rooms';
import { ROOMS_JA } from '../ja/rooms';

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  sections: LegalSection[];
}

const UPDATED = 'November 9, 2026';

const POLICY_UPDATED = 'November 16, 2026';

const PRIVACY_UPDATED = 'November 16, 2026';

const about: LegalDoc = {
  title: 'About Yul and Sogeum',
  updated: UPDATED,
  sections: [
    {
      heading: 'The short version',
      body: [
        'DANGOL is a Korean saju experience told as a webtoon. Follow a sleepy kitten to a shrine above the clouds, meet Yul, and explore the patterns in your birth chart.',
        'Yul gives you one piece of good news and one piece of bad news: something encouraging and something to watch. Your first reading is free. The inner rooms offer longer readings on individual themes.',
      ],
    },
    {
      heading: 'Who is Yul?',
      body: [
        'Yul (律) is twenty-five, a little scruffy, and almost always smiling. Yul is a fictional character created for DANGOL. There is no real shaman behind the curtain.',
        'Yul is the first to say so: “I’m not real. Your chart is.”',
        "Yul can’t see your future. The story draws on traditional saju interpretations, with room for a little teasing and your own judgment about what fits.",
      ],
    },
    {
      heading: 'Who is Sogeum?',
      body: [
        'Sogeum (소금) means “salt” in Korean. Sogeum is a fluffy white kitten in a tiny red hat, and decides who gets to climb the stairs. Not just anyone gets brought up.',
        'Then Sogeum falls asleep, usually beside the salt dish, and sleeps through nearly everything. Yul has given up trying to wake the cat.',
      ],
    },
    {
      heading: 'The good news and the bad news',
      body: [
        'Every reading has two parts. The good news is one good thing, said kindly. The bad news is one thing to watch this season, plus one small thing you can do about it today.',
        'Everyone gets exactly one piece of good news. What changes is how much the bad news asks you to watch: a little, some, or a lot, depending on how busy your season is. It says nothing about how good you are, and it has nothing to do with what you pay.',
        'Bad news here is never a verdict and never a curse. Just weather: worth knowing before you head out, and gone soon enough.',
      ],
    },
    {
      heading: 'The calendar does the math. Yul does the talking.',
      body: [
        'Your chart comes from saju, the Korean system of four pillars. It turns the moment you were born into eight characters: a heavenly stem and an earthly branch for each of your birth year, month, day, and hour. A calendar works them out. Yul only tells you what they mean.',
        'Your day decides your type. The top character of your day pillar, called the day master, tells us which of the ten types you are: Pine, Vine, Sun, Candle, Mountain, Field, Blade, Jewel, Ocean, or Rain.',
      ],
    },
    {
      heading: 'How Yul reads it',
      body: [
        'Yul starts with the five elements in your eight characters: how much wood, fire, earth, metal, and water you have, where there is too much or too little, and where they help or clash with each other.',
        'Next comes the day master, the character that stands for you. Yul works out the ten kinds of relationship the other characters have with it, called the ten gods. They show where people, work, money, and self-expression sit in your life.',
        'Then Yul lays your 10-year luck cycles and the yearly luck that arrives each year over your chart. That is why the same question gets a different story for each chart.',
        'In the inner rooms, Yul adds the question you wrote and tells it as one story. Saju is a way of reading, not a fixed answer, so Yul talks about flow and possibility, never certainty.',
      ],
    },
    {
      heading: 'How we calculate it',
      body: [
        "Local solar time. For your day and hour we use the sun’s time at your birthplace, called local mean solar time, instead of the clock on the wall. A birth in Seoul, for example, runs about half an hour behind Korean standard time. Daylight saving time in your birth year is accounted for.",
        'The year begins at the Start of Spring (Ipchun), around February 4. It does not begin on January 1, and it does not begin on Lunar New Year. If you were born in January or early February, your year may belong to the one before.',
        "Months follow the solar terms (jeolgi), the moments the sun reaches certain points on its yearly path, not the first of the calendar month. That’s why Yul’s “when” sounds like “between Cold Dew and the Start of Winter” instead of “in October.”",
        'Near midnight. In our calculation the day changes at midnight. Schools of saju disagree about births between 11 pm and 1 am by your birthplace’s solar time, so if that is you, we say so and show the type you would be under the other approach.',
        'No birth time? That is fine. We read three pillars instead of four and tell you so. If your birthday falls on the day a solar term begins, we tell you that too, because your year or month pillar might differ.',
        'The math runs in your browser, on an open-source calendar library (lunar-javascript, MIT license). Your birth details do not travel anywhere to be calculated.',
      ],
    },
    {
      heading: "What this is, and what it isn’t",
      body: [
        'DANGOL is for entertainment and fun. Think of it as a mirror with a good sense of humor: a playful way to look at your own patterns, if you feel like it.',
        "It is not prediction, and it is not professional advice. Yul doesn’t give medical, financial, or legal advice, and doesn’t read what someone else is thinking. The one exception is the reunion reading, which gives an interpretation of how the other person may feel after a breakup, drawn from the two charts. It is not a confirmed fact. The full list is on the Things I won’t read page.",
      ],
    },
    {
      heading: 'Why “Dangol”?',
      body: [
        '단골 (dangol) is the Korean word for a regular: the person a café owner greets by name and slips an extra cookie. Come back when your season changes, and Yul will be waiting on the stairs. Become a regular.',
      ],
    },
  ],
};

const wontRead: LegalDoc = {
  title: "Things I won’t read",
  updated: UPDATED,
  sections: [
    {
      heading: 'A short list',
      body: [
        "Some questions are too big for one piece of good news and one piece of bad news. Here is what I leave alone, and why.",
      ],
    },
    {
      heading: 'The one-to-one chat is the exception',
      body: [
        "Everything below is about the readings in the rooms. The one-to-one chat works differently: ask about any of these there, and I’ll answer from your chart.",
        "For sensitive topics like health, money, someone else’s feelings, or a breakup, I’ll add a reminder that it’s only a chart reading, so please don’t take it too seriously. Check anything about your body with a doctor, and money with a professional. And please don’t let one line from a chat be the reason you make a big decision.",
        "If things feel heavy right now, a person who can really be there matters more than a chat. Please reach out to emergency services or someone you trust first.",
      ],
    },
    {
      heading: 'Death, lifespan, illness, accidents, pregnancy',
      body: [
        "I don’t read how long anyone has, whether someone will get sick, whether something bad might happen, or whether you will or won’t be pregnant. A birth chart can’t answer these, and they aren’t mine to guess at.",
        "If one of these is weighing on you, the right door is a doctor, a professional, or someone you trust. I’m here for the lighter questions.",
      ],
    },
    {
      heading: 'Lottery numbers, stocks, crypto',
      body: [
        "I don’t pick winning numbers, and I won’t tell you what to buy or sell. I read people, not markets.",
      ],
    },
    {
      heading: 'Medical, legal, and money decisions',
      body: [
        "I can offer a story to think about. For medical, legal, or financial decisions, speak to a qualified professional.",
        "Please don’t use a piece of good news or bad news as the reason to do something big, or to skip it.",
      ],
    },
    {
      heading: 'What someone else is thinking',
      body: [
        "I can’t read secrets, hidden feelings, or the mind of someone who isn’t standing here with you. I read you, and the season you’re in.",
        "That includes your ex’s new someone. I won’t say what they’re like, or whether it will last.",
        "The reunion reading is the one exception. There I read how your ex may feel since the breakup and where they stand on a reunion, as an interpretation of the two charts. It is not a confirmed fact, and even there I won’t say what they are doing, whether there’s someone new, which day they’ll write, or whether they’ll come back.",
      ],
    },
    {
      heading: 'Endings, and “the one”',
      body: [
        "I won’t tell you a relationship is over, and I won’t tell you someone is the one. Love isn’t a verdict, and I only do weather.",
      ],
    },
    {
      heading: "If you’re having a hard time",
      body: [
        "If you’re thinking about hurting yourself, or you’re in danger, please contact your local emergency services right now. In the US, you can call or text 988, the Suicide & Crisis Lifeline. Elsewhere, findahelpline.com lists lines by country.",
        'A reading is not the right help for this, and you deserve the right help.',
      ],
    },
    {
      heading: 'What I do read',
      body: [
        'Your season, your patterns in love, one good thing, and one thing to watch.',
        'Ask me something you can carry.',
      ],
    },
  ],
};

const B = BUSINESS;
const OPERATOR = `${B.name.en}, represented by ${B.owner} (business registration number ${B.bizNo})`;

const privacy: LegalDoc = {
  title: 'Privacy Policy',
  updated: PRIVACY_UPDATED,
  sections: [
    {
      heading: 'The short version',
      body: [
        'If you don’t sign in, your name, birth date, birth time, and birthplace stay in your browser. We do not send them to our server, we do not put them in links, and we do not save them.',
        'If you sign in, we save the people you add (a name or nickname and their birth details) and the readings you open in your account, so you only type a birthday once. Only you can see them, and you can delete any of them. Details below.',
        'If you open one of the inner rooms for a long reading, only the chart your browser worked out, and the question you typed if you wrote one, goes out so the reading can be written. Details below.',
        'We collect only what you choose to give us when you join the list or reserve a launch price: your email address, plus a few details about how you got here and what you chose along the way, all listed below.',
      ],
    },
    {
      heading: 'What stays in your browser',
      body: [
        "Your reading is calculated in your browser. While you move through the steps, your answers are kept in your browser’s session storage, so the back button works. That storage is cleared when you close the tab.",
        'Share links carry only your type and the language of the page you were viewing (for example, /?t=candle&l=ko). Share images show your type, a line about it, and your regular number if you add it. To draw the image, your browser asks our server for exactly those things. Never your birth details or your name.',
      ],
    },
    {
      heading: 'Writing your room reading',
      body: [
        'When you start a reading in one of the inner rooms, your browser sends our server the chart it worked out: your eight characters (six if your birth time is unknown), their elements and Ten Gods, your ten-year chapters and their ages and years, the years and months that room reads, your current age, and the question you typed, if any. In the compatibility room it also sends the other person’s chart and what you are to each other. In the reunion reading it also sends your former partner’s chart, the answers you chose about the breakup (how long ago it ended, how long you were together, who ended it, the main reasons, your contact now, and what you want) and the one-line worry you wrote, if any. In the Christmas reading about the person you like, it sends what you chose about that person (how you know each other, what you hope for by Christmas, how often you talk now) and, if you entered their birthday, the chart your device worked out from it (the characters, not the birth date). If you came through the 40-question test, it also sends the options you picked there (as short codes). We never ask for their name or contact details. It never sends a name, a birth date, a birth time, a birthplace, or the gender you chose.',
        'Our server sends the calculated chart and any question to Google (the Gemini API), which writes paid room readings, then streams the text back to you. For one-on-one chat we do the same with the calculated chart, the question you are sending, and the last few lines of the conversation. The conversation itself stays in your browser on this device and is not stored on our server. Google processes this information under the Gemini API terms and its privacy policy. We use the Gemini API’s paid tier, under which Google does not use submitted content to improve its products; Google may keep it for a limited time to detect abuse. Our server does not keep the chart it passes along.',
        'If you are not signed in, we do not save the question or the reading anywhere but your browser: the finished reading stays in your browser’s session storage until you close the tab. If you sign in in that same tab before closing it, your browser moves that reading, with the details you entered, into My readings in your account. If you are signed in, the finished reading and your question are saved in your account, so you can open them again in My readings. So that a reading keeps being written even if you leave the screen, signing in also means that an entry marked “writing” is created in My readings when the reading starts (personal details such as names and birth dates are saved to your account by your browser directly and never pass through our server), and our server fills in the text, using your sign-in token, as soon as it is written. In the meantime the server sees only the calculated chart and the entry number.',
        'Your age and the years of your chapters could hint at the year you were born. Please keep that in mind before you write anything personal in the question box.',
      ],
    },
    {
      heading: 'Signing in',
      body: [
        'You can sign in with Google, Kakao, Naver, LINE, or a sign-in link sent to your email. The service you choose tells us an account ID and, if you allow it, your email address, display name, and profile picture. We use them only to keep you signed in and to find your saved people and readings. We never post to those accounts.',
        'Sign-in and your account data run on Supabase, our database and sign-in provider. Signing in places a cookie in your browser that keeps you signed in. It is not used for advertising.',
        'You don’t need an account for your first reading.',
      ],
    },
    {
      heading: 'Saved people and readings',
      body: [
        'For each person you add, we save the name or nickname you give, what they are to you (you, partner, friend, and so on), their birth date, birth time (or that it is unknown), birthplace (the city, its coordinates, and its time zone), and the rule for the ten-year chapters, if you picked one.',
        'For each reading, we save which reading it was, its language, a copy of those details as they were at the time, the question you typed, and the date. For room readings we also save the text of the reading. The free first reading is redrawn from those details, so its text is not saved.',
        'Even when you are signed in, the data sent to Google for a paid room reading or a one-on-one chat consists of the calculated chart and your question (for chat, plus the last few lines of the conversation), without the saved name, birth date, birth time, or birthplace.',
        'Your saved people and readings are locked to your account: our database only lets the signed-in owner read or change them. You can delete a person or a reading at any time. Deleting your account deletes all of them.',
        'For one-on-one chat we keep, on our server, how many lanterns each account has left and a record of the lanterns earned while a paid reading was being written (the order number and how many were earned), and the dates you checked in. Neither holds a name or birth date.',
      ],
    },
    {
      heading: 'Payments',
      body: [
        'When you pay for a room reading, payments in Korean won are processed by Toss Payments (cards and easy pay) or, through PortOne, by NHN KCP, Kakao Pay or Toss Pay, and payments in other currencies are processed by Dodo Payments, our reseller and merchant of record. They collect your card or payment details under their own terms. We never see your card number.',
        'From them we receive the order number, the amount and currency, the payment time, and whether the payment went through or was refunded. We link this to the reading you paid for and, if you are signed in, to your account.',
        'So that the same reading is never charged twice and refunds can be handled, we keep an order record in Supabase: the order number, the room, the amount, the payment status (waiting, paid, refunded), the approval time, your account number if you are signed in, and a one-way scrambled value made from what you entered. Your name, birth date and question text are not part of this record.',
        'Korean e-commerce law requires us to keep payment and delivery records for five years and records of complaints and disputes for three years, so we keep these for that long even if you delete your account.',
      ],
    },
    {
      heading: 'What we collect',
      body: [
        'When you join the list or reserve a launch price, we store your email address and your confirmation that you are 18 or older and agree to this policy.',
        'We also store the page you signed up from and, if you had a reading first, your type (for example, Candle) and what brought you up the stairs: love, someone specific, or everything.',
        'If you arrived through a campaign link, we keep its tags (UTM parameters). We also store the regular number we give you and the date you signed up.',
        'For the list, we do not store your name, birth date, birth time, or birthplace. If you sign in, what we save is described under Saved people and readings.',
      ],
    },
    {
      heading: 'Technical logs',
      body: [
        'Like most websites, our hosting provider automatically records basic technical information, such as your IP address, browser type, and the time of each request, to keep the site running and secure. We do not use it to identify you. These logs are kept for a short time under the hosting provider’s retention settings and then deleted automatically.',
      ],
    },
    {
      heading: 'Reviews (stars and a short note)',
      body: [
        'After a reading you can leave a star rating (1 to 5) and a short note (optional, up to 300 characters). We use them to improve the service. We store the room the reading came from, the language, and a two-letter country code with it.',
        'We do not store your name, birth date, time or city, email, account or IP address with a review, so the stars and the note are not linked to you or your account. Please do not put your name or contact details in the note.',
        'To give the 3 lanterns for a review only once per report, when you are signed in we keep your account number and the report number in a separate record, apart from the review text. That record cannot tell which review is yours.',
        'Reviews are stored with Supabase in Seoul and used only to improve the service, never for advertising. Because a review is not linked to an account, we cannot find and delete a specific one later.',
      ],
    },
    {
      heading: 'Anonymous usage statistics',
      body: [
        'To see where people leave, which rooms they pay for, and what each reading costs us, the site records anonymous steps: which page or step was reached (for example the first screen, the birth form, the result, how far you got in the 40-question test and which type came out, whether you tapped a share button, a room, the payment window, a finished reading; never what you answered), how a room was reached (from the end of the free result, from your shrine, or directly), the room, the language, the two-letter country, any campaign tags in the link (utm), which site sent you here (the domain name of the previous site only, never the rest of its address), payment results and error codes, and how many AI tokens and how long a reading took.',
        'Each record carries a random code made for the browser tab, which disappears when the tab closes, so the records are not linked to you or your account. We never record your name, birth date, time or city, your question, your email, your account, or your IP address.',
        'These records are stored with Supabase in Seoul and kept for up to 2 years, then deleted. They are not used for advertising.',
      ],
    },
    {
      heading: 'Charms we send by Instagram DM',
      body: [
        'If you comment on one of our Instagram posts, we reply to that comment with a private message (DM) that holds one charm and a link to this site. If you don’t comment, we send nothing.',
        'To do this, Instagram (Meta) tells our server what you wrote and your Instagram account ID. We use them only to choose a charm and send the message. We do not save the comment, your name, or your Instagram account, and we do not put them in our logs.',
        'So we never send twice to the same person on the same post, we keep a one-way scrambled value (a hash) of the account, post, and person at Upstash (United States) for 8 days, then it is deleted automatically. It cannot be turned back into who you are.',
        'The message never includes your name or birth date. Please type your birth date on the site only, never in the chat.',
      ],
    },
    {
      heading: 'Why we use it',
      body: [
        'To write and deliver the readings you ask for, to take payment for them, and to handle refunds and questions.',
        'To email you when paid readings open and offer you the launch price. To give you your regular number. To understand, in aggregate, which links and videos bring people here.',
        'We do not sell your personal information, and we do not show advertising on the site. Only when you arrive by tapping one of our Instagram or Facebook ads do we send Meta the information described under Cookies and trackers, to measure those ads and show them to people more likely to find them useful.',
      ],
    },
    {
      heading: 'Who else sees it',
      body: [
        'We do not give your personal information to anyone else. These service providers process it on our behalf, only for the jobs listed:',
        'Vercel Inc.: hosting the site and its servers. Supabase Inc.: sign-in and storing accounts, saved people, and readings. Google LLC (the Gemini API): writing paid room readings and one-on-one chat replies from the calculated chart and question. Upstash, Inc.: storing the email list. Toss Payments Co., Ltd.: processing card and easy-pay payments in Korean won. PortOne (Korea PortOne Co., Ltd.), NHN KCP Corp., Kakao Pay Corp. and Viva Republica Inc. (Toss Pay): processing payments in Korean won through PortOne. Dodo Payments: selling paid readings in other currencies as our merchant of record.',
        'Sign-in providers (Google, Kakao, Naver, LINE) only confirm who you are when you choose them; we do not send them your readings.',
      ],
    },
    {
      heading: 'Transfers outside Korea',
      body: [
        'Some of these providers handle data outside Korea. Vercel Inc. (United States) receives every request your browser makes to the site, including the calculated chart and question when you start a room reading, as you use the site, to host it. Google LLC (United States) receives the calculated chart and question (for chat, plus the last few lines of the conversation) over an encrypted connection when a room reading is written or a chat reply is needed, to write it, and keeps it only as its Gemini API terms allow. Upstash, Inc. (United States) stores your email address and the details you gave when you joined the list, until it is deleted as described below. Dodo Payments receives the order and payment details for purchases in currencies other than Korean won, to sell and refund them, and keeps them as its own policy and the law require. Meta Platforms, Inc. (United States) receives the information described under Cookies and trackers, only when you arrive from one of our Instagram or Facebook ads, to measure those ads, and keeps it under Meta’s own data policy.',
        'If you do not want your data to leave Korea, please do not start a room reading or join the list. The free first reading is calculated in your browser and does not send your birth details anywhere.',
      ],
    },
    {
      heading: 'Where your data is stored',
      body: [
        'Accounts, saved people, readings, and payment records are stored with Supabase in Seoul, Korea. The email list is stored with Upstash in the United States. Server logs stay with Vercel.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'We keep your email until you unsubscribe or ask us to delete it, and no longer than 12 months after paid readings open.',
        'We keep your saved people and readings until you delete them or your account.',
        'We keep payment records for five years and records of complaints and disputes for three years, as Korean e-commerce law requires. When a period ends, we delete the data so it cannot be recovered.',
      ],
    },
    {
      heading: 'Your choices',
      body: [
        'Every email we send will have an unsubscribe link. You can also ask us to delete your email, or to tell you what we hold about you.',
        'If you sign in, you can delete saved people in My people and readings in My readings yourself. To delete your whole account, write to us at the contact below. (A delete button is on the way.)',
        'You can ask us to show, correct, delete, or stop processing your information at any time. Depending on where you live (for example, the EU, the UK, or California), you may have additional rights; write to us and we will help.',
        'In Korea you can also contact the Personal Information Infringement Report Center (privacy.kisa.or.kr, 118) or the Personal Information Dispute Mediation Committee (kopico.go.kr, 1833-6972).',
      ],
    },
    {
      heading: 'Cookies and trackers',
      body: [
        'If you sign in, a cookie keeps you signed in.',
        'Meta pixel: we turn it on only in a tab you opened by tapping one of our Instagram or Facebook ads (the link carries an ad marker). Visits that did not come from an ad never load it. When it is on, Meta cookies (_fbp, and _fbc for the ad click) stay in your browser for up to 90 days, and Meta receives how far you got (whether you viewed a room or a free reading, opened checkout, or paid), the product name, the amount and currency, the order number, and your browser type. Because the pixel script loads from Meta’s servers, Meta also receives your IP address directly. We never send your name, birth details, worries, email, or sign-in details.',
        'If you would rather not, clear or block cookies in your browser. If you have a Meta account, you can also turn off ads based on activity from other websites in Meta’s ad settings. Write to us and we will help.',
        'We also set a small cookie holding only the country you are visiting from, as a two-letter code such as KR, which our host works out from your connection. It is used only to choose the language the site starts in, and lasts 30 days. A language you pick yourself always comes first.',
      ],
    },
    {
      heading: 'Age',
      body: [
        'DANGOL is for people who are 18 or older. We do not knowingly collect information from anyone younger. If you think we have, tell us and we will delete it.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'If we change this policy, we will update the date at the top. If a change affects how we use your email, we will tell you by email before it takes effect.',
      ],
    },
    {
      heading: 'Contact',
      body: [
        `Operator: ${OPERATOR}. Our privacy officer is ${B.owner}, at ${B.email}. Write to us there to see, correct, or delete what we hold about you. We will reply within 10 days.`,
      ],
    },
  ],
};

const terms: LegalDoc = {
  title: 'Terms of Use',
  updated: POLICY_UPDATED,
  sections: [
    {
      heading: 'Who this is for',
      body: [
        'DANGOL is for people who are 18 or older. If you are younger, please come back when you are.',
      ],
    },
    {
      heading: 'What DANGOL is',
      body: [
        'DANGOL is offered for entertainment and amusement only. Fictional characters guide you through webtoon readings based on saju, a traditional Korean birth-chart system. A reading is an interpretation, not a fact and not a prediction of your future. If it gives you something to think about, that’s a bonus.',
      ],
    },
    {
      heading: 'Yul is fictional',
      body: [
        "Yul, Sogeum, and the keepers of the inner rooms are fictional characters created for DANGOL. There is no real shaman reading your chart.",
        'The free reading uses lines written in advance and selected from your calculated chart. Paid room readings are written fresh from your calculated chart and any question you enter, using generative AI, so they can contain errors. What is sent and who processes it is described in the Privacy Policy.',
      ],
    },
    {
      heading: 'Not professional advice',
      body: [
        'Nothing on DANGOL is medical, mental health, legal, financial, or investment advice. Please do not make decisions about your health, money, legal matters, or safety because of a reading.',
        "If you’re having a hard time, please reach out to a professional or someone you trust. The list of things Yul won’t read is on the Things I won’t read page.",
      ],
    },
    {
      heading: 'Paid readings and prices',
      body: [
        'Each inner room sells one reading, written once for the chart and question you give. It is digital content shown on screen, not points, credits, or a subscription.',
        'Service period: available right after payment. The reading is written on the same screen within about 2 to 5 minutes.',
        'The price is shown on the room page and again at checkout before you pay, and you are charged the amount shown. Prices in Korean won include VAT.',
        'Payments in Korean won are processed by Toss Payments (credit and debit cards, and easy pay) or, through PortOne, by NHN KCP, Kakao Pay or Toss Pay. Payments in other currencies are processed by Dodo Payments as our reseller and merchant of record, and its checkout shows any tax that applies where you live.',
        'The five-room bundle, the pick-3 bundle and the first-purchase price stopped being sold on November 16, 2026. Readings you already bought and lanterns added with a bundle can still be used, and refunds follow the refund policy.',
        'For a room that is not open yet, leaving your email only asks us to tell you when it opens. No payment is taken for an email reservation, a reservation is not a purchase, and planned prices may change before a room opens.',
      ],
    },
    {
      heading: 'Cancellations and refunds',
      body: [
        'A reading starts being written as soon as your payment is confirmed. Because it is digital content, you cannot withdraw from the purchase once writing has started (Article 17(2)5 of the Korean Act on the Consumer Protection in Electronic Commerce). We tell you this before you pay and ask you to agree.',
        'If you paid but writing never started, or an error on our side stops the reading, we will write it again or refund the full amount. The details are on the Refund Policy page.',
      ],
    },
    {
      heading: 'Using the site',
      body: [
        'Please use DANGOL for yourself and in good faith. Please do not scrape it, flood it with automated requests or fake sign-ups, or use it to harass anyone.',
        'You are welcome to share your own result card and share link.',
      ],
    },
    {
      heading: 'Our content',
      body: [
        'The characters, art, writing, and design of DANGOL belong to us or our licensors. Please do not copy the site, the artwork, or the text of the readings for other uses without asking first.',
      ],
    },
    {
      heading: 'No guarantees',
      body: [
        'We do our best, but DANGOL is provided “as is” and “as available.” Schools of saju differ on some points, and the site may contain mistakes or be unavailable at times.',
      ],
    },
    {
      heading: 'Limits of liability',
      body: [
        'To the extent the law allows, we are not responsible for decisions you make because of a reading, or for indirect losses that come from using the site. Nothing here limits any right you have by law that cannot be waived.',
      ],
    },
    {
      heading: 'If we change or close the site',
      body: [
        'We may change, pause, or close DANGOL, and we may block anyone who misuses it. If we close the list, we will delete the emails on it.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'We may update these terms. We post the new version and the date it takes effect on the site at least 7 days before it applies, or 30 days before if the change is worse for you. The date at the top shows when they last changed. If you keep using DANGOL after a change takes effect, that means you accept the new version.',
      ],
    },
    {
      heading: 'Who we are, and which law applies',
      body: [
        `Operator: ${OPERATOR}. Contact: ${B.email}. The full business details are at the bottom of every page.`,
        'These terms are governed by the laws of the Republic of Korea. Disputes go to the court with jurisdiction under the Korean Civil Procedure Act, unless the law where you live gives you the right to bring them elsewhere.',
      ],
    },
  ],
};

const refund: LegalDoc = {
  title: 'Refund Policy',
  updated: POLICY_UPDATED,
  sections: [
    {
      heading: 'What you are buying',
      body: [
        'Each paid room gives you one reading, written once for the chart and question you give. It is digital content shown on screen right after payment, and it is saved in My readings if you are signed in. It is not points, credits, or a subscription.',
        'Service period: available right after payment (writing takes about 2 to 5 minutes).',
      ],
    },
    {
      heading: 'Before writing starts',
      body: [
        'If you paid but the reading never started being written, for example because the page closed first, write to us within 7 days of payment and we will refund the full amount.',
      ],
    },
    {
      heading: 'After writing starts',
      body: [
        'Writing starts as soon as your payment is confirmed. From then on, Korean law lets us limit cancellation of digital content (Article 17(2)5 of the Korean Act on the Consumer Protection in Electronic Commerce). We tell you this before you pay and ask you to agree.',
        'So once writing has started, we do not refund because you changed your mind or because a reading did not feel right. Readings are interpretations offered for entertainment.',
      ],
    },
    {
      heading: 'The five-room bundle (no longer sold, if you already bought it)',
      body: [
        'The bundle gives you one reading in each of the five rooms for one payment, with 15 lanterns added to your account. For Muk’s compatibility room, writing starts after you pay and add the other person.',
        'Before writing starts, write to us within 7 days of payment and we will refund the full amount. We then take back whatever is left of the 15 lanterns we added with this bundle.',
        'Once writing has started, we do not refund because you changed your mind (the same as “After writing starts” above). If an error on our side stops only some of the five readings, we will write those again at no cost, or refund the share for them if you prefer: the bundle price divided by five, which is US$1.58 for a US$7.90 bundle.',
        'Lanterns are a bonus for this purchase. They have no cash value and cannot be refunded or transferred.',
      ],
    },
    {
      heading: 'The pick-3 bundle and first-purchase price (no longer sold, if you already bought them)',
      body: [
        'A room bought at the first-purchase price is refunded under the same rules as any other single room (see “Before writing starts” and “After writing starts” above). If you are refunded your first purchase, the account can get the first-purchase price again.',
        'With the pick-3 bundle, once payment is confirmed you can start the three readings you chose. Before writing starts, write to us within 7 days of payment and we will refund the full amount. Once writing has started, we do not refund because you changed your mind. If an error on our side stops only some of the readings, we will write those again at no cost, or refund the share for them if you prefer: the bundle price divided by the number of readings in it. The pick-3 bundle does not include lanterns.',
      ],
    },
    {
      heading: 'If something goes wrong',
      body: [
        'If the reading stops partway, comes out incomplete, or never arrives because of an error on our side, we will write it again at no cost, or refund the full amount if you prefer.',
      ],
    },
    {
      heading: 'How refunds are paid',
      body: [
        'Refunds go back to the payment method you used. We cancel the payment within 3 business days of agreeing to the refund; your card company or bank may take a few more days to show it.',
        'Payments in currencies other than Korean won are refunded through Dodo Payments, our merchant of record.',
      ],
    },
    {
      heading: 'How to ask',
      body: [
        `Email ${B.email} with the date you paid, the room, and the order number if you have it. We will reply within 3 business days.`,
      ],
    },
  ],
};

const R = ROOMS_COPY;

const pricing: LegalDoc = {
  title: 'Pricing',
  updated: POLICY_UPDATED,
  sections: [
    {
      heading: 'What we sell',
      body: [
        'DANGOL is a digital content service. From the saju chart your browser calculates from your birth date, time and place, Yul writes an in-depth reading on the theme of the room you choose.',
        `There are five paid rooms. Each purchase is one reading in one room, written once for the chart and question you give, for ${R.price}. It is not points, credits, or a subscription, and the amount shown at checkout is the amount you pay.`,
        `The reunion reading is sold separately from the five rooms. One payment gives you one twelve-part reading written for the breakup details you choose and the two charts, plus the calendar and contact cards, for ${REUNION_PRICE_TEXT.en} (US dollars). It reads how the other person may feel after the breakup and where they stand on a reunion as an interpretation of the two charts, not a confirmed fact. It does not include their private actions, a new partner, whether they will return or on which day they will write, or any score or odds.`,
      ],
    },
    {
      heading: 'Free reading',
      body: [`${R.home.free.title}. ${R.home.free.gain}`, 'Price: free.'],
    },
    ...roomPriceSections(R, {
      heading: (title, keeper) => `${title} (read by ${keeper})`,
      covers: (titles) => `What it covers, in ${titles.length} parts: ${titles.join(', ')}.`,
      price: (price) => `Price: ${price} per reading.`,
    }),
    {
      heading: 'Prices in each language',
      body: [
        `The price follows the language you read in: ${R.price} in English (US dollars), ${ROOMS_KO.price} in Korean (Korean won, VAT included), ${ROOMS_JA.price} in Japanese (Japanese yen).`,
      ],
    },
    {
      heading: 'How you pay',
      body: [
        'Korean won: credit or debit card, or easy pay such as Toss Pay, through Toss Payments.',
        'US dollars and Japanese yen: card and the other methods shown at checkout, through Dodo Payments, our merchant of record. Any tax that applies where you live is shown at checkout.',
      ],
    },
    {
      heading: 'How you receive it',
      body: [
        'Service period: available right after payment. The reading is written within about 2 to 5 minutes.',
        'Nothing is shipped. Right after payment the reading starts being written on the same screen and is usually finished within a few minutes. If you are signed in, it is saved in My readings so you can open it again at any time.',
      ],
    },
    {
      heading: 'Cancellations and refunds',
      body: [
        'Before you pay, we ask you to agree to the refund terms. Once writing has started, cancellation is limited by law. If an error on our side stops the reading, we write it again or refund you. The details are on the Refund Policy page.',
      ],
    },
  ],
};

export const LEGAL: Record<'about' | 'wontRead' | 'privacy' | 'terms' | 'refund' | 'pricing', LegalDoc> = {
  about,
  wontRead,
  privacy,
  terms,
  refund,
  pricing,
};
