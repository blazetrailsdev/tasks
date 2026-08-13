---
title: "extra-surface scores an overridden Ruby file's TS target against an empty allowed set"
status: done
updated: 2026-08-13
rfc: "0103-parity-api-scoring-correctness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6464
claim: "2026-08-13T14:06:37Z"
assignee: "extra-surface-scores-overridden-ruby-files"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extra-surface.ts:1207-1222` builds its scoring targets from
`rubyFiles.keys()` — the files the extractor STAMPED each entity with, which for
a reopened class is whichever reopening came first, not every file that reopens
it. `core_ext/date/calculations.rb` reopens `class Date` but `date/acts_like.rb`
stamps it, so `date/calculations.rb` never appears in `rubyFiles` and the TS
file it maps to falls into the `uncoveredTsFiles(...)` arm with
`rubyFile: null` — scored against an EMPTY allowed set.

Concretely, after PR #6197: `parity:api:extra --package activesupport` reports
`date-ext.ts — 1 novel, 16 moved [no Rails counterpart]`, even though
`parity:api` in the same run reports
`core_ext/date/calculations.rb -> date-ext.ts  15 matched`. Every one of those
17 names traces to a Ruby method in that file. `RUBY_FILE_TS_OVERRIDES` already
carries the mapping; the reverse walk just never consults it for a file with no
stamped entity.

This is not a `date-ext.ts` problem — it is a systematic under-report wherever a
Ruby file's entity is stamped elsewhere, which is exactly the population the
`RUBY_FILE_TS_OVERRIDES` many-to-one entries exist for.

## Converged shape

Seed `rubyFileNames` with the override table's Ruby-side keys as well as
`rubyFiles.keys()` and `fileConstants` keys, so an overridden file is a scoring
target with its own entity list (empty is fine — `collectAllowedNames` already
handles the constants-only case the same way, per the comment at :1202-1207).

The gate is tag-staleness only, so this is a reporting-accuracy fix, not a red.
Do not resolve it with a file-level `@noRailsEquivalent` on `date-ext.ts`: the
file HAS a Rails counterpart.

## Acceptance criteria

- [ ] `parity:api:extra --package activesupport` no longer tags `date-ext.ts`
      `[no Rails counterpart]`, and its names score against the allowed set
      derived from `core_ext/date/calculations.rb`.
- [ ] No other package's Novel/Moved totals regress; the stale-tag gate stays
      green.
