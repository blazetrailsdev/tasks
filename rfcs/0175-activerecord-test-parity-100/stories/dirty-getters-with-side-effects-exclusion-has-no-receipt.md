---
title: "activerecord: dirty_test 'getters with side effects are allowed' is excluded with no ratified reason or story"
status: done
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8892
claim: "2026-10-14T11:42:29Z"
assignee: "dirty-getters-with-side-effects-exclusion-has-no-receipt"
blocked-by: null
closed-reason: null
---

## Context

`dirty_test.rb:807-821` ("getters with side effects are allowed") subclasses `Pirate` with a `catchphrase` reader that calls `update_attribute(:catchphrase, "arr")` when `super` is blank, then asserts `pirate.catchphrase` reads `"arr"`.

It is the one per-test entry left in `scripts/parity/unported-files/unscoped.ts` for `dirty_test.rb` whose reason neither cites a ratified CLAUDE.md section nor names a story: it says a JS getter cannot await the write. trails#8876 left it untouched. `packages/activerecord/src/dirty.test.ts` carries no stub for it.

The reader is an accessor property (CLAUDE.md § "Generated attribute readers are properties"), and `updateAttribute` is async, so the Rails body cannot be written literally. What the test protects is that an overridden reader which writes during a read does not corrupt dirty tracking (`activerecord/lib/active_record/attribute_methods/dirty.rb`), and that part may be reachable.

## Acceptance criteria

- [ ] Either the test is ported with the Rails body as far as an accessor allows (the override performs the write and the assertion awaits it) and the `unscoped.ts` entry is deleted,
- [ ] or the repo owner rules it permanent, the entry's reason starts `PERMANENT:` and cites the CLAUDE.md section, and a `PERMANENT-SKIP` stub with the Rails body is added to `dirty.test.ts`.
