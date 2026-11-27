---
title: "preview.sh: sweep finds stray DNS records; nginx failure messages say what's true"
status: done
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trailmap#205
claim: "2026-11-26T23:14:37Z"
assignee: "bump-the-ringo-pin-for-rfc-session-endpoints"
blocked-by: null
closed-reason: null
---

Surfaced on trailmap#160. In `scripts/preview.sh`:

- `previewPrs` calls `dokku dns:zones`, which lists zones rather than records, so it never matches `trailmap-pr-N`. A DNS record left behind by a `down` that stopped after `apps:destroy` is never swept. Expected: list the records (e.g. `dns:records:get` per known name, or the dns plugin's record listing), or drop the call and fix the comment.
- `assertNginx` blames `$app` for any `[emerg]` in the shared `/var/log/nginx/error.log`, including another app's. Expected: say so in the message.
- `assertNginx` ignores `down`'s exit status. Expected: when the teardown fails, the error says the preview's nginx config may still be on disk.
