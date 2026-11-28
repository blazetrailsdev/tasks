---
title: "A stalled web process yields a trailmap error page and a Bugsink event, not nginx's bare 504"
status: draft
updated: 2026-11-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

When the web process stops answering (the 2026-11-26 and 2026-11-28 wedges: rackup's 5-worker pool leaked by client disconnects, see `re-vendor-trails-for-rackup-client-disconnect-fix`), the request never reaches the middleware stack. `ShowExceptions`/`public/500.html` never render, and `config/initializers/error-reporting.ts` never reports anything to Bugsink. The browser gets nginx's bare `504 Gateway Time-out` after dokku's 60s `proxy_read_timeout`. In Rails behind nginx the outcome is the same, so the fix belongs at the proxy layer, not in the app.

Expected shape: a stall shows a trailmap-styled error page and is reported somewhere the team looks, the same way an exception is.

## Acceptance criteria

- nginx serves a static trailmap error page (same look as `public/500.html`) for 502/503/504 from the app upstream, through dokku's nginx template or `nginx.conf.sigil`, and the `nginx-sigil` CI job covers it.
- An upstream timeout or 5xx from nginx is reported to Bugsink, or the existing hang alert links the event. Either way, a 504 never goes unrecorded.
- docs/deploy.md "Detecting a hang" says where a 504 shows up.
- `rails/` gets the same page through its own nginx config, or the PR says why not.
