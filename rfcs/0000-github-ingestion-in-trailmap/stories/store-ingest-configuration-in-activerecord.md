---
title: "trailmap: ingest configuration and state models, secrets encrypted"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

The RFC's "Configuration and state live in ActiveRecord" table is the spec.
This story owns **every migration and model the RFC adds except
`GithubDelivery`**, so that nothing later adds an env var, a state file or a
stray migration.

- **`Setting`** (`app/models/setting.ts`): add `github_webhook_secret`,
  `ringo_webhook_secret` and `github_token` (all `encrypts`-ed), plus
  `relay_to_ringo` (`off` | `audit`, default `off`), to `FALLBACKS` with env
  fallbacks, using the existing `lookup`/`resolve`. Expose `relay_to_ringo` read-only
  at `GET /settings/relay_to_ringo` on the fleet network, for ringo.
- **`RepositorySetting`** migration: `ingest_enabled` (boolean, default false),
  `ingest_enabled_at` (timestamp; the catch-up floor), `ingest_events`
  (string array, or text), `ringo_hook_id` (bigint, nullable). Editable on
  `/:owner/:repo/settings`.
- **`IngestForwarder`** (new): `repository_id` (unique), `pid`, `started_at`,
  `connected_at`, `last_event_at`, `restarts`, `last_exit_code`,
  `stderr_tail`.
- **`RelayAudit`** (new): `kind` (`miss` | `tally`), `repo`, `event`,
  `audit_key`, `window_start`, `window_end`, `matched`, `unmatched`,
  `detail`, `reported_at`.
- **Seed:** the three tracked repos with `ingest_enabled`, their hooks' event
  lists, and hook ids 602873770, 670781774 and 674688087.
- Settings pages show which source won (`ResolvedSetting.source`) and never a
  secret's value.

If `encrypts` doesn't work on a Hub model in the vendored build, file a trails
story, add it to `deps-rfc`, and keep those keys on their env fallback until it
lands. Never store them in plaintext.

## Acceptance criteria

- [ ] The four `Setting` keys resolve row → env → unset; the secrets round-trip encrypted (the raw column isn't the plaintext)
- [ ] The `RepositorySetting` columns, `IngestForwarder` and `RelayAudit` migrate up and down on Hub
- [ ] `GET /settings/relay_to_ringo` answers `off` or `audit`
- [ ] The seed brings up the three repos with their events and hook ids
- [ ] No page or log prints a secret
