---
title: "activerecord-permanent-skips-receipted-in-unported-files"
status: done
updated: 2026-11-19
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10366
claim: "2026-11-19T17:58:54Z"
assignee: "activerecord-permanent-skips-receipted-in-unported-files"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` at aecc5821aa reports activerecord 8977/8997 (20 skipped).
Eight of those skips are permanently unportable and already carry
`PERMANENT-SKIP:` lines in the TS, but no per-test entry in the
unported-files register, so they still count against the denominator:

- `vendor/rails/v8.0.2/activerecord/test/cases/normalized_attribute_test.rb`:
  "normalizes changed-in-place value before validation", "normalizes value on demand"
  (CLAUDE.md, "Ruby Strings are JS string primitives")
- `finder_test.rb:174` "symbols table ref" (a Ruby Symbol is a JS string)
- `base_test.rb` "resetting column information doesn't remove attribute methods"
  (packages/activerecord/CLAUDE.md, "Records are not Proxies")
- `marshal_serialization_test.rb:18,27,38,47` the four "deserializing rails 6 1/7 1
  marshal ..." tests (operator ruling 2026-11-19: unmarshalling real Ruby Marshal
  blobs is out of scope)

`yaml_serialization_test.rb:47` "active record relation serialization" is skipped
on a story that has landed (`relation-to-yaml-psych-dump`) and passes unskipped.

## Acceptance criteria

- `scripts/parity/unported-files/activerecord.ts` exists, is registered in
  `index.ts`, and lists the eight tests above as per-test `tests:` entries,
  each reason citing its ratified section; the TS `it.skip` stubs stay.
- "active record relation serialization" runs unskipped.
- `pnpm parity:test` activerecord denominator drops by 8 and skipped by 9.
