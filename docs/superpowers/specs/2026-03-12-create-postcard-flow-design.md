# Create Postcard Flow

Mobile-first, swipe-based postcard creation as a map overlay. Camera-first: the flow starts with taking a photo, then adding a message and location, then publishing and sharing via WhatsApp.

## User Flow

Three sequential full-screen panels, swiped left-to-right:

### Panel 1: Camera

Full-screen camera capture using `<input type="file" accept="image/*" capture="environment">`, which opens the native mobile camera. No custom viewfinder — delegate to the OS.

- On capture: compress the image client-side using canvas — encode as WebP quality 0.85 at original resolution first. If the result exceeds 1MB, progressively downscale until it fits. Most phone photos (12MP) compress to 400-800KB as WebP without any resize, preserving full resolution.
- Immediately after compression: start uploading the blob to ATProto in the background via a new `uploadImageBlob` server action, while advancing the user to panel 2. Store the upload promise.
- Cancel (X button or back-swipe): return to map

### Panel 2: Message + Location

- Photo thumbnail at top (the image just taken)
- Message text input, max 300 characters, live character counter
- Location name: free-text field, user types whatever name they want ("home", "that park", "Lisboa")
- Granularity picker: 5 options (establishment / neighborhood / city / region / country), default to "neighborhood"
- GPS coordinates captured via `navigator.geolocation.getCurrentPosition` — not shown to the user. If the user denies permission or geolocation is unavailable, disable fine-grained granularity options (establishment, neighborhood, city) and default to "region". Coordinates remain optional for region/country granularity per domain rules.
- Swipe left or "Next" to advance

### Panel 3: Confirm & Share

- Postcard preview using a `PostcardPreview` component that mirrors `PostcardView` layout but accepts draft data (local image URL, message, location name, granularity) instead of a full `Postcard` domain object
- "Publish" button: awaits the background blob upload (if still in progress, show a brief spinner), then calls a `publishPostcard` server action that creates the ATProto record using the already-uploaded blob ref. This makes publish near-instant.
- On success: show WhatsApp share button with link to `/p/[rkey]`
- On failure: show error message, stay on this panel so the user can retry

## Entry Points

- **Floating action button (FAB)**: Camera icon pinned to the bottom of the map, always visible
- **Swipe up from bottom edge**: Gesture shortcut, same result as tapping the FAB

## OG Link Previews

The `/p/[rkey]` page already generates `og:title` and `og:description` from the postcard. The existing TODO for `og:image` must be resolved for WhatsApp previews to show the photo. This requires building an image URL from the ATProto blob ref — either a proxy endpoint or a direct PDS blob URL.

## Architecture

### Domain Layer — No changes

`CreatePostcardCommand`, `validatePostcard`, `createLocation` already handle all validation. The domain types and value objects cover the full creation flow.

### Application Layer — Split into two actions

The current `createPostcard` server action is split to support background upload:

- **`uploadImageBlob`** — New server action. Takes base64 image + mime type, uploads the blob to ATProto, returns the blob ref. Called immediately after capture so upload happens while the user fills in the form.
- **`publishPostcard`** — New server action. Takes the blob ref (from the completed upload), message, and location fields. Validates via domain, creates the ATProto record, returns `{ success: true, uri }` or `{ success: false, error }`. The rkey is extracted from the returned AT URI to build the share URL.

The existing `createPostcard` action can be kept for backward compatibility or removed.

### Infrastructure Layer — No changes

GPS coordinates come from the browser Geolocation API (presenter concern). ATProto upload and record creation already work.

### Presenter Layer — New components

All new code lives in `presenters/components/CreatePostcard/`:

- **`CreatePostcardContext`** — React Context that acts as the client-side application orchestrator. Holds draft state (photo, base64, blob ref promise, message, location name, granularity, coordinates, upload status, publish status). Exposes actions: `capturePhoto` (compress + start background upload), `setMessage`, `setLocation`, `setGranularity`, `publish`, `reset`. Panels are decoupled from each other — they only interact with the context.
- **`CreatePostcardFlow`** — Wraps the panels in the `CreatePostcardContext` provider. Manages which panel is active and swipe navigation. "use client" component.
- **`CameraCapture`** — Pure presenter. Wraps `<input type="file" accept="image/*" capture="environment">`. On file selection, calls `context.capturePhoto(file)`.
- **`PostcardForm`** — Pure presenter. Message input with character counter, location name field, granularity picker. Reads/writes via context.
- **`PostcardPreview`** — Pure presenter. Mirrors `PostcardView` layout but reads draft data from context (local image object URL, message, location).
- **`ShareScreen`** — Pure presenter. Shows `PostcardPreview` + "Share on WhatsApp" link. Uses `https://wa.me/?text=...` URL scheme.

### Map Integration

- Add a FAB component to `app/page.tsx` overlaying the map
- FAB opens `CreatePostcardFlow` as a full-screen overlay (covers the map)
- On cancel or successful publish+share, overlay closes and map is visible again
- After publish, map should show the new postcard marker (revalidate page data)

## Constraints

- Image: WebP preferred (JPEG/PNG also accepted), max 1MB (enforced by domain `validatePostcard`). Client compresses as WebP 0.85 at original resolution; only downscales if result exceeds 1MB.
- Message: 1-300 characters (enforced by domain `validatePostcard`)
- Location name: 1-200 characters (enforced by domain `createLocation`)
- Granularity: one of establishment, neighborhood, city, region, country

## Out of Scope

- Labels (saved places) — separate feature
- Spotify song attachment — future feature
- Delivery delay (deliverAt) — not exposed in MVP creation form
- Image cropping or editing
- Offline creation
