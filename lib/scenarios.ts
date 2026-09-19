// Competency categories, certification rule, and the scenario bank.
// Scenarios are grounded in Cameron Coffee Co.'s (fictional) menu and policies.

export const CERT_BAR = 90;

export type CategoryId =
  | "allergy"
  | "guests"
  | "policy"
  | "menu"
  | "recovery"
  | "rush";

export const CATEGORIES: { id: CategoryId; name: string; short: string; blurb: string }[] = [
  { id: "allergy", name: "Allergy & Food Safety", short: "Allergy", blurb: "Cross-contact, ingredients, escalating to a manager" },
  { id: "guests", name: "Difficult Guests", short: "Guests", blurb: "Upset, rushed or rude guests" },
  { id: "policy", name: "Policy & Exceptions", short: "Policy", blurb: "Refunds, comps and rule exceptions" },
  { id: "menu", name: "Menu Knowledge", short: "Menu", blurb: "Ingredients, modifiers, recommendations" },
  { id: "recovery", name: "Service Recovery", short: "Recovery", blurb: "Apologize, fix it, follow up" },
  { id: "rush", name: "Composure Under Rush", short: "Rush", blurb: "Staying accurate and calm at peak" },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export type Criterion = { text: string; keywords: string[] };

export type Scenario = {
  persona: string;
  situation: string;
  openingLine: string;
  criteria: Criterion[];
  guestNotes: string; // private directions for the AI guest
};

export type Module = {
  id: string;
  title: string;
  categoryId: CategoryId;
  type: "standard" | "tailored";
  minutes: number;
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  scenario: Scenario;
  sourceReviewId?: string;
  createdFor?: string; // employee id for tailored modules
};

// ---- Standard scenarios (one per category) ----
export const STANDARD_SCENARIOS: Record<CategoryId, Omit<Module, "id" | "type" | "sourceReviewId" | "createdFor">> = {
  allergy: {
    title: "Tree-nut allergy at the counter",
    categoryId: "allergy",
    minutes: 4,
    difficulty: "Intermediate",
    scenario: {
      persona: "Jordan, a first-time guest with a severe tree-nut allergy",
      situation: "Jordan wants an oat milk latte and asks if it is safe. Almond milk is steamed on the same wand.",
      openingLine: "Hi! I have a severe tree nut allergy. Is the oat milk latte safe for me?",
      guestNotes: "Be anxious but polite. If the employee guesses or says 'I think so', get more worried. Calm down only if they check, explain cross-contact honestly, and bring in a manager.",
      criteria: [
        { text: "Took the allergy seriously and did not guess", keywords: ["check", "let me", "make sure", "not sure", "verify", "ask"] },
        { text: "Disclosed shared steam wand / cross-contact risk with almond milk", keywords: ["steam wand", "cross", "almond", "shared", "same wand"] },
        { text: "Escalated to the shift manager or GM", keywords: ["manager", "shift lead", "supervisor", "gm"] },
        { text: "Offered a safer alternative (e.g. sanitized wand or a packaged drink)", keywords: ["sanitiz", "clean", "alternative", "instead", "bottled", "packaged", "tea"] },
      ],
    },
  },
  guests: {
    title: "Guest waited 15 minutes",
    categoryId: "guests",
    minutes: 4,
    difficulty: "Foundational",
    scenario: {
      persona: "Dana, a frustrated guest on a short work break",
      situation: "Dana ordered a mobile order 15 minutes ago and it still isn't ready.",
      openingLine: "I ordered fifteen minutes ago and I have a meeting in five. What is going on?",
      guestNotes: "Be curt and annoyed. Soften only if the employee apologizes sincerely, takes ownership, and gives a concrete next step or time.",
      criteria: [
        { text: "Apologized sincerely without blaming the team or the rush", keywords: ["sorry", "apolog"] },
        { text: "Took ownership and checked the order status", keywords: ["let me check", "look into", "find your order", "i'll check", "i will check", "on it"] },
        { text: "Gave a concrete time or next step", keywords: ["minute", "right now", "next", "shortly", "right away"] },
        { text: "Offered a make-good within policy", keywords: ["free", "on us", "comp", "next drink", "discount", "refund"] },
      ],
    },
  },
  policy: {
    title: "Refund request outside policy",
    categoryId: "policy",
    minutes: 5,
    difficulty: "Advanced",
    scenario: {
      persona: "Chris, a guest who wants a refund on a drink he finished",
      situation: "Chris drank most of a latte, then asks for a full refund saying it 'tasted off'. Policy: remake or partial credit, with manager approval above $8.",
      openingLine: "I finished most of this, but honestly it tasted off. I want a full refund.",
      guestNotes: "Be firm but not abusive. Push back once on a remake. Accept a remake or credit if offered respectfully and with a clear explanation.",
      criteria: [
        { text: "Listened and acknowledged the complaint before stating policy", keywords: ["understand", "hear", "sorry", "thank you for telling"] },
        { text: "Explained the remake / credit policy plainly", keywords: ["remake", "credit", "policy", "we can"] },
        { text: "Looped in a manager for the exception", keywords: ["manager", "shift lead", "supervisor", "approve"] },
        { text: "Stayed friendly and kept the guest's dignity", keywords: ["appreciate", "happy to", "glad", "thank"] },
      ],
    },
  },
  menu: {
    title: "What's in the seasonal cold brew?",
    categoryId: "menu",
    minutes: 3,
    difficulty: "Foundational",
    scenario: {
      persona: "Sam, a curious guest who is new to cold brew",
      situation: "Sam asks about the Cameron Crazie Cold Brew (vanilla sweet cream, cinnamon dust) and wants a lower-sugar option.",
      openingLine: "What's in the Cameron Crazie Cold Brew? And can I get it with less sugar?",
      guestNotes: "Friendly and chatty. Ask one follow-up about caffeine content and one about sweetness levels.",
      criteria: [
        { text: "Described the drink accurately (vanilla sweet cream, cinnamon)", keywords: ["vanilla", "sweet cream", "cinnamon"] },
        { text: "Offered a lower-sugar modification (fewer pumps, unsweetened)", keywords: ["pump", "less", "unsweetened", "half", "sugar"] },
        { text: "Answered or honestly deferred on the caffeine question", keywords: ["caffeine", "mg", "strong", "check"] },
        { text: "Made a personalized recommendation", keywords: ["recommend", "suggest", "you might like", "try"] },
      ],
    },
  },
  recovery: {
    title: "Wrong drink, no apology",
    categoryId: "recovery",
    minutes: 3,
    difficulty: "Foundational",
    scenario: {
      persona: "Priya, a regular who received the wrong drink",
      situation: "Priya ordered an iced oat latte and received a hot whole-milk latte.",
      openingLine: "This is a hot latte with regular milk. I ordered an iced oat one.",
      guestNotes: "Mildly annoyed. Improves if the employee owns it, remakes fast, and checks back.",
      criteria: [
        { text: "Apologized and owned the mistake", keywords: ["sorry", "apolog", "my mistake", "our mistake"] },
        { text: "Remade the drink quickly and confirmed the order", keywords: ["remake", "make you a new", "iced oat", "right away", "confirm"] },
        { text: "Checked back to make sure the fix landed", keywords: ["check back", "everything", "does that look", "is that better", "how is"] },
        { text: "Offered a small gesture of goodwill", keywords: ["on us", "free", "next", "cookie", "treat"] },
      ],
    },
  },
  rush: {
    title: "Morning rush, mixed-up orders",
    categoryId: "rush",
    minutes: 5,
    difficulty: "Advanced",
    scenario: {
      persona: "Marcus, an impatient guest at the back of a long line",
      situation: "It's 8:10am, the line is out the door. Marcus reaches the register while three mobile orders pile up.",
      openingLine: "Can I get a large drip and a bagel? I've been standing here forever.",
      guestNotes: "Rushed and short. Gets an order change mid-sentence to test accuracy. Appreciative if the employee stays calm and repeats the order back.",
      criteria: [
        { text: "Greeted warmly despite the pressure", keywords: ["good morning", "hi", "hello", "welcome", "thanks for waiting"] },
        { text: "Repeated the order back to confirm accuracy", keywords: ["so that's", "just to confirm", "large drip", "let me confirm", "repeat"] },
        { text: "Acknowledged the wait without excuses", keywords: ["thanks for your patience", "appreciate", "sorry for the wait", "thank you for waiting"] },
        { text: "Handled the mid-order change correctly", keywords: ["change", "swap", "instead", "got it", "no problem"] },
      ],
    },
  },
};

// ---- Tailored variants, built from a GM note about a specific employee ----
export type NoteTemplate = {
  categoryId: CategoryId;
  note: string; // {name} placeholder
  title: string;
  situation: string;
  persona: string;
  openingLine: string;
  guestNotes: string;
  criteria: Criterion[];
};

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    categoryId: "allergy",
    note: "Overheard {name} tell a guest 'I think the oat milk is fine' about a nut allergy without checking. We never guess on allergens. Needs practice escalating.",
    title: "Oat milk & the nut allergy: check, don't guess",
    persona: "Alex, a guest with a tree-nut allergy who has been burned before",
    situation: "Alex asks if the oat milk is safe and pushes for a quick yes. The right move is to check, disclose cross-contact and involve a manager.",
    openingLine: "Just tell me quickly, the oat milk is fine for a nut allergy, right? I'm in a hurry.",
    guestNotes: "Pressure the employee to just say yes. Relax only if they slow down, check the ingredient sheet, and bring a manager.",
    criteria: [
      { text: "Resisted pressure to guess and said they needed to check", keywords: ["check", "make sure", "not going to guess", "let me verify", "let me confirm"] },
      { text: "Referenced the ingredient / allergen sheet", keywords: ["sheet", "binder", "ingredient", "label", "allergen"] },
      { text: "Disclosed shared equipment / cross-contact", keywords: ["cross", "shared", "same", "almond", "steam"] },
      { text: "Escalated to a manager before serving", keywords: ["manager", "shift lead", "supervisor", "gm"] },
    ],
  },
  {
    categoryId: "guests",
    note: "{name} got defensive with a guest who complained about the wait ('we're just really busy'). Guest left upset. Practice owning it without excuses.",
    title: "Owning the wait without excuses",
    persona: "Riley, a guest who was told 'we're just really busy'",
    situation: "Riley is already annoyed after a previous brush-off and expects another excuse.",
    openingLine: "Last time you all told me you were 'just busy.' Is that the answer again today?",
    guestNotes: "Skeptical and clipped. Only softens if there's no excuse, an apology, a real plan, and a make-good.",
    criteria: [
      { text: "Did not use 'we're busy' as an excuse", keywords: ["sorry", "apolog", "you're right", "shouldn't have"] },
      { text: "Took direct ownership", keywords: ["i'll", "i will", "let me", "personally"] },
      { text: "Gave a concrete plan or time", keywords: ["minute", "right now", "next", "shortly"] },
      { text: "Offered a make-good", keywords: ["on us", "free", "comp", "next"] },
    ],
  },
  {
    categoryId: "policy",
    note: "{name} promised a guest a full refund on the spot without manager approval. Over the $8 limit. Needs practice on exceptions.",
    title: "Refund limits: yes to the guest, no to the promise",
    persona: "Taylor, a guest demanding a refund on a $9.50 order",
    situation: "Taylor wants the money back now. Orders over $8 need manager approval.",
    openingLine: "I want my $9.50 back right now. The last person here would have just given it to me.",
    guestNotes: "Insistent and quotes 'the last person'. Accepts a manager-approved solution delivered with warmth.",
    criteria: [
      { text: "Did not promise a refund before approval", keywords: ["approval", "check with", "let me see", "get my manager"] },
      { text: "Explained the limit plainly, without blame", keywords: ["policy", "over", "limit", "approve"] },
      { text: "Brought in a manager", keywords: ["manager", "shift lead", "supervisor"] },
      { text: "Offered an immediate interim fix (remake or credit)", keywords: ["remake", "credit", "replace", "in the meantime"] },
    ],
  },
  {
    categoryId: "menu",
    note: "{name} gave a guest three different answers about the seasonal cold brew's ingredients. Needs to learn the menu spec sheet.",
    title: "One right answer on the seasonal cold brew",
    persona: "Jamie, a guest who asked three staff members the same question",
    situation: "Jamie is comparing answers. Give one accurate, confident description.",
    openingLine: "Two people told me different things. What actually goes into the Cameron Crazie Cold Brew?",
    guestNotes: "Slightly skeptical. Reward a clear, accurate answer and honesty about anything uncertain.",
    criteria: [
      { text: "Named the core ingredients (vanilla sweet cream, cinnamon)", keywords: ["vanilla", "sweet cream", "cinnamon"] },
      { text: "Was confident and consistent", keywords: ["it's", "it is", "made with", "comes with"] },
      { text: "Offered a modification", keywords: ["less", "unsweetened", "pump", "without"] },
      { text: "Flagged allergens proactively", keywords: ["dairy", "allergen", "milk"] },
    ],
  },
  {
    categoryId: "recovery",
    note: "{name} remade a wrong order but never apologized or checked back. Guest posted about it. Practice full recovery, not just the fix.",
    title: "Complete the recovery: apologize, fix, follow up",
    persona: "Morgan, a guest who got a wrong order twice",
    situation: "Morgan's order was wrong. The fix is easy, and the apology and follow-up are the point.",
    openingLine: "This is the second time my order's been wrong. It's fine, whatever.",
    guestNotes: "Passive-aggressive ('it's fine'). Opens up if genuinely apologized to and checked in on.",
    criteria: [
      { text: "Apologized specifically, not a generic 'sorry'", keywords: ["sorry", "apolog", "second time"] },
      { text: "Fixed the order quickly", keywords: ["remake", "right away", "new one", "make you"] },
      { text: "Followed up after the fix", keywords: ["check back", "how is", "does that", "everything"] },
      { text: "Offered a goodwill gesture", keywords: ["on us", "free", "next", "treat"] },
    ],
  },
  {
    categoryId: "rush",
    note: "{name} froze at the register during the 8am rush and rang up two orders incorrectly. Needs reps at staying calm and confirming orders.",
    title: "Rush hour: slow down to get it right",
    persona: "Casey, a guest at the register while the line grows",
    situation: "Casey rattles off a complicated order quickly. Accuracy first, then speed.",
    openingLine: "Medium iced latte, no wait make it a large, oat milk, and add a blueberry muffin. Quick please!",
    guestNotes: "Fast talker. Happy if the order is repeated back correctly and the employee stays calm.",
    criteria: [
      { text: "Stayed calm and greeted warmly", keywords: ["sure", "absolutely", "no problem", "hi", "good morning"] },
      { text: "Repeated the full order back", keywords: ["so that's", "large iced", "confirm", "let me repeat", "just to confirm"] },
      { text: "Caught the mid-sentence change (medium → large)", keywords: ["large"] },
      { text: "Confirmed total or next step", keywords: ["total", "that'll be", "anything else", "next"] },
    ],
  },
];

