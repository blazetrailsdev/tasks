---
title: "Scan top-level umbrella module config into ActiveRecord::Base, drop curated allowlist"
status: in-progress
updated: 2026-06-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 4093
claim: "2026-06-25T01:22:34Z"
assignee: "extractor-scan-umbrella-module-config-to-base"
blocked-by: null
---

## Context

PR #3993 (`feat(api-compare): capture singleton_class.attr_accessor module
config as Base statics`) captured the top-level `ActiveRecord` module config
declared via `singleton_class.attr_accessor` in `lib/active_record.rb`
(`writing_role`, `reading_role`, `schema_format`, ~30 flags). trails ports
these as `Base` statics.

The merged fix admits the camelized names via a **curated hand-maintained
allowlist** `RAILS_AR_MODULE_CONFIG` in
`scripts/api-compare/extra-surface.ts` (added in `collectAllowedNames`, gated
on `fqn === "ActiveRecord::Base"`). This was chosen because:

- The umbrella file `lib/active_record.rb` sits one level **above** the
  extractor's libPath (`lib/active_record/`) and is never scanned, so the
  config has no Ruby counterpart in the manifest.
- Scanning the umbrella directly was rejected: compare groups methods by
  entity file, and the `ActiveRecord` module's entity file is the junk-drawer
  `deprecator.rb` — so the ~80 config methods land there as false-missing,
  regressing AR coverage 95.8%→94.5% with no clean way to credit them against
  the `Base` statics they're ported to.

The allowlist is a maintenance hazard: every new/removed `Base` static that
maps to umbrella module config silently resurfaces as novel (or stays admitted
after removal). The `attr_reader`-only umbrella config (`default_timezone`,
`db_warnings_action`, `permanent_connection_checkout`) is deliberately omitted
today and must be added by hand if ever ported.

## Acceptance criteria

- Extractor scans top-level umbrella files above libPath (at minimum
  `lib/active_record.rb`) and attributes their module-level
  `singleton_class.attr_accessor`/`attr_reader`/`attr_writer` config to
  `ActiveRecord::Base` (the entity that ports them), NOT to the
  `deprecator.rb` entity-file bucket.
- AR coverage does not regress (stays ≥95.8%); the umbrella config is credited
  against its `Base` statics rather than counted as false-missing.
- The curated `RAILS_AR_MODULE_CONFIG` allowlist in `extra-surface.ts` is
  removed (or reduced to genuinely un-scannable surface), eliminating the
  hand-maintenance burden.
- `pnpm api:extra --package activerecord --novel-only` still does not list
  `writingRole`/`readingRole`/etc.

## Reference files

- `scripts/api-compare/extra-surface.ts` (`RAILS_AR_MODULE_CONFIG`,
  `collectAllowedNames`)
- `scripts/api-compare/extract-ruby-api.rb` (libPath scanning, entity-file
  grouping, `singleton_class_receiver?`)
