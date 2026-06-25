---
title: "topic-serialize-content-read-null-convergence"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

While porting `persistence_test.rb` tests to canonical models (wave10, PR #3841),
the canonical `Topic` model's `serialize("content")` column was found to NOT
round-trip plain strings on the **read** side:

- `topics(:first)` fixture row has raw DB `content = "Have a nice day"` (verified
  via `SELECT id, content FROM topics WHERE id = 1`), but
  `Topic.find(1).readAttribute("content")` returns `null`.
- `Topic.create({ title: "z", content: "hello" })` then refetch → `content` is
  `null` (write side may also be affected, but read is definitely broken).

Rails: `serialize :content` (YAML default) loads a raw scalar like
`"Have a nice day"` back to the string `"Have a nice day"` (`YAML.load` of a bare
scalar). trails' deserialize returns `null` instead.

This forced wave10 to substitute `title` for `content` in
`update many with duplicated ids` / `... invalid id` / `... active record base
object` / `... array of active record base objects` (Rails uses `content`). Those
tests are behaviorally faithful but not exact mirrors until this is fixed.

Repro file (scratch): register Topic + Reply subclasses, `useHandlerFixtures(["topics"])`,
assert `Topic.find(1).content === "Have a nice day"`.

## Acceptance criteria

- [ ] `Topic.find(1).content` (and `readAttribute("content")`) returns the
      string `"Have a nice day"` matching the raw DB value + Rails.
- [ ] A created/updated `Topic` round-trips a plain-string `content` value.
- [ ] Re-converge the four wave10/wave11 `update many ...` tests to use `content`
      and assert `.content` verbatim (matching persistence_test.rb:128,138,149,160).
- [ ] No regression in `serialized-attribute.test.ts` / `serialize.test.ts`.

## Notes

Likely in the serialize coder's deserialize path (YAML/JSON of a bare scalar).
Investigate `packages/activerecord/src/serialize.ts` + the coder used by
`this.serialize("content")` with no explicit coder.
