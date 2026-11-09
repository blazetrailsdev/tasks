---
title: "docs/deploy.md: record the dokku-mail link and the SMTP_ADDRESS mapping"
status: draft
updated: 2026-11-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On 2026-11-09 `/mail-test` failed in production with `connect ECONNREFUSED 127.0.0.1:587`:
`SMTP_ADDRESS` was unset, so `app/mailers/application-mailer.ts` fell back to `localhost`. The fix was
made on the box only: `dokku mail:vars:set trailmap SMTP_ADDRESS=%HOST%` and
`dokku mail:link default trailmap`. That points SMTP at the dokku-mail relay, `dokku.mail.default:25`.
`EMAIL` is still unset, so job-failure mail goes nowhere. docs/deploy.md records none of this.

## Acceptance criteria

- docs/deploy.md documents the dokku-mail link, the `SMTP_ADDRESS=%HOST%` mapping and `EMAIL`.
- trailmap-rails gets the same link if it sends mail.
