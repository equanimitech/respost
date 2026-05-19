# Respost — MVP Pitch

*Postcards from real places, on a map, over AT Protocol.*

***

## Problem

Rafa is a nomad/expat. His close friends are scattered across continents. His grandparents are in one place. He wants to share where he's been and what he noticed — not broadcast content, not track locations in real-time, not perform for an audience. He wants to send postcards.

Instagram is too noisy. WhatsApp is too conversational. BeReal is too obligatory. Bump/Zenly is too surveillance. There is no app that says: "I was here. I saw this. Thinking of you."

***

## Appetite

**Big Batch: 2 weeks** (side project pace — evenings/weekends over \~6 weeks real time)

This constraint means: one record type, one map view, one creation flow. No notifications. No comments. No likes. No discovery. No onboarding.

***

## The Solution: Postcards on ATProto

### What a Postcard Is

A postcard is a record with five fields:

| Field       | Type                   | Required | Example                                     |
| ----------- | ---------------------- | -------- | ------------------------------------------- |
| `image`     | blob (photo)           | yes      | A photo from your phone                     |
| `message`   | string (max 300 chars) | yes      | "The sunset here is absurd"                 |
| `location`  | object                 | yes      | `{ name: "Barzin", lat, lng, granularity }` |
| `label`     | string                 | no       | "home", "office", "barzin"                  |
| `createdAt` | datetime               | yes      | ISO timestamp                               |

### Granularity Levels

The `granularity` field controls how precise the location appears to viewers:

```
establishment  →  "Barzin, Leblon"
neighborhood   →  "Leblon, Rio de Janeiro"
city           →  "Rio de Janeiro"
region         →  "Rio de Janeiro (state)"
country        →  "Brazil"
```

The sender chooses granularity per postcard. Grandma sees "Paris." A close friend sees "Café de Flore, Saint-Germain." This is privacy by design at the record level.

### The ATProto Lexicon

Namespace: `tech.equanimi.respost.postcard`

```json
{
  "lexicon": 1,
  "id": "tech.equanimi.respost.postcard",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["image", "message", "location", "createdAt"],
        "properties": {
          "image": {
            "type": "blob",
            "accept": ["image/jpeg", "image/png"],
            "maxSize": 1000000
          },
          "message": {
            "type": "string",
            "maxLength": 300,
            "maxGraphemes": 300
          },
          "location": {
            "type": "ref",
            "ref": "#location"
          },
          "label": {
            "type": "string",
            "maxLength": 50
          },
          "createdAt": {
            "type": "string",
            "format": "datetime"
          },
          "deliverAt": {
            "type": "string",
            "format": "datetime",
            "description": "Optional delayed delivery timestamp"
          }
        }
      }
    },
    "location": {
      "type": "object",
      "required": ["name", "granularity"],
      "properties": {
        "name": {
          "type": "string",
          "maxLength": 200
        },
        "latitude": {
          "type": "number"
        },
        "longitude": {
          "type": "number"
        },
        "granularity": {
          "type": "string",
          "knownValues": [
            "establishment",
            "neighborhood",
            "city",
            "region",
            "country"
          ]
        }
      }
    }
  }
}
```

### Architecture

```
┌─────────────────────────────┐
│  Your Phone (PWA or native) │
│  - Take photo               │
│  - Write message             │
│  - Pick/confirm location     │
│  - Choose granularity        │
│  - Choose label              │
└──────────┬──────────────────┘
           │ write record
           ▼
┌─────────────────────────────┐
│  Your PDS (Personal Data    │
│  Server — Bluesky hosted    │
│  or self-hosted)            │
│  - Stores postcard records  │
│  - You own your data        │
└──────────┬──────────────────┘
           │ firehose
           ▼
┌─────────────────────────────┐
│  AppView (your server)      │
│  - Aggregates postcards     │
│    from followed accounts   │
│  - Serves map data to UI    │
│  - Handles delivery delay   │
└──────────┬──────────────────┘
           │ API
           ▼
┌─────────────────────────────┐
│  Map UI (web app)           │
│  - MapLibre/Mapbox map      │
│  - Postcard markers         │
│  - Tap to view postcard     │
│  - Filter by label/person   │
└─────────────────────────────┘
```

**Key ATProto benefit**: Your postcards live on YOUR PDS. You own the data. If the app dies, your postcards survive. Anyone can build a different viewer. This is convivial by architecture.

***

## The Map UI

### What You See When You Open the App

A map. Dots where your connections have sent postcards. Recent ones are brighter. Old ones fade. Tap a dot → the postcard slides up (image, message, place name, when).

That's it. No feed. No scroll. No notifications badge.

### Interactions

```
Open app
  → See map centered on your last known position
  → Dots for connections' recent postcards
  → Pinch/zoom to explore
  → Tap dot → postcard slides up from bottom
  → Swipe down to dismiss

Create postcard
  → Tap "+" or camera icon
  → Take photo (or pick from library)
  → Auto-detect location (editable)
  → Choose granularity (how precise)
  → Add label (optional, from your saved labels)
  → Write message (≤300 chars)
  → Choose delay (none / 1h / 1d / 3d) ← open question
  → Send
```

