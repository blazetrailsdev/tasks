---
title: "A failed dokku release task alerts instead of silently leaving the old image live"
status: done
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trailmap#209
claim: "2026-11-27T13:44:36Z"
assignee: "failed-deploy-release-alerts"
blocked-by: null
closed-reason: null
---

trailmap#180: from #177 (merged 2026-11-19 16:24Z) on, every push to dokku failed `release: bin/trails db:prepare` (Procfile). dokku correctly kept #176's containers live, but nothing reported it: `/up` stayed green, `dokku logs:failed trailmap` showed "No failed containers found", and it took a person noticing. Found by comparing `trailmap.web.1`'s image (bc628efca553, 16:22Z) with `dokku/trailmap:latest` (e79f6844e9a9, 17:31Z).

## Acceptance criteria

- A deploy whose release task fails produces an alert (mail via the app's MAIL_URL path, or a ringo/fleet event), naming the failing command's last lines.
- Or the running image's GIT_REV vs main HEAD drift past N minutes is surfaced on /up/ready or the fleet page.
