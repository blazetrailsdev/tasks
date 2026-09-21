---
title: "Score inspect, initialize_dup, is_a? and the other protocol names where a Ruby file really defines them"
status: draft
updated: 2026-09-20
rfc: "0000-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps:
  - "report-own-row-denominator-ratio"
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[0]` (`scripts/parity/conventions.ts:455-498`) drops about 40 names everywhere: `dup`, `inspect`, `pretty_print`, `respond_to?`, `respond_to_missing?`, `method_missing`, `is_a?`, `initialize_dup`, `encode_with`, `init_with`, `to_a`, `to_h`. `rubyMethodToTs` returns `null` for them (`conventions.ts:1484`) and `dedupeRubyMethodInto` drops a null-mapped method (`compare.ts:2920`). Hits across activerecord, activemodel and activesupport: `inspect` 29, `hash` 20, `eql?` 19, `method_missing` 18, `initialize_dup` 16, `encode_with` 14, `init_with` 11, `respond_to_missing?` 11.

So every `inspect` Rails defines is outside the denominator. That is 0155's whole rendering group (17 stories), plus `activemodel-errors-has-no-dup` (`errors.rb:122-125`, scored 33/33) and `activesupport-time-with-zone-is-a-time` (`time_with_zone.rb`, `is_a?`).

The spellings already exist: `rubyMethodToTsIgnoringSkip` (`conventions.ts:1509`) answers "what would a faithful TS override be called" for extra-surface. Some names are genuinely unportable (`hash`, `object_id`, `freeze`, `instance_variable_get`) and stay skipped.

## Acceptance criteria

- Each name in `SKIP_GROUPS[0]` is classified from the TS corpus as ported-somewhere or never-ported, and the table is in the PR body.
- A ported-somewhere name is expected in the TS file mirroring each Ruby file that defines it, via `rubyMethodToTsIgnoringSkip`.
- Never-ported names stay skipped, in a group whose `reason` says why.
- `Errors#initialize_dup` and `TimeWithZone#is_a?` are reported missing.
- If the new rows exceed one PR's burndown, the mechanism lands behind a per-package enrollment list that is only-grow, and the PR files one burndown story per unenrolled package.
