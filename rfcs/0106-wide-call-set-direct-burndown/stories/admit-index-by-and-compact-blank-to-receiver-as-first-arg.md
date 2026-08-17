---
title: "Admit index_by and compact_blank to RECEIVER_AS_FIRST_ARG alongside group_by"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6625
claim: "2026-08-17T01:22:52Z"
assignee: "admit-index-by-and-compact-blank-to-receiver-as-first-arg"
blocked-by: null
closed-reason: null
---

## Context

PR #6622 added `group_by` to `RECEIVER_AS_FIRST_ARG`
(`scripts/api-compare/receiver-as-first-arg.ts`): Ruby core Enumerable, exported
by `@blazetrails/activesupport` as `groupBy(collection, block)` because JS has no
`Array.prototype` analogue that keys a Hash by VALUE (`Object.groupBy` coerces
keys to strings), so the Ruby receiver is TS argument 1. That entry was added
because a real site needed it (`Preloader::Batch#initialize`,
`vendor/rails/activerecord/lib/active_record/associations/preloader/batch.rb:9`,
`available_records.flatten.group_by { |r| r.class.base_class }`).

Two siblings of the same exact shape were deliberately NOT added, to keep that
PR's diff honest — no site needed them at the time:

- `index_by` — `vendor/rails/activesupport/lib/active_support/core_ext/enumerable.rb:52-60`,
  exported as `indexBy(collection, block)`
  (`packages/activesupport/src/enumerable-utils.ts:21`).
- `compact_blank` — `vendor/rails/activesupport/lib/active_support/core_ext/enumerable.rb:184-186`,
  exported as `compactBlank(collection)`
  (`packages/activesupport/src/enumerable-utils.ts:106`).

Both satisfy the table's stated admission rule verbatim: a Ruby language
built-in or ActiveSupport core-ext on Object/String/Symbol/Array/Hash that
trails necessarily exports as a free function. Without the entries, any ported
body calling `indexBy(xs, fn)` where Rails wrote `xs.index_by { … }` reads as a
count divergence and earns a `shape` row that is pure tooling noise.

## Converged shape

Add `index_by` and `compact_blank` to `RECEIVER_AS_FIRST_ARG` with the same
one-line citations the existing entries carry, then re-run the gates.

Adding a name to that table can only SHRINK the mismatch set, so expect stale
rows: any existing `call-mismatches-exclude/**` row for one of these two names
must be deleted by hand (only-shrink, never `--write`/reseed), and the resulting
STALE high-water marks tightened with
`pnpm parity:api:calls:tighten <package>/<file>.json` for exactly the shards
that moved.

Check `pnpm parity:api:calls:args:report` for `naming` rows on these names too —
they are report-only, but they are the cheapest evidence of how many sites the
entries actually cover.

## Acceptance criteria

- [ ] `index_by` and `compact_blank` are in `RECEIVER_AS_FIRST_ARG`, each with
      its `enumerable.rb` line cited.
- [ ] Every baseline row the addition makes stale is deleted by hand; no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green, with
      mark shards tightened only where they went stale.
