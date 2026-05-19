// ============================================================
// Respost — Fake fixtures
// Demo data for UI work, previews, storybook-style harnesses.
// Domain shape only; no infra deps. Image URLs use Unsplash.
// ============================================================

import type {
  ArticleBlock,
  Block,
  BlockId,
  Did,
  Location,
  MarkdownBlock,
  MusicBlock,
  PhotoBlock,
  PlaceBlock,
  PlaceName,
  Postcard,
  PostcardId,
  RecipientName,
  SenderName,
  VideoBlock,
} from "@/domain/types";

// --- helpers ---

const bid = (s: string) => s as BlockId;
const pid = (s: string) => s as PostcardId;
const did = (s: string) => s as Did;
const rn = (s: string) => s as RecipientName;
const sn = (s: string) => s as SenderName;
const pn = (s: string) => s as PlaceName;

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// --- fake users (sender/recipient pool) ---

export type FakeUser = {
  readonly did: Did;
  readonly handle: string;
  readonly displayName: string;
  readonly avatarUrl: string;
};

export const fakeUsers: ReadonlyArray<FakeUser> = [
  {
    did: did("did:plc:rafa3kq2zgp7t8h4yvbm0a01"),
    handle: "rafa.respost.network",
    displayName: "Rafa",
    avatarUrl: unsplash("1535713875002-d1d0cf377fde", 200),
  },
  {
    did: did("did:plc:yanik8gmw4t2c0fr9hsve6k2"),
    handle: "yanik.respost.network",
    displayName: "Yanik",
    avatarUrl: unsplash("1500648767791-00dcc994a43e", 200),
  },
  {
    did: did("did:plc:noor7p3xt9j6umd4kqlv1ab8"),
    handle: "noor.respost.network",
    displayName: "Noor",
    avatarUrl: unsplash("1494790108377-be9c29b29330", 200),
  },
  {
    did: did("did:plc:elif5jb2nq0fc4kpwhx7t9ms"),
    handle: "elif.respost.network",
    displayName: "Elif",
    avatarUrl: unsplash("1438761681033-6461ffad8d80", 200),
  },
  {
    did: did("did:plc:saul9wd3rkpv8x2qmtfh5nlb"),
    handle: "saul.respost.network",
    displayName: "Saul",
    avatarUrl: unsplash("1507003211169-0a1dd7228f2d", 200),
  },
  {
    did: did("did:plc:mira6jq8hsbn3p7zwgl0vc4t"),
    handle: "mira.respost.network",
    displayName: "Mira",
    avatarUrl: unsplash("1544005313-94ddf0286df2", 200),
  },
];

// --- fake image URLs (uploaded "photo" blocks) ---

export const fakeImages = {
  cafe: unsplash("1521017432531-fbd92d768814"),
  beach: unsplash("1507525428034-b723cf961d3e"),
  street: unsplash("1444084316824-dc26d6657664"),
  river: unsplash("1502082553048-f009c37129b9"),
  window: unsplash("1519302959554-a75be0afc82a"),
  mountain: unsplash("1506905925346-21bda4d32df4"),
  forest: unsplash("1448375240586-882707db888b"),
  sunset: unsplash("1500530855697-b586d89ba3ee"),
  market: unsplash("1488459716781-31db52582fe9"),
  trainwindow: unsplash("1474487548417-781cb71495f3"),
} as const;

// --- fake handwriting scans (handwriting "photo" blocks) ---
//
// Two flavors:
//   `fakeHandwritings`        — Unsplash stand-ins for the six demo cards
//   `journalHandwritings`     — real Supernote pages from
//                                public/fixtures/handwriting/ (PDF 2025-05-10)

export const fakeHandwritings = {
  letterA: unsplash("1455390582262-044cdead277a"),
  letterB: unsplash("1517842645767-c639042777db"),
  notebook: unsplash("1493612276216-ee3925520721"),
  postcard: unsplash("1457369804613-52c61a468e7d"),
  inkPage: unsplash("1456735190827-d1262f71b8a3"),
} as const;

const journalPage = (n: number) =>
  `/fixtures/handwriting/page-${String(n).padStart(2, "0")}.png`;

export const journalHandwritings = {
  m5_barcelona: journalPage(1),
  m8_supernote: journalPage(3),
  m9_terrace: journalPage(4),
  m10_saperene: journalPage(5),
  structureFreedom: journalPage(6),
  m11_goals: journalPage(7),
  mapCompass: journalPage(8),
  m12_publishing: journalPage(9),
  m17_diet: journalPage(10),
  slowCarb: journalPage(11),
  bingeProtein: journalPage(12),
  chineseProverb: journalPage(13),
  m22_inBed: journalPage(14),
} as const;

