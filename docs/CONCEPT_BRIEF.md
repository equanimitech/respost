# Respost — Concept Brief

*A mindful social network where moments are postcards and the feed is a map.*

---

## The Idea in One Sentence

A social network where every post is a geolocated "virtual postcard" — a photo + short message from a real place — and the primary interface is a map of your connections' recent moments, not a scrollable feed.

---

## Core Design Bets

### 1. Map as Primary UI
The feed IS the map. You open the app and see a geography with dots where your friends have had moments. You explore spatially, not chronologically. This changes the browsing mindset from consumption to exploration — you navigate, you don't scroll.

### 2. Mandatory Geolocation ("The Realness Constraint")
Every moment must be tied to a physical location. No posting from the couch about something abstract. This constraint filters out performative content and anchors sharing in lived experience. The place IS the content; the message is secondary.

### 3. Virtual Postcards as Format
Moments are designed like postcards: a photo/image + a short message from a specific place. The postcard format does several things at once — it constrains length (brief by design), implies personal address (not broadcast), and signals that sharing happened AFTER the experience (reflection, not interruption).

---

## What This Is / What This Isn't

| This IS | This is NOT |
|---|---|
| A map of where friends have been + what they noticed | Real-time location tracking (Bump/Zenly) |
| Virtual postcards from real places | A content creation tool (no filters, reels, stories) |
| Ambient awareness of your people's lives | A discovery platform (no explore, no trending) |
| "Checking on a friend" | "Scrolling a feed" |
| Reflection after the moment | Interruption during the moment |
| Close connections only | Followers/following/audience-building |

**The critical distinction from Bump/Zenly**: They show *where you are now*. This shows *where you've been + what you noticed*. The difference between surveillance and reflection.

---

## Competitive Landscape

### Direct Competitors: None (gap exists)

No app currently combines map-first UI + mandatory geolocation + postcard-format moments + convivial design philosophy.

### Adjacent Players

| App | Overlap | Gap |
|---|---|---|
| **Bump** (ex-Zenly team) | Map as social UI, friend locations | Real-time tracking, not moments. Surveillance, not reflection. |
| **BeReal** | "Realness" constraint, authentic sharing | Feed-first, not map-first. Random prompts feel obligatory. Declined after novelty faded. |
| **Instagram Map** (2025) | Geolocated posts on a map | Bolted onto an extractive feed. Map is for discovery/businesses, not intimacy. |
| **Gowalla** (relaunched 2023) | "The Social Map" concept, check-ins | Paused development within weeks of relaunch. Venue/check-in model, not postcard model. |
| **Retro** | Intimate photo sharing, postcard feature | Not geolocated, not map-first. Memory-focused, not place-focused. |
| **Snap Map** | Friends on a map, location sharing | Embedded in attention-extractive Snapchat. Location is ambient, not intentional. |

### Why the Gap Exists

Previous attempts failed for specific reasons:
- **Gowalla** tried map-first but used the Foursquare/check-in model (gamification, venues) — wrong metaphor
- **BeReal** proved "realness" demand but chose time-based constraints over place-based — became an obligation
- **Zenly/Bump** proved map-as-UI works for Gen Z but chose surveillance over reflection — privacy backlash
- **Path/Vero/Peach** proved desire for intimate social but kept the feed — couldn't differentiate enough

Nobody has tried: **map + postcard + convivial**. This is the white space.

---

## Conviviality Evaluation

Running against your three-framework test (Illich + Franklin + Weiser):

### Layer 1: Conviviality (Illich) — PASSES ✓

| Question | Assessment |
|---|---|
| Extends capability without replacing? | ✓ Extends natural "sharing where I've been" without replacing the experience |
| User can work without it? | ✓ Postcards are additive, not dependency-creating |
| Creates radical monopoly? | ✓ Low risk — small-network model, no FOMO loops |
| Delivers in quanta? | ✓ A single postcard has value; no minimum engagement required |
| Infrastructure-independent? | ⚠️ Requires phone + GPS + internet — not local-first by default |

### Layer 2: Holistic Production (Franklin) — PASSES ✓

| Question | Assessment |
|---|---|
| User controls process? | ✓ Choose what, when, where to share |
| Requires judgment? | ✓ Composing a postcard is a craft act |
| Skill increases with use? | ✓ Writing good postcards IS a learnable skill (brevity, evocation) |
| Process transparent? | ✓ No algorithm — you see what your connections share, period |
| User determines "good" output? | ✓ No likes, no metrics — quality is self-determined |

### Layer 3: Calm Technology (Weiser/Case) — PASSES ✓ (with caveats)

