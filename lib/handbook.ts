// Cameron Coffee Co. menu & policy sheet (fictional). Editable in the app; the AI reads it as ground truth.
import { CATEGORY_IDS, type CategoryId } from "./scenarios";

export type Allergen = "dairy" | "egg" | "gluten" | "soy" | "treenut" | "sesame";

export const ALLERGENS: { id: Allergen; label: string; short: string }[] = [
  { id: "dairy", label: "Dairy", short: "D" },
  { id: "egg", label: "Egg", short: "E" },
  { id: "gluten", label: "Gluten", short: "G" },
  { id: "soy", label: "Soy", short: "S" },
  { id: "treenut", label: "Tree nut", short: "N" },
  { id: "sesame", label: "Sesame", short: "Se" },
];

export const MENU_SECTIONS = [
  { id: "coffee", title: "Espresso & Coffee", emoji: "☕" },
  { id: "cold", title: "Cold Coffee", emoji: "🧊" },
  { id: "notcoffee", title: "Not Coffee", emoji: "🍵" },
  { id: "bakery", title: "Bakery", emoji: "🥐" },
  { id: "extras", title: "Milks & Extras", emoji: "🥛" },
] as const;
export type MenuSectionId = (typeof MENU_SECTIONS)[number]["id"];

export type MenuItem = {
  id: string;
  section: MenuSectionId;
  name: string;
  description: string;
  price: string;
  allergens: Allergen[];
  seasonal?: boolean;
};

export type Policy = {
  id: string;
  title: string;
  emoji: string;
  body: string; // lines starting with "- " render as bullets
  noAi?: boolean; // keep out of the AI's context (e.g. jokes)
  category?: CategoryId; // the skill this policy trains; editing it makes that skill's training out of date
};

export type HandbookLogEntry = { id: string; date: string; who: string; text: string; affects?: CategoryId[] };

export type Handbook = {
  version: number;
  catVersion: Record<CategoryId, number>; // sheet version at which each skill's content last changed
  updatedOn: string;
  updatedBy: string;
  menu: MenuItem[];
  policies: Policy[];
  log: HandbookLogEntry[];
};

const m = (id: string, section: MenuSectionId, name: string, price: string, description: string, allergens: Allergen[] = [], seasonal = false): MenuItem => ({
  id, section, name, price, description, allergens, seasonal,
});