// --- fake URLs for non-photo blocks ---

export const fakeUrls = {
  music: {
    spotify: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    apple:
      "https://music.apple.com/us/album/blue-in-green/1422648512?i=1422648745",
    youtube: "https://www.youtube.com/watch?v=vmDDOFXSgAs",
    soundcloud: "https://soundcloud.com/nilsfrahm/says",
    bandcamp: "https://nilsfrahm.bandcamp.com/track/says",
  },
  video: {
    sunset: "https://www.youtube.com/watch?v=Eo-KmOd3i7s",
    walk: "https://www.youtube.com/watch?v=8jPQjjsBbIc",
  },
  article: {
    nyt: "https://www.nytimes.com/2024/06/12/travel/lisbon-quiet-corners.html",
    paris: "https://www.theguardian.com/travel/2024/may/03/paris-cafes-walks",
    blog: "https://craigmod.com/essays/kissa_by_kissa/",
  },
  place: {
    cafeOto: "https://maps.app.goo.gl/8YxKvHnW3vJpQbcz9",
    parcGuell: "https://maps.app.goo.gl/9PfdRtAwLeNqMx2k6",
    bondiBeach: "https://maps.app.goo.gl/Lf2c7TmNoRz5J9eN8",
  },
} as const;

// --- fake locations ---

const locBarcelona: Location = {
  name: "Barcelona, Spain",
  latitude: 41.3851,
  longitude: 2.1734,
  granularity: "city",
};
const locLisbon: Location = {
  name: "Lisbon, Portugal",
  latitude: 38.7223,
  longitude: -9.1393,
  granularity: "city",
};
const locKyoto: Location = {
  name: "Kyoto, Japan",
  latitude: 35.0116,
  longitude: 135.7681,
  granularity: "city",
};
const locParis: Location = {
  name: "Le Marais, Paris",
  latitude: 48.8575,
  longitude: 2.3622,
  granularity: "neighborhood",
};
const locOaxaca: Location = {
  name: "Oaxaca, Mexico",
  latitude: 17.0732,
  longitude: -96.7266,
  granularity: "city",
};
const locReykjavik: Location = {
  name: "Reykjavík, Iceland",
  latitude: 64.1466,
  longitude: -21.9426,
  granularity: "city",
};

export const fakeLocations = {
  barcelona: locBarcelona,
  lisbon: locLisbon,
  kyoto: locKyoto,
  paris: locParis,
  oaxaca: locOaxaca,
  reykjavik: locReykjavik,
} as const;

// --- block factories (use external URL via `image.ref`) ---

const md = (id: string, text: string): MarkdownBlock => ({
  type: "md",
  id: bid(id),
  md: text,
});

const photo = (
  id: string,
  url: string,
  caption?: string,
  rot = -1
): PhotoBlock => ({
  type: "photo",
  id: bid(id),
  kind: "uploaded",
  image: { ref: url, mimeType: "image/jpeg" },
  caption,
  rot,
});

const handwriting = (id: string, url: string, rot = 2): PhotoBlock => ({
  type: "photo",
  id: bid(id),
  kind: "handwriting",
  image: { ref: url, mimeType: "image/jpeg" },
  rot,
});

const music = (
  id: string,
  args: Omit<MusicBlock, "type" | "id">
): MusicBlock => ({ type: "music", id: bid(id), ...args });

const video = (
  id: string,
  args: Omit<VideoBlock, "type" | "id">
): VideoBlock => ({ type: "video", id: bid(id), ...args });

const place = (
  id: string,
  args: Omit<PlaceBlock, "type" | "id">
): PlaceBlock => ({ type: "place", id: bid(id), ...args });

const article = (
  id: string,
  args: Omit<ArticleBlock, "type" | "id">
): ArticleBlock => ({ type: "article", id: bid(id), ...args });

// --- fake postcards ---

const [rafa, yanik, noor, elif, saul, mira] = fakeUsers;