// ---- Scripted guest replies for mock mode (when no API key is present) ----
export const MOCK_GUEST_LINES: Record<CategoryId, string[]> = {
  allergy: [
    "Okay... but are you sure? I've had reactions before at other cafes.",
    "So the wand is shared with the almond milk? That worries me. What can we do about that?",
    "Is there a manager I can talk to about this?",
    "Alright, thank you for taking this seriously. That makes me feel much better.",
  ],
  guests: [
    "That's not really helping. What are you going to do about it?",
    "Okay. How long is it actually going to be?",
    "Fine. I appreciate you taking it seriously.",
    "Alright, thanks. I'll wait.",
  ],
  policy: [
    "I hear you, but I still think I deserve my money back.",
    "Is there someone who can actually approve that?",
    "Okay, that seems reasonable. Let's do that.",
    "Thanks for working with me on this.",
  ],
  menu: [
    "Nice! Is it very strong? How much caffeine is that?",
    "Can you make it a little less sweet? Not too plain though.",
    "Sounds great. What would you recommend with it?",
    "Awesome, I'll take it. Thanks!",
  ],
  recovery: [
    "Yeah, I'd like that fixed, please.",
    "Okay, thank you. That was fast.",
    "Thanks for checking in. Appreciate it.",
    "Alright, no worries. Have a good one.",
  ],
  rush: [
    "Yeah, and can you make that a large? Actually make it iced.",
    "Right. Is that going to be quick? I have somewhere to be.",
    "Okay, that's right. What's the total?",
    "Great, thank you.",
  ],
};
