/**
 * questionBank.ts
 * Authentic IELTS Speaking question bank for Part 1, Part 2, and Part 3.
 *
 * Requirements:
 * - Part 1: >= 4 common topics (each with 4-6 questions)
 * - Part 2: >= 15 cue cards covering people, places, objects, events, activities
 * - Part 3: Deep analytical questions matched to each Part 2 cue card
 */

export interface Part1Topic {
  id: string;
  topic: string;
  questions: string[];
}

export interface Part2CueCard {
  id: string;
  topicCategory: 'People' | 'Places' | 'Objects' | 'Experiences' | 'Activities';
  title: string;
  cueCard: string;
  bulletPoints: string[];
  part3Questions: string[];
}

export interface ExamPaper {
  id: string;
  part1Topics: Part1Topic[];
  part2Card: Part2CueCard;
}

export const PART_1_TOPICS: Part1Topic[] = [
  {
    id: 'work_or_study',
    topic: 'Work or Study',
    questions: [
      'Are you currently working or are you a student?',
      'What subject are you studying, or what kind of work do you do?',
      'Why did you choose this field of study or career path?',
      'What do you find most interesting or rewarding about your daily work or studies?',
      'Is there anything you would like to change or improve about your current workplace or school?',
      'What are your future career plans over the next few years?',
    ],
  },
  {
    id: 'hometown',
    topic: 'Hometown and Neighborhood',
    questions: [
      'Where is your hometown located?',
      'What do you like most about living in or visiting your hometown?',
      'Has your hometown changed significantly since you were a child?',
      'What kind of jobs or industries are most common in your hometown?',
      'Would you recommend your hometown as a good place for young professionals to settle down? Why?',
    ],
  },
  {
    id: 'daily_routine',
    topic: 'Daily Routine and Time Management',
    questions: [
      'What does your typical morning routine look like?',
      'What is your favorite time of the day, and why?',
      'Do you prefer having a strictly planned schedule or having flexible, spontaneous days?',
      'How do you manage to balance work or studies with your personal leisure time?',
      'If you could change one thing about your daily routine, what would it be?',
    ],
  },
  {
    id: 'reading_and_books',
    topic: 'Reading and Literature',
    questions: [
      'Do you enjoy reading books in your free time?',
      'What genres or types of books do you usually prefer reading?',
      'Did you read a lot of books when you were a child?',
      'Do you prefer reading printed physical paper books or electronic books? Why?',
      'What was the most memorable book or article you read recently?',
    ],
  },
  {
    id: 'music_and_instruments',
    topic: 'Music and Musical Instruments',
    questions: [
      'What kind of music do you most enjoy listening to?',
      'Did you ever learn to play a musical instrument when you were younger?',
      'Do you prefer attending live music performances or listening to recorded music at home?',
      'Why do you think music plays such an essential role in human culture?',
      'If you could master any musical instrument immediately, which one would you choose?',
    ],
  },
  {
    id: 'weather_and_seasons',
    topic: 'Weather and Seasons',
    questions: [
      'What kind of weather do you enjoy the most?',
      'Does the weather outside ever have an impact on your mood or daily productivity?',
      'What is the climate typically like in your country throughout different seasons?',
      'Which season of the year do you look forward to the most? Why?',
      'Have you noticed any noticeable climate changes in your region over recent years?',
    ],
  },
];