export function seedHandbook(firstPublished: string, updatedOn: string): Handbook {
  const catVersion = Object.fromEntries(CATEGORY_IDS.map((c) => [c, c === "allergy" ? 2 : 1])) as Record<CategoryId, number>;
  return {
    version: 2,
    catVersion,
    updatedOn,
    updatedBy: "Michelle Krzyzewski",
    menu: [
      m("m1", "coffee", "House Drip", "S 2.75 · M 3.25 · L 3.75", "Our medium-dark house roast, brewed fresh all day. Free refills for dine-in.", []),
      m("m2", "coffee", "Americano", "S 3.50 · M 4.00 · L 4.50", "Espresso topped with hot water. Bold, smooth, no fuss.", []),
      m("m3", "coffee", "Espresso", "Single 2.75 · Double 3.50", "Two shots of our Triangle Blend, pulled to order.", []),
      m("m4", "coffee", "Cortado", "4.00", "Equal parts espresso and steamed milk. Small but mighty.", ["dairy"]),
      m("m5", "coffee", "Latte", "S 4.75 · M 5.50 · L 6.25", "Espresso and steamed milk of your choice, topped with a little foam heart.", ["dairy"]),
      m("m6", "coffee", "Cappuccino", "S 4.50 · M 5.25", "Espresso with a cloud of velvety foam.", ["dairy"]),
      m("m7", "coffee", "Mocha", "S 5.25 · M 6.00 · L 6.75", "Espresso, chocolate sauce and steamed milk with whipped cream.", ["dairy", "soy"]),
      m("m8", "cold", "Cold Brew", "S 4.25 · M 4.75 · L 5.25", "Steeped 18 hours, smooth and never bitter. About 200 mg caffeine in a 16 oz.", []),
      m("m9", "cold", "Cameron Crazie Cold Brew", "S 5.25 · M 5.95 · L 6.50", "Our game-day favorite! Cold brew with vanilla sweet cream and a dusting of cinnamon. Sweetness is 2 / 3 / 4 pumps by size. Ask for half-sweet, fewer pumps, or unsweetened.", ["dairy"], true),
      m("m10", "cold", "Iced Latte", "S 4.95 · M 5.75 · L 6.50", "Espresso over ice with cold milk of your choice.", ["dairy"]),
      m("m11", "notcoffee", "Chai Latte", "S 4.75 · M 5.50 · L 6.25", "Spiced black tea, steamed milk, cozy vibes.", ["dairy"]),
      m("m12", "notcoffee", "Matcha Latte", "S 5.25 · M 6.00 · L 6.75", "Ceremonial-grade matcha whisked with milk. Sweetened with a touch of honey.", ["dairy"]),
      m("m13", "notcoffee", "Hot Chocolate", "S 3.95 · M 4.50 · L 5.00", "Rich chocolate, steamed milk, whipped cream on top.", ["dairy", "soy"]),
      m("m14", "notcoffee", "Iced Tea", "S 3.25 · M 3.75 · L 4.25", "Fresh-brewed black tea, unsweetened unless you ask.", []),
      m("m15", "bakery", "Blueberry Muffin", "3.75", "Baked each morning with real blueberries and a sugar crunch top.", ["gluten", "egg", "dairy"]),
      m("m16", "bakery", "Butter Croissant", "3.95", "Flaky, golden and unapologetically buttery.", ["gluten", "egg", "dairy"]),
      m("m17", "bakery", "Almond Croissant", "4.50", "Butter croissant filled with almond cream and topped with sliced almonds.", ["gluten", "egg", "dairy", "treenut"]),
      m("m18", "bakery", "Everything Bagel", "3.25", "Toasted with your choice of butter or cream cheese.", ["gluten", "sesame"]),
      m("m19", "bakery", "Banana Walnut Bread", "3.95", "Moist and lightly spiced, with walnut crunch.", ["gluten", "egg", "dairy", "treenut"]),
      m("m20", "bakery", "Chocolate Chip Cookie", "2.75", "Soft-baked, big, and made for sharing (or not).", ["gluten", "egg", "dairy", "soy"]),
      m("m21", "extras", "Whole & 2% Milk", "Free", "Our default milks.", ["dairy"]),
      m("m22", "extras", "Oat Milk", "+0.75", "Creamy and dairy-free. Steamed on the shared wand (see the allergy policy!).", []),
      m("m23", "extras", "Almond Milk", "+0.75", "Nutty and light. Contains tree nuts.", ["treenut"]),
      m("m24", "extras", "Soy Milk", "+0.75", "Smooth and classic.", ["soy"]),
      m("m25", "extras", "Extra Shot", "+0.90", "One more shot of espresso.", []),
      m("m26", "extras", "Flavor Syrup", "+0.75", "Vanilla, caramel, brown sugar cinnamon, or hazelnut (hazelnut contains tree nuts).", []),
      m("m27", "extras", "Sweet Cream Foam", "+1.00", "Vanilla sweet cream, whipped and floated on top of any cold drink.", ["dairy"]),
    ],
    policies: [
      {
        id: "p1",
        title: "Allergies & Food Safety",
        emoji: "🌰",
        category: "allergy",
        body: [
          "- We never guess about allergens. Ever. If you are not 100% sure, say \"Let me check\" and check.",
          "- Every allergen is listed on this sheet. Look it up together with the guest.",
          "- All milks are steamed on the same steam wand, including almond milk. We wipe and purge between drinks, but we cannot promise zero cross-contact. Always tell the guest this.",
          "- For any severe allergy, bring in the shift lead or GM before making the drink.",
          "- Safer options: a sanitized steam pitcher and wand (takes about 2 minutes), a packaged drink, brewed tea, or plain drip coffee.",
          "- Log every allergy conversation in the shift notes.",
        ].join("\n"),
      },
      {
        id: "p2",
        title: "Remakes, Refunds & Credits",
        emoji: "🔁",
        category: "policy",
        body: [
          "- Wrong or unhappy? We remake it free, no questions asked, within 30 minutes.",
          "- For a drink that's mostly finished, offer a remake or a partial credit first.",
          "- Any refund or credit over $8 needs manager approval. Never promise a refund before it is approved.",
          "- Explain the policy kindly and never blame a coworker.",
          "- Say \"Here's what I can do\" instead of \"We can't\".",
        ].join("\n"),
      },
      {
        id: "p3",
        title: "Wait Times & Mobile Orders",
        emoji: "⏱️",
        category: "guests",
        body: [
          "- Mobile orders should be ready in about 5 minutes. Tell guests an honest time.",
          "- Past 10 minutes: apologize, take ownership, check the order, and give a real time.",
          "- Never say \"we're just really busy\". Guests know. They want to hear what you will do about it.",
          "- Offer a make-good such as a free cookie or a credit toward the next drink.",
        ].join("\n"),
      },
      {
        id: "p4",
        title: "S.I.P. Service Recovery",
        emoji: "💜",
        category: "recovery",
        body: [
          "- S: Say sorry specifically (\"I'm sorry your latte was wrong twice\").",
          "- I: Immediately fix it, and repeat the order back so it's right.",
          "- P: Pop back a minute later to check it landed. A small goodwill gesture is welcome.",
        ].join("\n"),
      },
      {
        id: "p5",
        title: "Rush Hour Playbook",
        emoji: "🚦",
        category: "rush",
        body: [
          "- Greet every guest, even when the line is out the door. Thank people for waiting.",
          "- Repeat the full order back. Re-confirm after any mid-order change.",
          "- Label every cup and call names clearly.",
          "- Line of 8+ people? Call the shift lead for backup. Asking for help is a strength.",
        ].join("\n"),
      },
      {
        id: "p6",
        title: "Comps & Freebies",
        emoji: "🎁",
        category: "policy",
        body: [
          "- Any team member can comp up to $5 (a drink or a pastry) to fix a problem.",
          "- $5 to $8: check with a shift lead. Over $8: a manager approves.",
          "- Comps fix problems. They are not for friends, no matter how nice they are.",
        ].join("\n"),
      },
      {
        id: "p7",
        title: "Scale & Coin Perk",
        emoji: "🪙",
        body: "- Members of Scale & Coin get everything for free. Everything!",
        noAi: true,
      },
    ],
    log: [
      { id: "l2", date: updatedOn, who: "Michelle Krzyzewski", text: "Updated Allergies & Food Safety: added the shared steam wand disclosure and the sanitized-wand option.", affects: ["allergy"] },
      { id: "l1", date: firstPublished, who: "Michelle Krzyzewski", text: "Published the first Cameron Coffee Co. menu & policy sheet." },
    ],
  };
}

// Plain-text version fed to the AI so scenarios, guests and grading stay grounded in the sheet
export function handbookText(h: Handbook): string {
  const menu = h.menu
    .map((i) => `- ${i.name} (${i.price}): ${i.description}${i.allergens.length ? ` [contains: ${i.allergens.join(", ")}]` : ""}`)
    .join("\n");
  const policies = h.policies
    .filter((p) => !p.noAi)
    .map((p) => `${p.title}:\n${p.body}`)
    .join("\n\n");
  return `MENU\n${menu}\n\nPOLICIES\n${policies}`.slice(0, 6000);
}