const card1Blocks: ReadonlyArray<Block> = [
  handwriting("hw1", fakeHandwritings.letterA, 1.5),
  md(
    "md1",
    "Walked all the way down to the harbour this morning. The light on the water keeps reminding me of that summer in Cadaqués."
  ),
  photo("ph1", fakeImages.cafe, "Café Granja, 8:14am", -2),
  music("mu1", {
    url: fakeUrls.music.spotify,
    service: "spotify",
    title: "So What",
    artist: "Miles Davis",
    album: "Kind of Blue",
    dur: "9:22",
    tone: "a",
  }),
  place("pl1", {
    url: fakeUrls.place.parcGuell,
    name: "Parc Güell",
    addr: "08024 Barcelona",
    caption: "Walked up at sunrise. Nearly empty.",
    latitude: 41.4145,
    longitude: 2.1527,
  }),
];

const card2Blocks: ReadonlyArray<Block> = [
  md(
    "md2",
    "Lisbon is slower than I remembered. Tiles, hills, and a cat in every doorway."
  ),
  photo("ph2", fakeImages.street, "Alfama backstreet", -1),
  article("ar1", {
    url: fakeUrls.article.nyt,
    host: "nytimes.com",
    title: "Lisbon's Quiet Corners",
    excerpt:
      "Beyond the trams and the miradouros, the city's softest hours happen between 6 and 8 in the morning.",
    imageUrl: fakeImages.window,
  }),
  handwriting("hw2", fakeHandwritings.notebook, -2),
];

const card3Blocks: ReadonlyArray<Block> = [
  photo("ph3", fakeImages.forest, "Arashiyama, just after dawn", 0),
  md(
    "md3",
    "I keep forgetting how loud bamboo is when the wind moves through it. Sounds like a whole crowd whispering."
  ),
  video("vi1", {
    url: fakeUrls.video.walk,
    service: "youtube",
    title: "Kyoto morning walk · 4K",
    channel: "Rambalac",
    dur: "1:02:14",
    thumbUrl: fakeImages.forest,
  }),
  place("pl2", {
    url: "https://maps.app.goo.gl/arashiyama-bamboo",
    name: "Arashiyama Bamboo Grove",
    addr: "Ukyō Ward, Kyoto",
    latitude: 35.0094,
    longitude: 135.6717,
  }),
];

const card4Blocks: ReadonlyArray<Block> = [
  handwriting("hw3", fakeHandwritings.postcard, -3),
  md(
    "md4",
    "Bought a croissant at the place you told me about. You were right — best in the arrondissement."
  ),
  photo("ph4", fakeImages.market, "rue de Bretagne", 1),
  music("mu2", {
    url: fakeUrls.music.youtube,
    service: "youtube",
    title: "Clair de Lune",
    artist: "Claude Debussy",
    dur: "5:08",
    tone: "b",
  }),
];

const card5Blocks: ReadonlyArray<Block> = [
  md(
    "md5",
    "The market opens at 5. Mole almendrado, tlayudas the size of my torso, and a woman selling chocolate from a wheelbarrow."
  ),
  photo("ph5", fakeImages.market, "Mercado 20 de Noviembre", -1.5),
  photo("ph6", fakeImages.street, undefined, 2),
  article("ar2", {
    url: fakeUrls.article.blog,
    host: "craigmod.com",
    title: "Kissa by Kissa",
    excerpt: "A walk through Japan, one toast set at a time.",
    imageUrl: fakeImages.cafe,
  }),
];

const card6Blocks: ReadonlyArray<Block> = [
  photo("ph7", fakeImages.mountain, "From the road outside Vík", 0),
  md(
    "md6",
    "There's a kind of quiet here that feels like it's pressing in from every direction. I wrote three pages this morning and didn't notice the time."
  ),
  music("mu3", {
    url: fakeUrls.music.soundcloud,
    service: "soundcloud",
    title: "Says",
    artist: "Nils Frahm",
    album: "Spaces",
    dur: "8:12",
    tone: "c",
  }),
  handwriting("hw4", fakeHandwritings.inkPage, 1),
];

// ----------------------------------------------------------------
// Journal-sourced postcards (Supernote 2025-05-10, Barcelona)
// Real handwriting pages from public/fixtures/handwriting/.
// ----------------------------------------------------------------