| Question | Assessment |
|---|---|
| Requires minimal focal attention? | ✓ Map is glanceable — dots on geography, tap if curious |
| Operates peripherally? | ✓ No chronological pressure — a postcard from 3 days ago is still a postcard |
| No false urgency? | ✓ No feed to "catch up" on, no notification-driven engagement |
| Respects attention as scarce? | ⚠️ Depends on notification design — could drift into attention capture |
| Fails gracefully? | ✓ If you don't open it for a week, nothing bad happens |

**Overall: Passes all three frameworks** — rare for a social network. But there are design decisions that could break this (notifications, gamification, growth mechanics).

---

## Key Behavioral Bets

### The Core Hypothesis
*By making the map the primary interface and the postcard the primary format, we shift social sharing from performance-driven broadcasting to place-anchored reflection.*

### Behavioral Mechanisms at Play

1. **Environmental restructuring** — Map UI changes the browsing context from consumption to spatial exploration
2. **Commitment/consistency** — Mandatory geolocation creates a "realness" commitment that filters performative content
3. **Constraint-driven quality** — Postcard format (photo + short message) forces craft, like haiku constraints
4. **Social reward restructuring** — No likes, no follower counts; the reward is seeing your network's map light up

### The Behavioral Shift

```
FROM: Performance-driven sharing
      (likes, reach, followers, algorithmic amplification)

TO:   Place-anchored reflection
      (where was I, what did I notice, who am I sharing this with)
```

---

## Tensions to Resolve

### 1. Privacy Paradox 🔴
Mandatory geolocation creates a rich location history. Even without real-time tracking, a map of someone's movements is sensitive data. This needs architectural answers: local-first storage? Ephemeral postcards? Fuzzy geolocation (neighborhood, not exact GPS)?

### 2. Cold Start Problem 🟡
A map with 2 dots is depressing. How does the app feel alive before you have a network? Could you seed with your own past moments? Import from Instagram? Show "postcards from strangers" in your area as a discovery mode?

### 3. Engagement Without Addiction 🟡
The app needs enough pull to be opened without creating compulsive checking. The postcard metaphor helps (you check the mailbox once a day, not every 5 minutes) — but does that generate enough retention for a product?

### 4. Scale vs. Conviviality 🟡
Social networks need network effects to survive. Network effects create dependency (Illich). How do you grow without becoming what you're resisting? Possible answers: open protocol (ActivityPub/AT Protocol), cooperative ownership, subscription model.

### 5. Business Model 🔴
If you reject ads, algorithmic amplification, and data extraction — how does this sustain itself? Options: subscription (Retro model), cooperative (user-owned), open-source + hosted (Mastodon model), one-time purchase.

### 6. Map UX at Different Scales 🟡
A map works when friends are spread across a city. It fails when 5 friends post from the same café (dot clustering) or when your network is global (constant zooming). Needs smart clustering and multi-scale design.

---

## The Postcard Metaphor — Why It's Stronger Than It Seems

Real postcards have properties that are accidentally perfect for convivial social design:

- **Sent after the moment** — reflection, not interruption
- **Brief by design** — physical card constrains length
- **Personal address** — sent to someone, not broadcast
- **Place IS the content** — the image is the location, the message is secondary
- **No response expected** — no engagement loop
- **Arrive with delay** — no real-time pressure (consider: intentional delay?)
- **Collectible** — people keep postcards; they form a personal archive

The question: should you lean into ALL of these properties (including intentional delay), or just some?

---

## Open Questions for Next Stages

1. **Who is this for first?** Travelers? Close friend groups? Expat communities? Couples in long-distance relationships?
2. **What's the appetite?** Is this a side project, a startup, or a concept for your writing?
3. **Protocol or product?** Should this be a closed app or an open protocol (AT Protocol/ActivityPub) that anyone can build on?
4. **Intentional delay?** Should postcards arrive hours/days later, mimicking real mail? Or is that too precious?
5. **Labeling system?** Your notes mention "labelable" — what kind of labels? Moods? Categories? Tags?

---

## Next Steps

When you're ready to go deeper, we can:
- **Run Feature Lab Stages 1–4** on the sub-features (map UI, postcard format, geolocation, labels) with full BCT/PDP behavioral analysis
- **Shape a hypothesis** for the riskiest assumption (likely: "people will share more mindfully when constrained to postcards from real places")
- **Produce a Shape-Up pitch** with appetite, rabbit holes, and no-gos

---

*Concept brief produced March 11, 2026*
*Project: Respost (m.15)*