export const PART_2_CUE_CARDS: Part2CueCard[] = [
  {
    id: 'card_person_admired',
    topicCategory: 'People',
    title: 'Describe a person you admire who has achieved something meaningful',
    cueCard: `You should say:
• who this person is
• how you know about them
• what they have achieved
and explain why you admire them so much.`,
    bulletPoints: [
      'who this person is',
      'how you know about them',
      'what they have achieved',
      'why you admire them so much',
    ],
    part3Questions: [
      'What qualities make someone a genuine role model for young people today?',
      'Do you think celebrities and sports stars have a social duty to act as positive role models?',
      'How has social media transformed the way we perceive and evaluate successful individuals?',
      'Is it more constructive for people to admire figures in their personal life rather than public celebrities?',
    ],
  },
  {
    id: 'card_influential_teacher',
    topicCategory: 'People',
    title: 'Describe a teacher who has had a positive influence on your life or education',
    cueCard: `You should say:
• who this teacher was
• what subject they taught you
• what made their teaching approach special
and explain how they influenced your thinking or personal growth.`,
    bulletPoints: [
      'who this teacher was',
      'what subject they taught you',
      'what made their teaching approach special',
      'how they influenced your thinking or personal growth',
    ],
    part3Questions: [
      'How has the role of teachers evolved with the widespread adoption of AI and online education?',
      'What do you believe are the most critical qualities of an exceptional educator?',
      'Should educational institutions prioritize standardized exam scores or character development?',
      'What policies could governments introduce to attract talented individuals into teaching?',
    ],
  },
  {
    id: 'card_interesting_stranger',
    topicCategory: 'People',
    title: 'Describe an interesting conversation you had with someone you met for the first time',
    cueCard: `You should say:
• who this person was and where you met
• what topic you discussed
• why the conversation caught your interest
and explain how you felt after speaking with them.`,
    bulletPoints: [
      'who this person was and where you met',
      'what topic you discussed',
      'why the conversation caught your interest',
      'how you felt after speaking with them',
    ],
    part3Questions: [
      'Are people nowadays more hesitant to start conversations with strangers compared to past generations?',
      'What are the advantages of conversing with people from completely different social backgrounds?',
      'How do cultural norms shape the way individuals initiate communication in public spaces?',
      'What social skills are needed to maintain an engaging conversation with someone you just met?',
    ],
  },
  {
    id: 'card_historic_town',
    topicCategory: 'Places',
    title: 'Describe a historic city, town, or monument you visited',
    cueCard: `You should say:
• where this historic place is located
• when and why you traveled there
• what historical architecture or features caught your attention
and explain what made your visit so memorable.`,
    bulletPoints: [
      'where this historic place is located',
      'when and why you traveled there',
      'what historical architecture or features caught your attention',
      'what made your visit so memorable',
    ],
    part3Questions: [
      'Why is it important for nations to preserve ancient architecture and heritage sites?',
      'How can modern city developers strike a balance between urban expansion and historical preservation?',
      'Should public funding be allocated to monument restoration rather than public infrastructure?',
      'In what ways can international tourism both sustain and damage historic destinations?',
    ],
  },
  {
    id: 'card_peaceful_place',
    topicCategory: 'Places',
    title: 'Describe a quiet place where you like to go to relax or concentrate',
    cueCard: `You should say:
• where this quiet place is
• how often you visit it
• what you usually do when you are there
and explain why you find this place particularly peaceful.`,
    bulletPoints: [
      'where this quiet place is',
      'how often you visit it',
      'what you usually do when you are there',
      'why you find this place particularly peaceful',
    ],
    part3Questions: [
      'Why has genuine quietness become a scarce luxury in modern metropolitan life?',
      'What psychological consequences can continuous environmental noise pollution have on city dwellers?',
      'Should city planners make public quiet zones and parks mandatory in all residential districts?',
      'Do younger generations appreciate solitude as much as older generations do?',
    ],
  },
  {
    id: 'card_natural_landscape',
    topicCategory: 'Places',
    title: 'Describe a beautiful natural landscape or outdoor setting you remember vividly',
    cueCard: `You should say:
• where this natural setting is
• who you were with when you visited
• what natural scenery and features stood out to you
and explain why this landscape left such a profound impression on you.`,
    bulletPoints: [
      'where this natural setting is',
      'who you were with when you visited',
      'what natural scenery and features stood out to you',
      'why this landscape left such a profound impression on you',
    ],
    part3Questions: [
      'What are the proven mental health benefits of spending regular time in natural environments?',
      'How can national parks manage growing tourist numbers without harming local biodiversity?',
      'Do you feel contemporary urban lifestyles have disconnected humans from the natural world?',
      'What everyday responsibilities do individuals have in protecting local natural ecosystems?',
    ],
  },
  {
    id: 'card_essential_technology',
    topicCategory: 'Objects',
    title: 'Describe a piece of technology or electronic equipment you find indispensable',
    cueCard: `You should say:
• what this technology or device is
• how often and for what tasks you use it
• how you learned to use it
and explain why you consider it so indispensable to your daily life.`,
    bulletPoints: [
      'what this technology or device is',
      'how often and for what tasks you use it',
      'how you learned to use it',
      'why you consider it so indispensable to your daily life',
    ],
    part3Questions: [
      'How has heavy dependence on smartphones and smart devices altered human attention spans and memory?',
      'What ethical dilemmas arise from embedding generative AI deeply into daily consumer technology?',
      'Does technological innovation tend to widen or narrow the economic gap between social groups?',
      'What practical measures should be taken to prevent elderly citizens from being digitally excluded?',
    ],
  },
  {
    id: 'card_cultural_craft',
    topicCategory: 'Objects',
    title: 'Describe a traditional craft, artwork, or cultural object from your country',
    cueCard: `You should say:
• what this object or craft is
• what materials and techniques are used to make it
• what cultural symbolism or history it holds
and explain why you think it is important to preserve this traditional art form.`,
    bulletPoints: [
      'what this object or craft is',
      'what materials and techniques are used to make it',
      'what cultural symbolism or history it holds',
      'why you think it is important to preserve this traditional art form',
    ],
    part3Questions: [
      'Why are traditional handicrafts struggling to compete economically with mass industrial manufacturing?',
      'Should traditional craftsmanship be integrated as a compulsory module in school curricula?',
      'How can classical folk arts be modernized to appeal to younger, digital-native audiences?',
      'Why is tangible cultural heritage essential for preserving a community’s national identity?',
    ],
  },
  {
    id: 'card_influential_book',
    topicCategory: 'Objects',
    title: 'Describe a book or written article that made a lasting impression on you',
    cueCard: `You should say:
• what the title and topic of the work was
• when and why you chose to read it
• what central ideas or perspective it presented
and explain how it influenced your views or personal decisions.`,
    bulletPoints: [
      'what the title and topic of the work was',
      'when and why you chose to read it',
      'what central ideas or perspective it presented',
      'how it influenced your views or personal decisions',
    ],
    part3Questions: [
      'How is the habit of reading bite-sized digital content changing our capacity for deep, analytical reading?',
      'In what ways can fictional literature cultivate greater social empathy than purely factual texts?',
      'Do public physical libraries still warrant tax-funded subsidies in the age of digital search engines?',
      'Can reading literature from foreign cultures help resolve geopolitical misunderstandings?',
    ],
  },
  {
    id: 'card_helping_hand',
    topicCategory: 'Experiences',
    title: 'Describe an occasion when you helped someone in need',
    cueCard: `You should say:
• who you helped and what situation they were facing
• what specific assistance you provided
• what difficulties arose while trying to help
and explain how you felt after offering that help.`,
    bulletPoints: [
      'who you helped and what situation they were facing',
      'what specific assistance you provided',
      'what difficulties arose while trying to help',
      'how you felt after offering that help',
    ],
    part3Questions: [
      'What drives people to engage in unpaid volunteering and altruistic community activities?',
      'Are inhabitants of large cities generally less inclined to assist strangers than those in rural villages?',
      'How can schools and families nurture a genuine spirit of civic responsibility among children?',
      'Is providing welfare support primarily the obligation of the state or of private non-profit charities?',
    ],
  },
  {
    id: 'card_tough_decision',
    topicCategory: 'Experiences',
    title: 'Describe an important decision that took you a long time to make',
    cueCard: `You should say:
• what the decision was about
• why it was difficult and required careful contemplation
• whose advice you sought or what factors you weighed
and explain whether you feel satisfied with the outcome today.`,
    bulletPoints: [
      'what the decision was about',
      'why it was difficult and required careful contemplation',
      'whose advice you sought or what factors you weighed',
      'whether you feel satisfied with the outcome today',
    ],
    part3Questions: [
      'Why do many modern individuals suffer from decision fatigue when confronted with an abundance of choices?',
      'How should young adults navigate conflicts between personal ambitions and parental expectations?',
      'In business and politics, should major decisions rely more heavily on analytical data or experienced intuition?',
      'How can people develop emotional resilience when a well-calculated decision yields unexpected failure?',
    ],
  },
  {
    id: 'card_difficult_challenge',
    topicCategory: 'Experiences',
    title: 'Describe a significant challenge you faced and how you overcame it',
    cueCard: `You should say:
• what the challenge or obstacle was
• when and where it took place
• what steps you took to tackle or manage the situation
and explain what valuable lesson you learned from the experience.`,
    bulletPoints: [
      'what the challenge or obstacle was',
      'when and where it took place',
      'what steps you took to tackle or manage the situation',
      'what valuable lesson you learned from the experience',
    ],
    part3Questions: [
      'How does encountering adversity during early adulthood build long-term character and grit?',
      'Why do some individuals thrive under intense pressure while others experience burnout and distress?',
      'Should educational institutions intentionally design experiences that teach students how to manage failure?',
      'What role do friends and family play as a psychological safety net during life transitions?',
    ],
  },
  {
    id: 'card_outdoor_sport',
    topicCategory: 'Activities',
    title: 'Describe an outdoor sport or physical activity you enjoy participating in',
    cueCard: `You should say:
• what sport or activity it is
• where and with whom you usually engage in it
• what gear, rules, or preparation it entails
and explain why you prefer this outdoor activity over indoor fitness training.`,
    bulletPoints: [
      'what sport or activity it is',
      'where and with whom you usually engage in it',
      'what gear, rules, or preparation it entails',
      'why you prefer this outdoor activity over indoor fitness training',
    ],
    part3Questions: [
      'Why have sedentary lifestyles become an alarming global health concern among desk workers and students?',
      'Should local governments invest municipal revenue to construct free sports grounds in residential areas?',
      'What social advantages do team sports offer over solo cardiovascular exercises?',
      'Do international athletic spectacles like the Olympic Games deliver lasting socioeconomic benefits to host cities?',
    ],
  },
  {
    id: 'card_new_skill',
    topicCategory: 'Activities',
    title: 'Describe a practical skill you learned and found genuinely useful',
    cueCard: `You should say:
• what skill it is (e.g., cooking, programming, public speaking, driving)
• how and from whom you learned it
• how much time and practice it required to master
and explain why this skill has been so valuable to you.`,
    bulletPoints: [
      'what skill it is',
      'how and from whom you learned it',
      'how much time and practice it required to master',
      'why this skill has been so valuable to you',
    ],
    part3Questions: [
      'Which professional skills do you anticipate will become most critical in the next ten years of automation?',
      'Do conventional universities focus too heavily on abstract theory at the expense of hands-on skills?',
      'How does continuous adult learning impact long-term cognitive agility and mental well-being?',
      'Is there an age threshold beyond which acquiring a new complex skill or language becomes impractical?',
    ],
  },
  {
    id: 'card_inspiring_film',
    topicCategory: 'Activities',
    title: 'Describe a film, documentary, or theatre performance that inspired you deeply',
    cueCard: `You should say:
• what production it was and what story it told
• when and where you watched it
• what narrative, visual, or emotional aspects stood out
and explain why this production inspired or moved you so strongly.`,
    bulletPoints: [
      'what production it was and what story it told',
      'when and where you watched it',
      'what narrative, visual, or emotional aspects stood out',
      'why this production inspired or moved you so strongly',
    ],
    part3Questions: [
      'In what ways do cinema and documentary media shape public perception of pressing societal issues?',
      'Is the prevalence of commercial action blockbusters stifling creative freedom in independent cinema?',
      'Why do investigative documentaries often struggle to draw large audiences despite their societal relevance?',
      'To what extent should state agencies regulate or censor themes explored in artistic visual productions?',
    ],
  },
  {
    id: 'card_environmental_issue',
    topicCategory: 'Places',
    title: 'Describe an environmental challenge in your city or region that needs urgent attention',
    cueCard: `You should say:
• what the environmental problem is (e.g. plastic waste, air pollution, lack of green spaces)
• what causes it and how it manifests
• how it impacts residents’ everyday well-being
and explain what realistic steps should be taken to address it.`,
    bulletPoints: [
      'what the environmental problem is',
      'what causes it and how it manifests',
      'how it impacts residents’ everyday well-being',
      'what realistic steps should be taken to address it',
    ],
    part3Questions: [
      'Who bears the primary moral obligation to combat environmental hazards: central governments or citizens?',
      'Can continuous economic expansion truly coexist with rigorous ecological conservation?',
      'How effective are carbon pricing and environmental fines in compelling multinational corporations to act green?',
      'What role can youth grassroots activism play in driving tangible environmental policy legislation?',
    ],
  },
];

/**
 * Randomly generates a full IELTS speaking exam paper:
 * - 2 Part 1 topics
 * - 1 Part 2 cue card (with paired Part 3 deep discussion questions)
 */
export function getRandomExamPaper(): ExamPaper {
  // Shuffle Part 1 topics and pick 2
  const shuffledP1 = [...PART_1_TOPICS].sort(() => Math.random() - 0.5);
  const part1Topics = shuffledP1.slice(0, 2);

  // Pick 1 random Part 2 cue card
  const cardIndex = Math.floor(Math.random() * PART_2_CUE_CARDS.length);
  const part2Card = PART_2_CUE_CARDS[cardIndex];

  return {
    id: `paper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    part1Topics,
    part2Card,
  };
}
