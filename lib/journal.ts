export type JournalArticle = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  tone: "rose" | "olive" | "blue" | "clay" | "sand" | "plum";
  /** Real article image. When set, shown instead of the illustration.
   *  Put files in public/journal/<slug>.png. */
  image?: string | null;
  body: string[];
};

export const articles: JournalArticle[] = [
  {
    slug: "a-wardrobe-that-moves-with-you",
    title: "A wardrobe that moves with you",
    category: "Style notes",
    date: "September 2026",
    readTime: "4 min read",
    tone: "olive",
    image: "/journal/a-wardrobe-that-moves-with-you.png",
    excerpt:
      "The best wardrobe is not the most expensive one — it is the one that fits the actual rhythm of your life. A guide to building a collection that works as hard as you do.",
    body: [
      "There is a particular kind of exhaustion that comes from standing in front of a full wardrobe and finding nothing to wear. You have things — plenty of them — but somehow they don't add up to outfits. They don't move with the day the way you need them to.",
      "The wardrobe that moves with you is not about having more. It is about having the right things, in conversation with each other.",
      "Start with your actual week. Not the week you aspire to, but the one you live. The meetings, the errands, the evenings that start professional and end casual, the festivals that arrive with more notice than you planned for. What does that week ask of your clothes?",
      "Indian dressing has always been practical in this way. A good kurta transitions from a morning meeting to a family dinner without effort. A well-draped saree has carried women through ceremonies and conversations for generations. The intelligence is already in the tradition — we just need to let it.",
      "At AURELIA, we think about this constantly. Every silhouette begins with the question: where will she wear this, and what will she need from it? The answer shapes the cut, the fabric, the weight. A piece that knows its purpose wears differently — better.",
      "Build your wardrobe the same way. Start with the anchors — the pieces that appear in every version of your week. Add the occasion pieces that earn their hanger space. Then, only then, the things that purely delight you.",
      "That is a wardrobe worth having.",
    ],
  },
  {
    slug: "small-details-lasting-impressions",
    title: "Small details, lasting impressions",
    category: "Craft",
    date: "September 2026",
    readTime: "3 min read",
    tone: "clay",
    image: "/journal/small-details-lasting-impressions.png",
    excerpt:
      "The hem finish, the button placement, the weight of the fabric against your wrist. The details no one notices consciously are the ones that make everything feel right.",
    body: [
      "Nobody talks about the hem. They talk about the colour, the silhouette, the occasion — but the hem is what they feel when they brush past you, what they notice when they look twice, what separates a garment that holds its shape from one that doesn't.",
      "Craft lives in the details that aren't announced.",
      "Indian textiles have always understood this. The gota work edging a dupatta. The contrast piping on a collar. The way block-printed fabric is cut so the pattern aligns at the seam, requiring more cloth and more time and more care. These are choices made by hands that know what they're doing.",
      "When we design at AURELIA, we spend a disproportionate amount of time on the things you won't see in a photograph. The facing on the neckline. The quality of the interlining. Whether the pocket opens naturally or fights you.",
      "This is not perfectionism — or not only. It is respect. Respect for the time it takes to make something, and for the woman who will wear it and feel, without being able to say exactly why, that it is right.",
      "The best-dressed women we know are not the ones wearing the most recognisable pieces. They are the ones in whom everything simply works. That is craft. That is detail. That is what we are trying to build.",
    ],
  },
  {
    slug: "the-many-moods-of-occasionwear",
    title: "The many moods of occasionwear",
    category: "Style notes",
    date: "August 2026",
    readTime: "5 min read",
    tone: "plum",
    image: "/journal/the-many-moods-of-occasionwear.png",
    excerpt:
      "Occasion dressing in India is its own language. Wedding season, festive calendars, the office Diwali party. Here is how to dress for all of it without starting from scratch each time.",
    body: [
      "The Indian calendar is generous with occasions. There is the pre-wedding lunch, the office Diwali celebration, the cousin's engagement, the festival that arrives on a Tuesday when you have a meeting in the morning. The occasions are not the same, but somehow the panic is.",
      "Occasionwear in India is not a category — it is a spectrum. And yet most wardrobes treat it as a series of one-time purchases: one heavily embellished lehenga worn twice, a saree for weddings only, a kurta set that felt right for the office party three years ago.",
      "The better approach is to think in terms of dressing registers rather than specific events. What is the weight of this occasion? Who will be there and what will they wear? Is it celebratory, formal, festive, or some combination of all three?",
      "A fluid lehenga in soft plum reads differently at a sangeet than at a corporate Diwali party — but it works at both. A chanderi kurta set elevated with the right jewellery carries morning-to-evening without effort. The occasion does not dictate the garment as rigidly as we think.",
      "This is the Indian dressing superpower that AURELIA is built on: the ability of good Indian clothing to flex. To be festive without being costume. To be formal without being stiff. To be beautiful without being occasion-specific.",
      "When you invest in pieces with this flexibility, the wardrobe problem solves itself. You stop buying for the event and start building for the life.",
      "That is the mood we are designing for.",
    ],
  },
  {
    slug: "quiet-details",
    title: "Quiet details",
    category: "Craft",
    date: "August 2026",
    readTime: "3 min read",
    tone: "sand",
    image: "/journal/quiet-details.png",
    excerpt:
      "There is a kind of beauty that doesn't announce itself. It waits for you to notice. This is the beauty AURELIA is interested in.",
    body: [
      "Loud fashion announces itself. It needs to be seen from across the room, to be recognised, to register in a photograph. There is nothing wrong with this — sometimes that is exactly what the moment calls for.",
      "But there is another kind of dressing. Quieter. The kind where the quality reveals itself slowly — through the weight of the fabric, the way a colour shifts in different light, the precision of a seam. The kind that improves on acquaintance.",
      "Indian textiles are particularly suited to this quiet beauty. Handwoven fabric has an irregularity that photographs poorly but feels extraordinary. Block-printed cotton has a softness that develops with washing. Natural dyes deepen and change with wear and light.",
      "This is what we mean at AURELIA by 'original concepts'. Not newness for its own sake, but a considered point of view — pieces designed to be noticed slowly and worn for a long time.",
      "The best compliment a piece of clothing can receive is not 'where did you get that?' It is 'you always look so good.' That is the quiet detail at work.",
    ],
  },
  {
    slug: "the-art-of-layering",
    title: "The art of layering",
    category: "Style notes",
    date: "July 2026",
    readTime: "4 min read",
    tone: "blue",
    image: "/journal/the-art-of-layering.png",
    excerpt:
      "India's climate is demanding and varied. Layering is not a winter-only strategy — it is the year-round skill that takes an outfit from good to considered.",
    body: [
      "In a country with the range of climates India has, layering is not a style choice — it is a survival skill. The air conditioning in the office, the heat outside, the evening that turns cool by nine. Your outfit needs to work across all of it.",
      "Indian dressing has always had its own layering logic. The dupatta is the original layer — draped, pinned, or casually carried, it adds coverage, colour, and ceremony as needed. The shrug. The long line jacket over a kurta. The sari blouse worn under a dress.",
      "These are not Western style rules imported into Indian wardrobes. They are indigenous solutions to real dressing problems.",
      "AURELIA's approach to layering starts with the anchor piece — the garment that works on its own. Then we consider what it gains with a layer: does the dupatta complete it? Does the jacket give it a different life? Does the contrast colour underneath change its register?",
      "A well-layered outfit is not more complex — it is more versatile. Three pieces that work together give you more options than ten that don't.",
      "Start with proportion. The longest layer frames the outfit. The middle layer creates interest. The closest layer — the one against your skin — is about comfort and fit. When all three are in conversation, getting dressed becomes a pleasure rather than a problem.",
    ],
  },
  {
    slug: "a-softer-palette",
    title: "A softer palette",
    category: "Colour",
    date: "July 2026",
    readTime: "3 min read",
    tone: "rose",
    image: "/journal/a-softer-palette.png",
    excerpt:
      "The case for muted colour in a culture that loves saturation. Why earth tones, dusty roses, and warm ivories are having a moment — and why it makes sense.",
    body: [
      "Indian fashion has always celebrated colour. Saturated magentas, jewel-toned greens, the saffron of celebration and the red of brides. This is a beautiful tradition. But there is a quieter palette that has been gaining ground — and it feels like a conversation rather than a departure.",
      "Earth tones have always existed in Indian textiles. The undyed cotton, the natural beige of khadi, the ochre of turmeric-dyed cloth. These are not new colours — they are the oldest ones.",
      "What has changed is how we are wearing them. Muted rose against warm ivory. Dusty blue with soft olive. Terracotta with natural linen. These combinations feel contemporary precisely because they draw from something very old — the natural dye palette that predates synthetic colour by centuries.",
      "At AURELIA, we are working in this register. Our palette is rooted in the earth — warm, approachable, and designed to mix. A dusty blue kurta pairs with an earth rose dupatta in a way that a saturated cobalt and hot pink would fight.",
      "This is not a rejection of Indian colour — it is an argument for the other half of the tradition. The part that has always been there, waiting to be worn.",
    ],
  },
];

export const getArticle = (slug: string) => articles.find(a => a.slug === slug);
