# Athlete resources

Athletes browse `/dashboard/athlete/resources` and can watch, listen and read published content. Approved publishers use `/dashboard/resources-admin`. The Manage resources navigation link is shown only when `/resources/capabilities` grants publishing access. All admin API operations independently check the database grant and suspended-account status; client role values never grant publishing privileges.

## Setup

1. Apply `docs/sql/athlete-resources.sql` to the existing Postgres database. Tables use RLS with no anon/authenticated grants; only the trusted backend accesses them.
2. Grant publishing access through a trusted database connection, using the approved user's ID: `INSERT INTO resource_publishers(user_id) VALUES ($1) ON CONFLICT DO NOTHING`. Do not expose a self-service grant endpoint. Existing coach/athlete roles remain unchanged.
3. Configure backend-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (a Supabase server secret key is supported). Never put this key in browser variables or commit it.
4. Create a **private** Storage bucket `athlete-resources`, with 50 MB maximum file size and allowed MIME types: image/jpeg, image/png, image/webp, video/mp4, video/webm, audio/mpeg, audio/mp4, audio/ogg, audio/wav, audio/x-wav, application/pdf, text/vtt. No public policies are needed. The backend database role needs read access to `storage.objects` to verify uploaded metadata.
5. Deploy the API and frontend. The production migration and grant for izakpm@gmail.com were applied during implementation. No example resources are seeded.

## Publishing workflow

Create a draft with a title and choose topic/format. Add summary, source/author, optional duration, article text or an HTTPS source URL. Upload a landscape cover (JPG/PNG/WebP, 5 MB), media (MP4/WebM, MP3/M4A/OGG/WAV or PDF, 50 MB) and optional English WebVTT captions (1 MB). Video and audio can also have a plain-text transcript. Files upload directly to Supabase using a signed, single-path upload ticket, avoiding Vercel's request body limit. Progress and retry errors are displayed. The backend checks stored size/type before attaching the asset.

Preview uses the same viewer as athletes and includes unsaved text. Publish validates required fields and content. Published text can be edited with Save changes. Unpublish before replacing files or changing media format. Feature selects one published resource; the previous selection is cleared transactionally. Archive hides a resource without deleting its files; Restore as draft enables editing again. Concurrent editor changes are rejected using a version check.

YouTube/Vimeo links use a restricted provider parser and load only after the athlete clicks Watch. Other external links open the source website. Articles render plain text, not arbitrary HTML. Uploaded video/audio use browser playback controls without autoplay. PDF guides open in a separate tab. Viewing links expire after four hours; refresh the resource to renew them. Previously issued links may remain valid until expiry after unpublishing; new detail requests stop immediately.

The library is paginated in groups of 12, newest published first, with independent topic and format filters. Admin lists additionally filter draft/published/archived state. Only published rows and their authorized media URLs are returned to athletes. There are no athlete create, edit or delete controls.

## Maintenance and validation

Replaced and abandoned uploads are retained rather than deleted automatically. Before removing stored objects, check all active resource asset references and outstanding upload tickets; allow signed tickets to expire. Monitor storage quota as the library grows. The initial upload cap is 50 MB; use hosted video source links for larger recordings.

Unit and component tests cover authorization, draft isolation, content/type validation, publishing conflicts, single featured placement, filters, empty states, safe rendering, upload tickets and failed-save recovery. A real isolated integration check verified signed upload, metadata completion, publish, private playback, feature and unpublish; database changes were rolled back and the temporary upload removed. Desktop and mobile library layouts were visually reviewed with local fixtures that were removed before deployment.
