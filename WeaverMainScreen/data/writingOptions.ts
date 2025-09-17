import type { WritingRole, WritingStyleCategory, WritingGenreCategory, WriterCategory } from '../types';

export const WRITING_ROLES: WritingRole[] = [
  { name: 'Author', description: 'Creator of original written work (books, articles, etc.)' },
  { name: 'Writer', description: 'Broad term for anyone who writes professionally or creatively' },
  { name: 'Novelist', description: 'Writes novels, typically long-form fiction' },
  { name: 'Poet', description: 'Specializes in poetry' },
  { name: 'Essayist', description: 'Writes essays, often reflective or analytical' },
  { name: 'Playwright', description: 'Writes scripts for theater' },
  { name: 'Screenwriter', description: 'Writes for film or television' },
  { name: 'Journalist', description: 'Reports news or writes articles for media outlets' },
  { name: 'Blogger', description: 'Writes informal or niche content for online platforms' },
  { name: 'Copywriter', description: 'Crafts persuasive or promotional content (ads, websites)' },
  { name: 'Technical Writer', description: 'Creates manuals, guides, and documentation' },
  { name: 'Ghostwriter', description: 'Writes on behalf of someone else (often uncredited)' },
  { name: 'Comic Writer', description: 'Writes scripts and dialogue for comics or graphic novels' },
];

export const WRITING_STYLES: WritingStyleCategory[] = [
  { category: 'My Own Style', options: [{ name: 'Custom', description: "Develop a unique style with Arachne's guidance." }] },
  {
    category: 'Major Writing Styles',
    options: [
      { name: 'Narrative', description: 'Tells a story with characters, plot, and setting.' },
      { name: 'Descriptive', description: 'Focuses on vivid imagery and sensory details.' },
      { name: 'Expository', description: 'Explains or informs with facts and logic.' },
      { name: 'Persuasive', description: 'Aims to convince the reader of a viewpoint.' },
      { name: 'Analytical', description: 'Breaks down ideas or texts to interpret meaning.' },
      { name: 'Reflective', description: 'Explores personal thoughts, experiences, and growth.' },
      { name: 'Technical', description: 'Precise, structured writing for instructions or documentation.' },
      { name: 'Satirical', description: 'Uses humor, irony, or exaggeration to critique.' },
      { name: 'Poetic', description: 'Focuses on rhythm, metaphor, and emotion.' },
      { name: 'Scriptwriting', description: 'Structured for performance (film, TV, theater).' },
    ]
  },
  {
    category: 'Biblical Writing Styles',
    options: [
      { name: 'Biblical Narrative', description: 'Tells stories of prophets, kings, and divine events (e.g., Genesis, Acts).' },
      { name: 'Biblical Poetic', description: 'Uses metaphor, rhythm, and emotion (e.g., Psalms, Song of Solomon).' },
      { name: 'Biblical Expository', description: 'Explains laws, doctrines, and teachings (e.g., Leviticus, Romans).' },
      { name: 'Biblical Persuasive', description: 'Calls for belief, repentance, or moral action (e.g., Paul’s letters).' },
      { name: 'Biblical Prophetic', description: 'Foretells future events, often symbolic (e.g., Isaiah, Revelation).' },
      { name: 'Biblical Epistolary', description: 'Letters conveying doctrine and encouragement (e.g., Corinthians).' },
      { name: 'Biblical Apocalyptic', description: 'Symbolic, visionary, and cosmic (e.g., Daniel, Revelation).' },
    ]
  }
];

export const WRITING_GENRES: WritingGenreCategory[] = [
  { category: 'My Own Genre', options: [{ name: 'Custom', description: 'Craft a unique genre that blends multiple elements.' }] },
  {
    category: 'Major Genre Styles',
    options: [
      { name: 'Fantasy', description: 'World-building, mythic tone, magical systems.' },
      { name: 'Science Fiction', description: 'Futuristic, speculative, often technical.' },
      { name: 'Mystery/Thriller', description: 'Suspenseful, clue-driven, fast-paced.' },
      { name: 'Romance', description: 'Emotional, character-driven, intimate tone.' },
      { name: 'Historical Fiction', description: 'Period-accurate language and detail.' },
      { name: 'Horror', description: 'Aims to evoke fear, dread, and terror.' },
      { name: 'Stream of Consciousness', description: 'Mimics internal thought flow.' },
      { name: 'Minimalist', description: 'Sparse language, focus on subtext.' },
      { name: 'Metafiction', description: 'Self-aware, breaks the fourth wall.' },
      { name: 'Graphic Narrative', description: 'Combines text with visual storytelling.' },
    ]
  },
  {
    category: 'Biblical Writing Genres',
    options: [
      { name: 'Spiritual/Religious', description: 'Focused on divine themes, faith, and morality.' },
      { name: 'Biblical Historical Fiction', description: 'Reimagines biblical events with narrative depth.' },
      { name: 'Philosophical', description: 'Explores existential and theological questions.' },
      { name: 'Apocalyptic Fantasy', description: 'Symbolic, visionary, and allegorical.' },
      { name: 'Moral Allegory', description: 'Uses symbolic storytelling to convey ethical truths.' },
      { name: 'Devotional', description: 'Personal reflections and meditations on scripture.' },
      { name: 'Theological Commentary', description: 'Analytical and doctrinal exposition.' },
    ]
  }
];

export const WRITERS: WriterCategory[] = [
  { category: 'My Own Style', writers: [{ name: 'Custom', description: 'Emulate your own unique writing voice.' }] },
  {
    category: 'Popular Writers',
    writers: [
      { name: 'J.R.R. Tolkien', description: 'Fantasy, Descriptive, Poetic' },
      { name: 'George R.R. Martin', description: 'Fantasy, Narrative, Minimalist' },
      { name: 'Isaac Asimov', description: 'Science Fiction, Expository, Technical' },
      { name: 'Frank Herbert', description: 'Science Fiction, Philosophical, Poetic' },
      { name: 'Agatha Christie', description: 'Mystery/Thriller, Narrative, Minimalist' },
      { name: 'Stephen King', description: 'Horror, Narrative, Reflective' },
      { name: 'Edgar Allan Poe', description: 'Horror, Poetic, Descriptive' },
      { name: 'H.P. Lovecraft', description: 'Horror, Descriptive, Analytical' },
      { name: 'Leo Tolstoy', description: 'Narrative, Reflective, Historical' },
      { name: 'Jane Austen', description: 'Narrative, Romantic, Reflective' },
    ]
  },
  {
    category: 'Biblical Writers',
    writers: [
      { name: 'Moses', description: 'Narrative, Expository, Historical' },
      { name: 'David', description: 'Poetic, Reflective' },
      { name: 'Solomon', description: 'Poetic, Philosophical, Reflective' },
      { name: 'Isaiah', description: 'Prophetic, Poetic' },
      { name: 'Apostle Paul', description: 'Epistolary, Persuasive, Expository' },
      { name: 'Apostle John', description: 'Apocalyptic, Prophetic, Poetic' },
      { name: 'C.S. Lewis', description: 'Moral Allegory, Fantasy, Persuasive' },
      { name: 'John Milton', description: 'Poetic, Apocalyptic Fantasy, Philosophical' },
    ]
  }
];