// Card 7 — Morning on the terrace (m.5, m.8, m.9)
const card7Blocks: ReadonlyArray<Block> = [
  handwriting("j5", journalHandwritings.m5_barcelona, -1.5),
  md(
    "md-j5",
    "Back in Barcelona. Landed yesterday and dove straight back into the old rhythms — habits, routines, the lot. Except meditation. Still procrastinating against that one."
  ),
  handwriting("j8", journalHandwritings.m8_supernote, 1.5),
  md(
    "md-j8",
    "Trying a new template on the Supernote this morning — French lined, tighter than what I'm used to. I think I like it. Templates feel like they could become a quiet, mindful way to keep checklists. Less app, more page."
  ),
  handwriting("j9", journalHandwritings.m9_terrace, -2),
  md(
    "md-j9",
    "Out on the terrace now. More freedom in this template.\n\nGrateful for: my home in Barcelona, the cycles of my life, my good shape.\n\nIntention for today: **meditate before I start working.**"
  ),
  photo("ph-j9", fakeImages.window, "the terrace, around nine", -1),
  place("pl-j9", {
    url: "https://maps.app.goo.gl/barcelona-terrace",
    name: "The terrace",
    addr: "Barcelona",
    caption: "morning light, Supernote, coffee.",
    latitude: 41.3851,
    longitude: 2.1734,
  }),
];

// Card 8 — On handwriting (m.10 + structure/freedom)
const card8Blocks: ReadonlyArray<Block> = [
  handwriting("j10", journalHandwritings.m10_saperene, -1),
  md(
    "md-j10",
    "Not many people write by hand anymore. And not everything I write makes it here — is that enough information?\n\nHandwriting is about uninterrupted flows of thought. Not editing, not organizing, not structuring. Unstructured by design, so the mind can express itself at its own pace."
  ),
  handwriting("j10b", journalHandwritings.structureFreedom, 2),
  md(
    "md-j10b",
    "We don't need structure in every moment.\n\n- Freedom is ideal for **exploration and creativity in the present.**\n- Structure is ideal for two things: (i) understanding the past through patterns and trends, and (ii) planning the future through schedules and checklists."
  ),
];

// Card 9 — Goals × intentions (m.11 + map/compass)
const card9Blocks: ReadonlyArray<Block> = [
  handwriting("j11", journalHandwritings.m11_goals, -1.5),
  md(
    "md-j11",
    "Been chewing on this all morning.\n\n- goals are structure, intentions are structuring\n- goals end in success or failure, intentions start from values\n- goals belong in finite games, intentions in infinite games\n- goals are external motivation, intentions are internal\n- goals and intentions are the paradoxical unity that drives personal growth"
  ),
  handwriting("j11b", journalHandwritings.mapCompass, 1.5),
  md(
    "md-j11b",
    "Our goals are the map. Our intentions are the compass."
  ),
];

// Card 10 — On publishing (m.12)
const card10Blocks: ReadonlyArray<Block> = [
  handwriting("j12", journalHandwritings.m12_publishing, -1),
  md(
    "md-j12",
    "My calligraphy is the blood of my articles. I can use AI to shape the veins that will guide the reader through them."
  ),
];

// Card 11 — On eating (m.17 + Chinese proverb)
const card11Blocks: ReadonlyArray<Block> = [
  handwriting("j17", journalHandwritings.m17_diet, -1.5),
  md(
    "md-j17",
    "When traveling, food is a great way to connect with culture viscerally — everything goes.\n\nAt home, nutrition should have more structure. Supplements help.\n\nReading Tim Ferriss on wellness and nutrition. Interesting accounts and experiments."
  ),
  handwriting("j17b", journalHandwritings.slowCarb, 1),
  md(
    "md-j17b",
    "The **slow carb diet**:\n\n- no white carbs\n- no fruits :(\n- no caloric drinks (even milk)\n- one cheat day per week (no skipping)\n\nBreakfast matters — eat it like any other meal.\n\nRecipes I'm trying:\n- breakfast: egg-white + egg omelette with mushrooms\n- lunch: spinach + arugula, lentils, tomato, tuna\n- dinner: chicken with red / black / pinto beans\n- nuts: almonds, walnuts (not too many). No peanuts."
  ),
  handwriting("j17c", journalHandwritings.bingeProtein, -2),
  md(
    "md-j17c",
    "Skipping breakfast is associated with binge eating in the evening. Eat 30g of protein within an hour of waking. Eat as much as needed to feel full.\n\nAvoid chickpeas, peanuts, hummus — domino foods. Once you start, you can't stop."
  ),
  handwriting("j17d", journalHandwritings.chineseProverb, 2),
  md(
    "md-j17d",
    "**Chinese proverb:** if you take 100 steps after each meal, you'll live to be 99 years old.\n\nFrame meals with light workouts. 30–50 squats, wall presses, chest pulls. A minute of muscular contraction right before, and two hours after."
  ),
];

