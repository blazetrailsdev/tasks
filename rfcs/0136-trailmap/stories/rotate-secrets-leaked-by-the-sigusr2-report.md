---
title: "Rotate the secrets the 2026-11-28 SIGUSR2 report wrote to dokku logs"
status: draft
updated: 2026-11-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On 2026-11-28 at 04:10 and 04:12 UTC, SIGUSR2 was sent to `trailmap.web.1` while diagnosing a 504 hang. The image's `NODE_OPTIONS=--report-on-signal --report-filename=stdout` (trailmap#210) then included the full process environment in the report, which went to `dokku logs trailmap`. trailmap#214 added `--report-exclude-env` so it cannot happen again, but the values already written are exposed: `SECRET_KEY_BASE`, `HUB_DATABASE_URL` (the `trailmap-hub` Postgres password, also in `DOKKU_POSTGRES_TRAILMAP_HUB_ENV_POSTGRES_PASSWORD`), `TRAILMAP_INGEST_TOKEN`, `CLOUDFLARE_API_TOKEN`, `NAMECHEAP_API_KEY` and the `SENTRY_DSN` key. Any saved `~/trailmap-hang-*.log` from docs/deploy.md's runbook contains them as well.

## Acceptance criteria

- trailmap#214 is deployed first: a SIGUSR2 report from the running web container contains no `"environmentVariables"` section.
- Each value listed above is rotated at its source (dokku config, the Postgres service password, Cloudflare, Namecheap, Bugsink), and every consumer of the ingest token is updated.
- Saved hang logs that contain the old values are deleted.
- `/up/ready` returns 200 and the release task passes after rotation.