### Map Clustering

When multiple postcards are near each other, they cluster into a number badge. Zoom in → they separate. This is standard MapLibre behavior — not a rabbit hole.

***

## Labels

Labels are user-defined place nicknames. They're personal, not global.

```
"home"     → your apartment in Lisbon
"barzin"   → that bar in Leblon
"grandma"  → grandma's house in [city]
"office"   → wherever you're coworking this month
```

Labels are stored per-user, not per-postcard. When you create a postcard from a location you've labeled, the label auto-suggests. Labels travel with you — "home" changes when you move.

**Lexicon for labels** (separate record type):

```
tech.equanimi.respost.label
  - name: "barzin"
  - location: { lat, lng, radius }
  - createdAt: datetime
```

When creating a postcard, the app checks: "Am I near any of my labels?" If yes, auto-suggest.

***

## The Delay Question (Open)

Real postcards take days. That delay is part of the magic — you receive a postcard from a place someone has already left. It's a trace, not a broadcast.

**Options**:

| Delay                      | Feeling                                     | Risk                                       |
| -------------------------- | ------------------------------------------- | ------------------------------------------ |
| None                       | Instant sharing, like texting a photo       | Feels like every other app                 |
| 1 hour                     | Slight temporal distance                    | Barely noticeable                          |
| 1 day                      | "Yesterday I was at..."                     | Sweet spot? Mimics real mail within a city |
| 3 days                     | Closer to real postcard timing              | Might feel broken for close connections    |
| Configurable per-recipient | Close friend gets instant, grandma gets 1-day | Complexity creep                         |

**Recommendation for MVP**: Default 0 delay, but include `deliverAt` in the lexicon so the AppView can support delay later. Don't solve this now.

***

## Rabbit Holes

1. **Geocoding/reverse geocoding**: Converting GPS coordinates into place names ("Café de Flore, Saint-Germain-des-Prés") requires a geocoding service (Nominatim/OpenStreetMap for free, Google Places for quality). For MVP, use Nominatim + let users edit the name manually.

2. **Photo storage on ATProto**: Blobs on PDS have size limits. Bluesky's current limit is \~1MB per blob. Photos need to be compressed client-side before upload. Not hard, but needs handling.

3. **Map tile costs**: MapLibre with OpenStreetMap tiles is free. Mapbox has a generous free tier (50k loads/month). For MVP with <20 users, cost is zero.

4. **ATProto social graph**: You follow people on ATProto (same as Bluesky follows). The AppView uses follows to determine whose postcards to show. No separate friend system needed for MVP.

5. **Offline creation**: Nomads are often offline. Postcards should be creatable offline and sync when connected. This is a PWA pattern but adds complexity. **Defer to v2.**

***

## No-Gos (Off-Sides)

* **No comments or reactions** — a postcard doesn't have a reply button

* **No notifications** — you check when you want to, like checking a mailbox

* **No follower counts** — no public social metrics of any kind

* **No explore/discover** — you only see people you follow

* **No stories/reels/ephemeral** — postcards persist (like real ones)

* **No algorithmic ordering** — map is spatial, not ranked

* **No onboarding flow** — sign in with ATProto, follow people, done

* **No native app for v1** — PWA first (installable web app)

***

## Tech Stack (Suggested)

```
Client:     Next.js (PWA) + MapLibre GL JS
Auth:       ATProto OAuth (atproto.com/specs/oauth)
Backend:    Node.js AppView (or Elixir if you prefer)
Data:       ATProto PDS (postcards stored as records)
Maps:       MapLibre + OpenStreetMap tiles (free)
Geocoding:  Nominatim (free) with manual override
Hosting:    Vercel (client) + Fly.io (AppView)
```

***

## What Success Looks Like

You open the app. You see a map. There's a dot in São Paulo — a close friend sent a postcard from the park. There's a dot in London — your friend had dinner somewhere new. There's a dot in your hometown — grandma's at the usual café.

You take a photo of the view from your window. You write "wish you were here." You tag it "home." You send it.

Nobody likes it. Nobody comments. Nobody sees a follower count go up. Twenty people who care about you see a new dot on their map, and when they tap it, they see where you are and what you noticed.

That's it. That's the product.

***

## Open Questions for Later

1. **Delay mechanism**: Should postcards arrive with configurable delay?
2. **Groups/circles**: Can you send a postcard to specific people vs. all followers?
3. **Postcard collections**: Can you revisit your own sent postcards as a travel journal?
4. **Physical postcards**: Could you pay to send a real physical postcard from the app? (Lob.com API)
5. **Soundscapes**: Should a postcard support a short audio clip? (ambient sound of the place)
6. **Protocol interop**: Could Bluesky posts with location metadata auto-appear as postcards?

***

*MVP pitch produced March 11, 2026*
*Protocol: AT Protocol (atproto.com)*
*Project: Respost (m.15)*
