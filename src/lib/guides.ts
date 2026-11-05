/**
 * Long-form guides: original, editorial content written for the site.
 *
 * These exist because the rest of the site is short, anonymous, user-written
 * notes. Pages made of those alone read as thin to a reviewer, so the guides
 * give readers (and Google) substantial first-party writing on the same
 * subject: putting hard things into words.
 *
 * Kept as plain data rather than MDX so they render on the server with no new
 * dependencies. Text is plain strings; React escapes it. To add a guide, append
 * an entry. The index page, the article route, the sitemap and the related
 * links all read from this list.
 */

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string };

export interface Guide {
  slug: string;
  title: string;
  /** Meta description and the summary shown on the index. */
  description: string;
  /** ISO date (YYYY-MM-DD). */
  published: string;
  updated?: string;
  /** Short label shown above the title. */
  category: 'Writing' | 'Feelings' | 'Safety' | 'History';
  blocks: GuideBlock[];
}

export const GUIDES: Guide[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'how-to-write-a-letter-you-will-never-send',
    title: 'How to Write a Letter You Will Never Send',
    description:
      'Why unsent letters help, how to start one when you have no idea what to say, and what to do with it once it is written.',
    published: '2026-11-06',
    category: 'Writing',
    blocks: [
      {
        type: 'p',
        text: 'An unsent letter is a letter written to a real person, addressed to them honestly, and then deliberately not delivered. It sounds pointless. People who try it usually find the opposite: because nobody will read it, it is the one place where you can say exactly what you mean without managing anyone’s reaction.',
      },
      {
        type: 'p',
        text: 'Counsellors and grief workers have suggested this exercise for decades, and it is the idea Message in a Bottle is built on. You address a note to a name, you let it go, and you do not wait for a reply. This guide covers how to actually do it, including the part where you stare at a blank page.',
      },
      { type: 'h2', text: 'Why it works' },
      {
        type: 'p',
        text: 'Most of what we leave unsaid stays unsaid for a practical reason. The timing is wrong, the relationship is over, the person has died, or saying it out loud would cost more than it is worth. The feeling does not go away just because the conversation cannot happen. It loops.',
      },
      {
        type: 'p',
        text: 'Writing breaks the loop in a few ways. It forces a vague feeling into specific sentences, and specific sentences are easier to look at. It gives the feeling an ending: a last line, a full stop, a moment where you decide you are done. And it separates two things that usually come tangled together, which are knowing what you feel and deciding what to do about it. An unsent letter only asks for the first.',
      },
      { type: 'h2', text: 'Before you start' },
      {
        type: 'ul',
        items: [
          'Pick one person. A letter to “everyone who hurt me” goes nowhere. A letter to one name has a direction.',
          'Give yourself fifteen minutes, not an evening. A short limit makes it easier to begin and stops it turning into a rewrite of your whole life.',
          'Decide now that nobody will see it. If you are secretly drafting something you might send, you will write for their reaction, and the letter changes. That letter is worth writing too, but it is a different exercise.',
          'Write where you will not be interrupted. Phones are fine. Paper is fine. What matters is not having to explain to anyone what you are doing.',
        ],
      },
      { type: 'h2', text: 'A structure for when you are stuck' },
      {
        type: 'p',
        text: 'You do not need a structure. But if you sit down and nothing comes, these five movements cover what most unsent letters end up containing. Use them as prompts, in any order, and skip any that do not fit.',
      },
      {
        type: 'ol',
        items: [
          'Say why you are writing. “I am writing because I still think about the day you left” is enough. Naming the reason out loud often loosens everything else.',
          'Describe one specific memory. Not the whole relationship. One afternoon, one argument, one thing they said. Details carry feeling better than summaries do.',
          'Say what it did to you. This is the part people skip. Not what they did, but what changed in you because of it.',
          'Say the thing you never said. The apology, the thank-you, the accusation, the “I loved you more than I let on.” Write it plainly, even if it looks harsh or sentimental on the page.',
          'End it. Decide how you want to leave things: forgiveness, a goodbye, a wish for them, or simply “that is all I needed to say.” The ending does not have to be generous. It has to be yours.',
        ],
      },
      { type: 'h2', text: 'What to leave out' },
      {
        type: 'p',
        text: 'Because an unsent letter is private by design, you can write anything. If you publish it somewhere, even anonymously, that changes. On a public site like this one, leave out surnames, addresses, workplaces, school names, phone numbers and anything that would let a stranger work out who either of you is. The feeling survives without them. A first name and the truth is plenty.',
      },
      {
        type: 'p',
        text: 'It is also worth leaving out threats, even ones you would never act on. On paper in a drawer, anger is just anger. Posted in public, it can frighten someone, and it is not allowed here.',
      },
      { type: 'h2', text: 'After it is written' },
      {
        type: 'p',
        text: 'People do different things with finished letters, and there is no correct one. Some keep them and reread them a year later to see how far they have come. Some destroy them as a way of marking an ending. Some put them somewhere public and anonymous, like a bottle in the sea, because a letter that exists out in the world feels more finished than one hidden in a notes app.',
      },
      {
        type: 'p',
        text: 'If you notice that writing the letter made you want to actually talk to the person, take that seriously, but give it a day. The letter has done its job either way. Sending a real message is a separate decision, and it deserves a calmer version of you than the one who just finished writing.',
      },
      { type: 'h2', text: 'If it brings up more than you expected' },
      {
        type: 'p',
        text: 'Writing about a loss or an old hurt can stir up more than you planned for. That is normal and usually passes within a day or so. If it does not, or if what you are writing about involves abuse, self-harm or thoughts of ending your life, please talk to someone who can actually respond: a friend, a doctor, or a local crisis line. A letter is good at helping you understand a feeling. It is not a substitute for a person.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'anonymous-message-writing-prompts',
    title: '60 Prompts for an Anonymous Message',
    description:
      'Sixty writing prompts for anonymous notes, grouped by what you are trying to say: thanks, apology, love, goodbye, encouragement and more.',
    published: '2026-11-06',
    category: 'Writing',
    blocks: [
      {
        type: 'p',
        text: 'Most people who open a blank message box already know who they want to write to. What they do not know is how to begin. These prompts are first lines and starting questions, grouped by the kind of message you are trying to write. Take one, change it until it sounds like you, and keep going.',
      },
      {
        type: 'p',
        text: 'A note on using them here: every message on Message in a Bottle is public and filed under a first name. Write to the person, but write knowing that strangers may read it, and leave out anything that would identify either of you.',
      },
      { type: 'h2', text: 'To say thank you' },
      {
        type: 'ul',
        items: [
          'You probably do not remember the day you…',
          'I never told you that what you said to me in … stayed with me.',
          'The smallest thing you did for me was…, and it was not small to me.',
          'I think about you every time I…',
          'If you ever wondered whether it mattered, it did.',
          'I became a little more like you, and I am glad.',
          'Thank you for not giving up on me when…',
          'You were kind to me at a time when I had nothing to give back.',
          'I still use the advice you gave me about…',
          'Someone should tell you this, so I will: you made a difference.',
        ],
      },
      { type: 'h2', text: 'To say sorry' },
      {
        type: 'ul',
        items: [
          'I have rewritten this apology many times in my head. Here is the honest version.',
          'I was wrong about…, and I knew it at the time.',
          'I am sorry I made you feel like…',
          'I did not have the words then. I think I have some now.',
          'I do not expect anything back. I just did not want you to go on thinking I did not care.',
          'What I should have said instead was…',
          'I blamed you for something that was mine.',
          'I am sorry I disappeared.',
          'If I could redo one day with you, it would be…',
          'I understand now why you were hurt.',
        ],
      },
      { type: 'h2', text: 'To say what you feel' },
      {
        type: 'ul',
        items: [
          'I have never told anyone this, including you.',
          'You walk into a room and…',
          'I notice the way you…',
          'I do not need you to feel the same. I just needed to say it once.',
          'The first time I realised was when…',
          'I am writing this because I am too scared to say it to your face.',
          'There is a version of me that only shows up around you.',
          'You will never know how many times I nearly said something.',
          'If timing were different, I would have asked you…',
          'You are the reason I…',
        ],
      },
      { type: 'h2', text: 'To say goodbye' },
      {
        type: 'ul',
        items: [
          'I am letting go of the version of us that…',
          'I hope wherever you are now, you…',
          'This is the last thing I will write to you.',
          'I forgive you for…, and I forgive myself for…',
          'What I want to remember about you is…',
          'I stopped waiting for you to…',
          'Thank you for the part of my life you were in.',
          'I do not hate you. I just do not need you any more.',
          'If we pass each other one day, I hope we both smile.',
          'Goodbye, and I mean it kindly.',
        ],
      },
      { type: 'h2', text: 'To someone who has died' },
      {
        type: 'ul',
        items: [
          'Here is what has happened since you have been gone.',
          'I heard a song today that you would have…',
          'I still have your…',
          'I wish I had asked you about…',
          'The thing I miss most is not the big moments. It is…',
          'I am doing the thing you always told me to do.',
          'Something funny happened and you were the first person I wanted to tell.',
          'I am sorry I was not there when…',
          'You would be proud, I think, of…',
          'I talk about you so people will not forget.',
        ],
      },
      { type: 'h2', text: 'To lift someone up' },
      {
        type: 'ul',
        items: [
          'You are doing better than you think you are.',
          'I see how hard you are trying.',
          'Here is something true about you that you probably forget: …',
          'The world is better with you in it. That is not a cliché, it is a fact.',
          'You do not have to have it figured out yet.',
          'Remember the time you…? You can do it again.',
          'Rest is not the same as giving up.',
          'Someone you do not even know is rooting for you.',
          'You were never too much. They were not enough.',
          'Whatever today was, tomorrow is a new page.',
        ],
      },
      { type: 'h2', text: 'How to turn a prompt into a message' },
      {
        type: 'ol',
        items: [
          'Pick the prompt that makes you hesitate. The one you want to skip is usually the one with something behind it.',
          'Finish the sentence without stopping to edit.',
          'Add one specific detail: a place, a season, a phrase they used. Specifics make a short note feel real.',
          'Read it once and remove anything that would identify a real person to a stranger, such as a surname, a school or a workplace.',
          'End with the line you would want them to remember if they read only that.',
        ],
      },
      {
        type: 'p',
        text: 'Short is fine. Some of the best notes in the ocean are two sentences long. What makes a message land is not the length but the moment it is clear the writer meant it.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'writing-a-letter-to-someone-who-has-died',
    title: 'Writing a Letter to Someone Who Has Died',
    description:
      'A gentle, practical guide to writing to a person you have lost: what to write about, how to begin, and what people often find afterwards.',
    published: '2026-11-06',
    category: 'Feelings',
    blocks: [
      {
        type: 'p',
        text: 'Grief leaves a lot unfinished. There are conversations that were cut off, questions you never asked and ordinary news you still reach for your phone to share. Writing a letter to someone who has died will not change any of that. What it can do is give those unfinished things somewhere to go.',
      },
      {
        type: 'p',
        text: 'Many people write these letters, often without telling anyone. Grief counsellors sometimes suggest them, and they turn up in support groups, memorial traditions and private journals all over the world. There is no right way to do it, but there are a few things that tend to help.',
      },
      { type: 'h2', text: 'You can write at any point' },
      {
        type: 'p',
        text: 'Some people write a letter in the first raw week. Others wait years, until an anniversary, a birthday, or a moment when something reminds them out of nowhere. There is no deadline and no point at which it becomes too late. If you are reading this and thinking of someone, now is a perfectly good time.',
      },
      { type: 'h2', text: 'Things people write about' },
      {
        type: 'ul',
        items: [
          'News. What has happened since they died: a new job, a wedding, a grandchild, the dog getting old. Many people find this the easiest place to start because it is how they would have talked anyway.',
          'A specific memory. Not a eulogy, just one scene. The kitchen on a Sunday, a car journey, a joke only the two of you understood.',
          'What you never got to say. Thank you, I am sorry, I forgive you, I wish I had visited more, I love you. These are often the reason the letter needs to exist at all.',
          'Questions. What was it like when you were my age? Were you scared? Did you know? You will not get answers, but asking can still feel like part of the relationship.',
          'Anger, if it is there. Grief is not only sadness. It is fine to be furious at someone for leaving, for how they left, or for things that were never resolved.',
          'How you are carrying them. The recipe you still cook, the phrase you still use, the way you now do something because they did.',
        ],
      },
      { type: 'h2', text: 'If you do not know how to begin' },
      {
        type: 'p',
        text: 'Write their name, and then write the first ordinary thing you would have said if they had walked into the room. “Hi Dad.” “You will not believe what happened today.” “I miss you.” The formality of the first line is often what stops people, and it does not need any.',
      },
      {
        type: 'p',
        text: 'If that does not work, try finishing one of these sentences: “The last time I saw you…”, “I keep thinking about…”, “Since you have been gone…”, or “I wish you knew…”.',
      },
      { type: 'h2', text: 'Let it be messy' },
      {
        type: 'p',
        text: 'This is not a speech, and nobody is marking it. It is fine if the letter jumps from a memory to an apology to what you had for lunch. It is fine if you cry halfway through and stop. It is fine if it is two lines long. You can always come back and write another one; many people end up writing several over the years, and reading the old ones back can show how grief has changed shape.',
      },
      { type: 'h2', text: 'Writing it somewhere public' },
      {
        type: 'p',
        text: 'Some people want their letter to exist somewhere outside their own head, and an anonymous public place can feel right for that. It is part of why people leave notes at graves, tie ribbons to bridges or float lanterns on water. If you write one on Message in a Bottle, it will be filed under the first name you choose and anyone can read it. Many readers find comfort in finding letters to strangers that sound exactly like their own grief.',
      },
      {
        type: 'p',
        text: 'If you do share it, keep other living people’s details out of it. Family grief is complicated, and a public letter that names a sibling or a partner can hurt in ways you did not intend.',
      },
      { type: 'h2', text: 'What people often notice afterwards' },
      {
        type: 'p',
        text: 'People commonly describe feeling tired after writing, sometimes lighter, sometimes both. Some find that a thought that kept circling has gone quiet. Others find the letter opened something up and they need a few days. Both are normal responses to looking directly at a loss.',
      },
      {
        type: 'p',
        text: 'If your grief feels like it is getting heavier rather than changing over time, or you are struggling to get through ordinary days, please reach out to someone: a doctor, a counsellor, a bereavement support service, or a crisis line if you are in danger. Writing helps a lot of people. It works best alongside other people, not instead of them.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'how-to-write-an-apology-letter',
    title: 'How to Write an Apology That Actually Lands',
    description:
      'The parts of a real apology, the phrases that quietly undo it, and how to apologise in writing when you cannot do it face to face.',
    published: '2026-11-06',
    category: 'Feelings',
    blocks: [
      {
        type: 'p',
        text: 'A lot of apologies fail not because the person is not sorry, but because the words get in the way. They explain too much, they shift a little of the blame back, or they ask for forgiveness so quickly that the other person feels rushed. A written apology has an advantage here: you can take your time and get it right.',
      },
      {
        type: 'p',
        text: 'This guide covers what a sincere apology contains, what tends to undermine one, and how to handle the cases where you cannot or should not deliver it at all.',
      },
      { type: 'h2', text: 'The four parts of a real apology' },
      {
        type: 'ol',
        items: [
          'Name what you did, specifically. “I am sorry for what happened” is vague and passive. “I am sorry I told your friends what you had told me in confidence” is an apology. Being specific shows you understand exactly what went wrong.',
          'Acknowledge the effect on them. Not how you felt while doing it, but what it meant for the other person: “It made you feel like you could not trust me, and you had every reason to.”',
          'Take responsibility without conditions. The apology ends at the full stop. It is not followed by “but” and an explanation of your side.',
          'Say what changes. What you will do differently, or what you have already done. If there is nothing you can repair, say what you have learned.',
        ],
      },
      { type: 'h2', text: 'Phrases that quietly undo an apology' },
      {
        type: 'ul',
        items: [
          '“I am sorry if you were hurt.” The “if” suggests they might be overreacting. Try “I am sorry I hurt you.”',
          '“I am sorry you feel that way.” This apologises for their feelings, not for your actions.',
          '“I am sorry, but…” Everything after “but” is what they will remember.',
          '“Mistakes were made.” This avoids saying who made them.',
          '“I was just joking” or “I did not mean it like that.” Intent matters, but leading with it centres you rather than them.',
          '“Can we just move past this?” Asking for closure on your timetable puts pressure on them to forgive before they are ready.',
        ],
      },
      { type: 'h2', text: 'Should you explain why?' },
      {
        type: 'p',
        text: 'Sometimes context genuinely helps, for example if the other person has been left wondering whether you did something on purpose. If you include it, keep it short, put it after the apology rather than before it, and make sure it explains rather than excuses. A good test is to ask yourself whether the explanation is there to help them understand, or to make you look better. If it is the second, cut it.',
      },
      { type: 'h2', text: 'Do not ask for anything back' },
      {
        type: 'p',
        text: 'An apology is something you give, not a trade. It may be accepted immediately, slowly or never, and the person is entitled to any of those. Ending with “I do not expect a reply, but I wanted you to know” takes pressure off both of you. If they do want to talk, they will.',
      },
      { type: 'h2', text: 'When you cannot deliver it' },
      {
        type: 'p',
        text: 'Sometimes the right person to apologise to is out of reach. They may have died, cut contact, or asked not to hear from you. If someone has asked you not to contact them, the most respectful apology is honouring that request, even though it means they never hear the words.',
      },
      {
        type: 'p',
        text: 'Writing the apology anyway, without sending it, still has value. It helps you understand what you did and what you would do differently, which is most of what an apology is for on your side. Some people keep these letters private. Others release them anonymously, in a place like this one, as a way of putting the words somewhere real without reaching into someone else’s life.',
      },
      {
        type: 'p',
        text: 'If you do post it publicly, write it so that it could not identify the person. An apology that can be traced back to them can reopen exactly the hurt you are sorry for.',
      },
      { type: 'h2', text: 'A short example' },
      {
        type: 'quote',
        text: 'Jamie — I am sorry I did not come to your graduation. I told myself work was the reason, but the truth is I was jealous, and I let that win on a day that should have been yours. I know you noticed, and I know it made you feel like you did not matter to me. You do. I have no excuse that makes it better, and I am not asking you to forgive it. I just did not want you to keep thinking I did not care.',
      },
      {
        type: 'p',
        text: 'It is specific, it names the effect, it takes responsibility, and it does not ask for anything. It is also short. Most good apologies are.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'writing-anonymously-safely-and-kindly',
    title: 'Writing Anonymously, Safely and Kindly',
    description:
      'What anonymity on a public site does and does not protect, what to leave out of a message, and how to write honestly without hurting anyone.',
    published: '2026-11-06',
    category: 'Safety',
    blocks: [
      {
        type: 'p',
        text: 'Anonymity is what makes it possible for people here to say things they could not otherwise say. It is also easy to misunderstand. This guide explains what being anonymous on Message in a Bottle actually means, how to protect yourself and the person you are writing to, and where the line sits between honest and harmful.',
      },
      { type: 'h2', text: 'What anonymous means here' },
      {
        type: 'ul',
        items: [
          'Readers never see who wrote a message. There is no username, profile picture or signature on a note.',
          'Every message is public. Writing to a name does not send anything to that person and does not hide the note from anyone else. Anyone can open any bottle.',
          'Your own words can identify you. Anonymity removes your name from the message, not from what you write in it. A detail only you and one other person know is a signature of its own.',
          'Anonymous is not untraceable. Like every website, this one keeps the minimum technical records needed to run and protect the service, and serious illegal content can be reported to the authorities. Our privacy policy explains exactly what is stored.',
        ],
      },
      { type: 'h2', text: 'What to leave out' },
      {
        type: 'p',
        text: 'Before posting, read your message as a stranger would, and remove anything that would let them identify a real person, including you:',
      },
      {
        type: 'ul',
        items: [
          'Surnames, nicknames that are unique to someone, and usernames or social media handles.',
          'Addresses, schools, workplaces, team names and specific locations.',
          'Phone numbers, email addresses and links to personal accounts.',
          'Photos or descriptions that make someone recognisable.',
          'Other people’s secrets: health conditions, sexuality, immigration status or anything told to you in confidence.',
        ],
      },
      {
        type: 'p',
        text: 'A first name is enough. There are thousands of Sams and Marias in the ocean, and that is part of what makes it safe to write to one of them.',
      },
      { type: 'h2', text: 'Honest is not the same as cruel' },
      {
        type: 'p',
        text: 'You are allowed to be angry here. You are allowed to write that someone hurt you and that you are not ready to forgive them. What is not allowed, and what this site removes, is writing aimed at hurting someone: harassment, threats, hate speech, other people’s private information or intimate images, impersonation, and anything sexual involving minors.',
      },
      {
        type: 'p',
        text: 'A useful test is to ask what the message is for. A message written to get something off your chest is about you and your feelings. A message written so that the other person, or people who know them, will find it and feel humiliated is about them, and that is where it stops being okay.',
      },
      { type: 'h2', text: 'Before you press send' },
      {
        type: 'ol',
        items: [
          'Wait a few minutes if you are very upset. Drafts are saved on your device, so you will not lose your words.',
          'Read it back once as the person you are writing to, and once as a stranger.',
          'Remove identifying details.',
          'Ask whether you would be comfortable if the person found it. If you would not, consider whether it should be public at all.',
          'Remember that messages sent without an account cannot be edited or deleted by you later. Sign in first if you might want to.',
        ],
      },
      { type: 'h2', text: 'If you find a message about you' },
      {
        type: 'p',
        text: 'If a message identifies you, shares your private information or makes you feel unsafe, you do not need an account or proof of identity to have it looked at. Use the Report button on the message, or write to us through the contact page. Reports go directly to the person who runs the site, and messages that break the rules are removed.',
      },
      {
        type: 'p',
        text: 'If someone is threatening you or you believe you are in danger, contact your local police as well. A website can take a message down; it cannot keep you safe offline.',
      },
      { type: 'h2', text: 'Being a kind reader' },
      {
        type: 'p',
        text: 'Most of what is in the ocean is people at a vulnerable moment: grieving, in love, apologising, saying goodbye. If you share a message you found, share the link rather than a screenshot that strips it of context, and never try to work out who wrote it or who it is about. The whole place only works because people trust that nobody will.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'a-short-history-of-messages-in-bottles',
    title: 'A Short History of Messages in Bottles',
    description:
      'From ancient experiments with ocean currents to scientific drift studies and letters found a century later, how the message in a bottle became a symbol.',
    published: '2026-11-06',
    category: 'History',
    blocks: [
      {
        type: 'p',
        text: 'Putting a note in a bottle and giving it to the sea is one of the oldest ways of writing to someone you will never meet. It has been a scientific tool, a last resort for sailors, a lonely-hearts advert and a symbol in countless songs and novels. This site borrows the idea, so it seemed worth telling a little of where it comes from.',
      },
      { type: 'h2', text: 'Experiments with the sea' },
      {
        type: 'p',
        text: 'One of the earliest stories, repeated in many histories of the subject, credits the Greek philosopher Theophrastus, a student of Aristotle, with throwing sealed bottles into the sea around 300 BC to test whether the Mediterranean was fed by the Atlantic. Whether or not every detail is accurate, the idea behind it is the one that kept bottles in the water for the next two thousand years: if you know where a bottle went in and where it came out, you have learned something about the water in between.',
      },
      { type: 'h2', text: 'Drift bottles and ocean science' },
      {
        type: 'p',
        text: 'By the nineteenth and twentieth centuries, oceanographers were releasing bottles deliberately, in large numbers. Each contained a form asking the finder to note where and when it was found and to post it back. These “drift bottles” were a cheap way to map surface currents long before satellites and GPS buoys existed, and researchers in several countries released many thousands of them.',
      },
      {
        type: 'p',
        text: 'Most were never seen again. The ones that were found built up a slow, patchy picture of how water moves around coastlines and across oceans. The method was imprecise, since you only know a bottle’s start and end, not its path, but it worked well enough to stay in use for a very long time.',
      },
      { type: 'h2', text: 'A message a century late' },
      {
        type: 'p',
        text: 'Because a bottle can survive for decades, some turn up long after anyone expected them to. In 2018, a family walking on a beach in Western Australia found an old gin bottle containing a rolled-up note. Researchers matched it to a drift experiment run by a German naval observatory and dated it to 1886. It was recognised at the time as the oldest known message in a bottle ever found: more than 130 years between someone letting go of it and someone else picking it up.',
      },
      {
        type: 'p',
        text: 'That gap is a large part of the romance. The person who wrote a bottle note almost never learns who read it. The person who finds it is reading something not meant for them in particular, from a stranger who may have been gone for a lifetime.',
      },
      { type: 'h2', text: 'From science to sentiment' },
      {
        type: 'p',
        text: 'Alongside the scientific bottles there have always been personal ones: notes from sailors, letters from people hoping a stranger would write back, farewells, prayers, and messages from children who just wanted to see how far a bottle could go. Over time, the image of a lone note crossing an ocean became shorthand for a particular kind of hope, the hope of being heard by someone you cannot reach directly.',
      },
      {
        type: 'p',
        text: 'Novels, films and songs have used the image for the same reason. A message in a bottle is uncertain by nature. You do not know if it will be found, who will find it, or what they will make of it. Sending one anyway is an act of trust.',
      },
      { type: 'h2', text: 'Please do not throw real bottles in the sea' },
      {
        type: 'p',
        text: 'For all its romance, a real bottle in the ocean today is litter. Glass can break on beaches and injure people and animals, plastic bottles break down into microplastics, and many coastal areas forbid releasing anything into the water. Researchers now use purpose-built drifters with satellite trackers instead. If you want to send something out into the world for a stranger to find, a digital bottle keeps the idea and leaves the sea alone.',
      },
      { type: 'h2', text: 'The idea, carried on' },
      {
        type: 'p',
        text: 'Message in a Bottle keeps the parts of the tradition that matter, which are the letting go, the uncertainty and the stranger on the other shore, and drops the parts that do not. You write to a name and you let it drift. Someone, someday, may open it. That has always been the point.',
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Rough reading time at 220 words per minute, never below one minute. */
export function readingMinutes(guide: Guide): number {
  const words = guide.blocks
    .flatMap((b) => ('items' in b ? b.items : [b.text]))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatGuideDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
