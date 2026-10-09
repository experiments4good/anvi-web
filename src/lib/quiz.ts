// The twenty quiz questions, copied verbatim from the app
// (anvi-expo src/content/quiz.ts, from anvi_quiz_20.md). Answer order is
// vata, pitta, kapha on every question and each answer adds one to that
// dosha; the quiz page shuffles the display order, as the app does.
// tests/quiz.parity.test.ts checks this file against the app's.

export interface QuizQuestion {
  question: string;
  hint: string;
  /** Three answers in vata, pitta, kapha order. */
  answers: readonly [string, string, string];
}

export const QUIZ: readonly QuizQuestion[] = [
  // Body
  {
    question: 'My build is',
    hint: 'Think about your natural frame over your life, not this year.',
    answers: [
      'Slim and light. I find it hard to put on weight.',
      'Medium and athletic. My weight stays fairly steady.',
      'Solid and sturdy. I gain weight easily and lose it slowly.',
    ],
  },
  {
    question: 'My skin tends to be',
    hint: 'How it is most of the time, without products.',
    answers: [
      'Dry, thin, or rough, and cool to the touch.',
      'Warm, slightly oily, and prone to redness or breakouts.',
      'Thick, smooth, and moist, and cool to the touch.',
    ],
  },
  {
    question: 'My hair is',
    hint: 'Its natural texture.',
    answers: ['Dry, thin, or frizzy.', 'Fine, straight, and thins or greys early.', 'Thick, wavy or curly, and oily.'],
  },
  {
    question: 'My hands and feet are usually',
    hint: 'In a normal room, not after exercise.',
    answers: ['Cold, and my joints crack.', 'Warm, and my palms may sweat.', 'Cool and slightly damp.'],
  },
  {
    question: 'In hot or cold weather',
    hint: 'Which you would rather avoid.',
    answers: [
      'I feel the cold first and love warmth and sun.',
      'Heat gets to me fast. I do best when it is cool.',
      'I handle both, but damp cold drags me down.',
    ],
  },
  // Digestion and appetite
  {
    question: 'My appetite is',
    hint: 'On an ordinary day.',
    answers: [
      'Unpredictable. Sometimes I forget to eat, sometimes I am ravenous.',
      'Strong and regular. I get irritable if I miss a meal.',
      'Steady but mild. I can skip a meal without much trouble.',
    ],
  },
  {
    question: 'My digestion is',
    hint: 'After a normal meal.',
    answers: [
      'Irregular, with gas or bloating.',
      'Quick and strong, sometimes with heartburn or loose stools.',
      'Slow and heavy. I feel full for a long time.',
    ],
  },
  {
    question: 'My thirst is',
    hint: 'Without reminding yourself.',
    answers: ['Variable. I forget to drink.', 'Strong. I drink a lot, especially cold drinks.', 'Low. I rarely feel thirsty.'],
  },
  {
    question: 'Eating late or eating heavily',
    hint: 'What your body does with a big dinner.',
    answers: ['Leaves me gassy or restless.', 'Sits fine. I can eat almost anything.', 'Leaves me sluggish the next morning.'],
  },
  // Energy and sleep
  {
    question: 'My energy through the day',
    hint: 'The usual pattern, not your best day.',
    answers: [
      'Comes in bursts, then I crash.',
      'Is strong and focused, and I push until I burn out.',
      'Is steady and slow to start, but lasts.',
    ],
  },
  {
    question: 'My sleep is',
    hint: 'Most nights.',
    answers: [
      'Light and easily disturbed. I wake often.',
      'Moderate. I sleep well but may wake hot or before dawn.',
      'Deep and long. I love to sleep in.',
    ],
  },
  {
    question: 'When I exercise',
    hint: 'How your body responds, not what you wish it did.',
    answers: [
      'I tire quickly and prefer light, gentle movement.',
      'I like intensity and competition and can overdo it.',
      'I am slow to start, but I have real endurance once I go.',
    ],
  },
  {
    question: 'My physical pace',
    hint: 'How others would describe you.',
    answers: [
      'Fast. I move, talk, and fidget quickly.',
      'Purposeful. I move with intent and get to the point.',
      'Slow and steady. I do not like to be rushed.',
    ],
  },
  // Mind and temperament
  {
    question: 'When I learn something new',
    hint: 'Memory, not intelligence.',
    answers: [
      'I pick it up fast and forget it just as fast.',
      'I grasp it quickly and remember it well.',
      'I take longer to learn it, but then it stays with me.',
    ],
  },
  {
    question: 'Under stress I tend to feel',
    hint: 'Your first reaction, before you manage it.',
    answers: ['Anxious, worried, or scattered.', 'Irritable, critical, or angry.', 'Withdrawn, stubborn, or stuck.'],
  },
  {
    question: 'My mind is usually',
    hint: 'At rest, not at work.',
    answers: [
      'Restless and creative, jumping between ideas.',
      'Sharp and focused, with strong opinions.',
      'Calm and steady, slow to change.',
    ],
  },
  {
    question: 'When I make decisions',
    hint: 'Big decisions and small ones.',
    answers: [
      'I change my mind often and second-guess.',
      'I decide quickly and confidently.',
      'I take my time and rarely change course once decided.',
    ],
  },
  {
    question: 'My way of speaking',
    hint: 'In a relaxed conversation.',
    answers: [
      'Fast, talkative, and I wander off topic.',
      'Direct, clear, and sometimes sharp.',
      'Slow, calm, and measured, with fewer words.',
    ],
  },
  {
    question: 'With money',
    hint: 'Your instinct, not your budget.',
    answers: [
      'I spend on impulse and on small things.',
      'I spend on quality and on what gets me ahead.',
      'I save, and I hold on to what I have.',
    ],
  },
  {
    question: 'My daily routine',
    hint: 'What actually happens, not what you intend.',
    answers: [
      'Changes constantly. I find it hard to keep one.',
      'Is organized and efficient. I like a plan.',
      'Is regular and comfortable. I keep the same habits for years.',
    ],
  },
];