// Card 12 — m.22, in bed
const card12Blocks: ReadonlyArray<Block> = [
  handwriting("j22", journalHandwritings.m22_inBed, -1),
  md(
    "md-j22",
    "Chill, intimate night with Tivo and Rod. A cool group to form.\n\nIt looks like all the pieces are ready to start processing our decisions — the pipeline is almost done.\n\nNot looking for deep new connections over the coming month. Lots of reading up on fitness and nutrition; now I just need to follow through."
  ),
];

const day = (offset: number) =>
  new Date(Date.now() - offset * 24 * 60 * 60 * 1000);

export const fakePostcards: ReadonlyArray<Postcard> = [
  {
    id: pid("3kpc1barcelona"),
    uri: `at://${rafa.did}/tech.equanimi.respost.postcard/3kpc1barcelona`,
    authorDid: rafa.did,
    to: rn("Yanik"),
    from: sn(rafa.displayName),
    place: pn("Barcelona"),
    senderLocation: locBarcelona,
    title: "Sunrise walk to the harbour",
    brief: "Café Granja, then Parc Güell before the crowds.",
    summary:
      "A quiet morning at Café Granja, then up to Parc Güell before the crowds. Miles Davis on the headphones and the light bouncing off the water.",
    cover: { ref: fakeImages.cafe, mimeType: "image/jpeg" },
    blocks: card1Blocks,
    createdAt: day(1),
  },
  {
    id: pid("3kpc2lisbon"),
    uri: `at://${yanik.did}/tech.equanimi.respost.postcard/3kpc2lisbon`,
    authorDid: yanik.did,
    to: rn("Mama"),
    from: sn(yanik.displayName),
    place: pn("Lisbon"),
    senderLocation: locLisbon,
    title: "Slow mornings in Alfama",
    brief: "Tiles, hills, a cat in every doorway.",
    summary:
      "Tiles, hills, and a cat in every doorway. Lisbon is taking its time with me this trip — and I'm letting it.",
    cover: { ref: fakeImages.street, mimeType: "image/jpeg" },
    blocks: card2Blocks,
    createdAt: day(3),
  },
  {
    id: pid("3kpc3kyoto"),
    uri: `at://${noor.did}/tech.equanimi.respost.postcard/3kpc3kyoto`,
    authorDid: noor.did,
    to: rn("Sam"),
    from: sn(noor.displayName),
    place: pn("Kyoto"),
    senderLocation: locKyoto,
    title: "Bamboo and dawn in Arashiyama",
    brief: "The grove before sunrise — sending you the quiet.",
    summary:
      "Got to the grove before sunrise — the wind through the stalks sounded like a whole crowd whispering. Sending you the quiet.",
    cover: { ref: fakeImages.forest, mimeType: "image/jpeg" },
    blocks: card3Blocks,
    createdAt: day(7),
  },
  {
    id: pid("3kpc4paris"),
    uri: `at://${elif.did}/tech.equanimi.respost.postcard/3kpc4paris`,
    authorDid: elif.did,
    to: rn("Léa"),
    from: sn(elif.displayName),
    place: pn("Paris"),
    senderLocation: locParis,
    title: "Croissants in the Marais",
    brief: "Found the bakery you wrote down. You were right.",
    summary:
      "Found the bakery you wrote down for me. You were right — best in the arrondissement. Clair de Lune the whole walk home.",
    cover: { ref: fakeImages.market, mimeType: "image/jpeg" },
    blocks: card4Blocks,
    createdAt: day(11),
  },
  {
    id: pid("3kpc5oaxaca"),
    uri: `at://${saul.did}/tech.equanimi.respost.postcard/3kpc5oaxaca`,
    authorDid: saul.did,
    to: rn("Dad"),
    from: sn(saul.displayName),
    place: pn("Oaxaca"),
    senderLocation: locOaxaca,
    title: "Five in the morning at the market",
    brief: "Mole, tlayudas, chocolate from a wheelbarrow.",
    summary:
      "Mole almendrado, tlayudas bigger than my torso, and a woman selling chocolate from a wheelbarrow. You would love it here.",
    cover: { ref: fakeImages.market, mimeType: "image/jpeg" },
    blocks: card5Blocks,
    createdAt: day(14),
  },
  {
    id: pid("3kpc6reykjavik"),
    uri: `at://${mira.did}/tech.equanimi.respost.postcard/3kpc6reykjavik`,
    authorDid: mira.did,
    to: rn("Theo"),
    from: sn(mira.displayName),
    place: pn("Reykjavík"),
    senderLocation: locReykjavik,
    title: "Three pages outside Vík",
    brief: "Quiet pressing in from every direction. Nils Frahm on repeat.",
    summary:
      "The quiet here presses in from every direction. Wrote three pages this morning without noticing the time. Nils Frahm on repeat.",
    cover: { ref: fakeImages.mountain, mimeType: "image/jpeg" },
    blocks: card6Blocks,
    createdAt: day(21),
  },
  {
    id: pid("3kpc7terrace"),
    uri: `at://${rafa.did}/tech.equanimi.respost.postcard/3kpc7terrace`,
    authorDid: rafa.did,
    to: rn("Yanik"),
    from: sn(rafa.displayName),
    place: pn("Barcelona, terrace"),
    senderLocation: locBarcelona,
    title: "Back on the Barcelona terrace",
    brief: "Coffee, Supernote, morning light.",
    summary:
      "Landed yesterday and slipped straight into the old rhythms. Coffee, Supernote, morning light. Meditation still pending.",
    cover: { ref: fakeImages.window, mimeType: "image/jpeg" },
    blocks: card7Blocks,
    createdAt: day(0),
  },
  {
    id: pid("3kpc8saperene"),
    uri: `at://${rafa.did}/tech.equanimi.respost.postcard/3kpc8saperene`,
    authorDid: rafa.did,
    to: rn("Noor"),
    from: sn(rafa.displayName),
    place: pn("Barcelona, terrace"),
    senderLocation: locBarcelona,
    title: "On handwriting and freedom",
    brief: "Why I still write by hand.",
    summary:
      "A few pages from the Supernote on why I still write by hand. Freedom for the present, structure for the past and the future.",
    blocks: card8Blocks,
    createdAt: day(0),
  },
  {
    id: pid("3kpc9goalsxintentions"),
    uri: `at://${rafa.did}/tech.equanimi.respost.postcard/3kpc9goalsxintentions`,
    authorDid: rafa.did,
    to: rn("Yanik"),
    from: sn(rafa.displayName),
    place: pn("Barcelona, terrace"),
    senderLocation: locBarcelona,
    title: "Goals are the map, intentions the compass",
    brief: "The paradox between goals and intentions.",
    summary:
      "Been chewing on the paradox between goals and intentions all morning. Sharing the page before the ink dries on the thought.",
    blocks: card9Blocks,
    createdAt: day(0),
  },
  {
    id: pid("3kpc10publishing"),
    uri: `at://${rafa.did}/tech.equanimi.respost.postcard/3kpc10publishing`,
    authorDid: rafa.did,
    to: rn("Yanik"),
    from: sn(rafa.displayName),
    place: pn("Barcelona"),
    senderLocation: locBarcelona,
    title: "Calligraphy is the blood",
    brief: "On writing and publishing.",
    summary:
      "One short line from this morning's page on writing and publishing — the part of the practice I keep coming back to.",
    blocks: card10Blocks,
    createdAt: day(0),
  },
  {
    id: pid("3kpc11eating"),
    uri: `at://${rafa.did}/tech.equanimi.respost.postcard/3kpc11eating`,
    authorDid: rafa.did,
    to: rn("Mira"),
    from: sn(rafa.displayName),
    place: pn("Barcelona"),
    senderLocation: locBarcelona,
    title: "Notes on eating, slow-carb style",
    brief: "Slow carbs, protein early, a hundred steps after.",
    summary:
      "Pages from a morning with Tim Ferriss — slow carbs, protein early, and a Chinese proverb about a hundred steps after each meal.",
    blocks: card11Blocks,
    createdAt: day(0),
  },
  {
    id: pid("3kpc12inbed"),
    uri: `at://${rafa.did}/tech.equanimi.respost.postcard/3kpc12inbed`,
    authorDid: rafa.did,
    to: rn("Yanik"),
    from: sn(rafa.displayName),
    place: pn("Barcelona"),
    senderLocation: locBarcelona,
    title: "A quiet night with Tivo and Rod",
    brief: "Pipeline nearly done. Reading more than reaching out.",
    summary:
      "Short one from bed. The pipeline is nearly done, the group feels right, and I'm reading more than reaching out this month.",
    blocks: card12Blocks,
    createdAt: day(0),
  },
];

export const fakePostcardById = new Map(fakePostcards.map((p) => [p.id, p]));
