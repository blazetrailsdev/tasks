---
title: "trailmap: ingest configuration as Setting and RepositorySetting rows, secrets encrypted"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's "Configuration and state live in ActiveRecord" table is the spec.
Ringo spreads the same configuration across env vars and JSON files. Here it
starts as rows, so nothing later in the RFC adds an env var or a state file.

- **`Setting`** (`app/models/setting.ts`): add `github_webhook_secret`,
  `ringo_webhook_secret`, `github_token` and `relay_to_ringo` to `FALLBACKS`,
  each with its env fallback, through the existing `lookup`/`resolve`. The
  three secrets are `encrypts`-ed. `relay_to_ringo` defaults to off.
- **`RepositorySetting`**: Hub migration adding `ingest_enabled` (boolean,
  default false), `ingest_events` (string array, or a text column if arrays
  aren't supported) and `ringo_hook_id` (bigint, nullable). Shown and editable
  on `/:owner/:repo/settings`.
- **Seed** from today's values: the three tracked repos with `ingest_enabled`,
  their hook event lists, and their hook ids 602873770, 670781774 and 674688087.
- The settings pages show **which source won** (`ResolvedSetting.source`) and
  never a secret's value, only whether one is set.

If `encrypts` doesn't work on a Hub model in the vendored build, file a trails
story and leave those keys on their env fallback until it lands. Don't store
them in plaintext.

## Acceptance criteria

- [ ] The four `Setting` keys resolve row → env → unset, and the secrets round-trip encrypted (the raw column isn't the plaintext)
- [ ] `RepositorySetting` has the three ingest columns, with a form on the repo settings page
- [ ] The seed brings up the current three repos with their events and hook ids
- [ ] No page or log prints a secret's value
- [ ] No env var or state file is added that this RFC's table doesn't list
