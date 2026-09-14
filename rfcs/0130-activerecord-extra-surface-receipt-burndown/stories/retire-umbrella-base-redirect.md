---
title: "Delete umbrella_base_redirect and the umbrellaConfig credit branch"
status: draft
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps:
  - fold-ar-config-into-active-record-module
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Step 6 of six, and the one that actually retires the deviation. The five preceding stories
(`converge-active-record-umbrella-onto-the-module`, `move-ar-umbrella-seats-batch-1` / `-2` / `-3`,
`fold-ar-config-into-active-record-module`) move every member of `active_record.rb` — 35
`singleton_class.attr_*` seats and 12 `def self.` methods — onto the `ActiveRecord` module in
`packages/activerecord/src/active-record.ts`. Throughout that sequence the flattening machinery is
deliberately left running so the `Base` statics keep crediting while they are still there.

Once `base.ts` holds none of them, the machinery credits nothing and is pure dead weight. It is:

- `umbrella_base_redirect` (`scripts/api-compare/extract-ruby-api.rb:1247`) and its call at `:1193`,
  plus the `@scanning_umbrella` guards it exists to serve (`:1199`, `:928`).
- `scan_umbrella_file` (`:484`) itself, and `@scanning_umbrella` (`:422`) with the early returns keyed on it
  (`:467`, `:863`, `:1974`, `:2006`, `:2059`) — `active_record.rb` is now walked as an ordinary package file
  via `libEntryFile`, so nothing enters the umbrella path. Confirm no other vendored source still needs it
  before deleting; if one does, delete only the `Base` redirect and keep the scan.
- The `umbrellaConfig` credit-anywhere branch in `scripts/api-compare/compare.ts:4750`, the flag's plumbing at
  `:2856` / `:2868` / `:4525`, and its declaration in `scripts/parity/types.ts:271-279`.
- The tests that pin the behaviour: `extract-ruby-api.test.ts:1376-1520` ("Ruby extractor umbrella
  module-config scanning", including "attributes module-level singleton_class config to <Module>::Base"),
  and `extra-surface.test.ts:1161` / `:3523`.

CLAUDE.md § "Call-time constant resolution" currently states the flattening as the repo-wide rule ("the api
manifest flattens `active_record.rb`'s singleton config onto `base.rb`, so they are `static` accessor pairs on
`Base`") and enumerates the `_Base!.<seat>` read sites and the five guarded reads. That section is the thing
this campaign falsifies, and rewriting it is part of this story, not a follow-up.

## Acceptance criteria

- `umbrella_base_redirect` and the `umbrellaConfig` flag, its `compare.ts` credit branch, its `types.ts`
  declaration and its plumbing are deleted. `scan_umbrella_file` and `@scanning_umbrella` are deleted too
  unless another vendored source still routes through them, in which case say which.
- The tests pinning the redirect are deleted or rewritten to pin the new behaviour — `active_record.rb`
  members recorded on the `ActiveRecord` module at `active_record.rb`.
- CLAUDE.md § "Call-time constant resolution" is rewritten: the `active_record.rb` seats are named as living
  on the `ActiveRecord` module in `active-record.ts`, the `base-slot.ts` seat enumeration is corrected, and the
  guarded-read list reflects where those five reads now point.
- `vendor/sources.ts:26-34`'s `libEntryFile` comment no longer claims Rails' framework entry files are
  autoload manifests nothing ports.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative and `base.rb` does not regress;
  `pnpm parity:api:extra:gate` green with no STALE and no REDUNDANT tag; `pnpm parity:api:calls`,
  `:calls:args`, `:params` clean; the `rails-comparison` CI job green.
