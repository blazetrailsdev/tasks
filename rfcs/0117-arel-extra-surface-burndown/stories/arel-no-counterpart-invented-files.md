---
title: "Decide and execute the disposition of arel's five trails-only files"
status: ready
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 200
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Five arel files have **no Rails counterpart at all** and are not extractions of
a Rails file's contents (unlike `predications-range.ts`, which has its own
story). Together they carry 24 extras
(`pnpm parity:api:extra --package arel --json`, 2026-08-22,
`noCounterpartFiles: 12`).

| file                                      | lines | extras            | names                                                                                                                                                                                                                         |
| ----------------------------------------- | ----- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visitors/connection.ts`                  | 54    | 11 moved          | `castBoundValue`, `quote`, `quoteColumnName`, `quotedBinary`, `quotedFalse`, `quotedTrue`, `quoteString`, `quoteTableName`, `sanitizeAsSqlComment`, `unquotedFalse`, `unquotedTrue` — the `ArelConnection` interface at `:11` |
| `visitors/ruby-class.ts`                  | 101   | 3 novel           | `rubyClassName:16`, `isHashAnalogue:67`, `RubyClass`                                                                                                                                                                          |
| `collectors/substitute-bind-collector.ts` | 43    | 1 novel + 6 moved | `SubstituteBindCollector:12`, `addBind`, `append`, `collector`, `constructor`, `retryable`, `value`                                                                                                                           |
| `visitors/substitute-bound-values.ts`     | 18    | 2 novel           | `substituteBoundValues:12`, `SubstituteBoundValues`                                                                                                                                                                           |
| `table-ref.ts`                            | 28    | 3 novel           | `TableRef:12`, `tableSqlName:19`, `tableRealName:25`                                                                                                                                                                          |

**No blanket disposition** — the RFC leaves each of these a per-file judgement
(owner decision, 2026-08-22). This story investigates all five and proposes
delete / fold / relocate / tag **per file, with the Rails citation**, then
executes whatever needs no further decision and files the rest.

Starting points from the analysis:

- `visitors/connection.ts` — every name is a real Rails method, on
  `ActiveRecord::ConnectionAdapters::Quoting`. This is triage category 2: the
  structural interface should be declared where the Rails concept lives, or
  the members should be typed against the AR `Quoting` port instead of a
  bespoke arel-side interface. Rails' visitors just call `@connection.quote`.
- `visitors/ruby-class.ts` — `rubyClassName` names the Ruby class a JS value
  would have had, so `Visitor#visit` can dispatch raw values the way Ruby
  dispatches on `object.class`. This is the one file in the group expected to
  survive as a genuine TS shortcoming, i.e. **a tag from the RFC's budget**,
  and `visitor.ts:102-121` already documents why.
- `substitute-bound-values.ts` / `substitute-bind-collector.ts` — Rails has
  `collectors/substitute_binds.rb` and nothing else; check whether these
  duplicate the ported `collectors/substitute-binds.ts` (which is already
  matched) and delete if so.
- `table-ref.ts` — a union type plus two name readers; Rails handles `Table` /
  `TableAlias` polymorphically. Fold into the callers.

## Acceptance criteria

- Every one of the five files is either deleted, folded into its Rails-named
  home, or carries a reviewed `@noRailsEquivalent` naming the language
  shortcoming — with the disposition and Rails citation stated per file in the
  PR body.
- `pnpm parity:api:extra --package arel` `noCounterpartFiles` drops by at
  least 3 and total extras by at least 15.
- **At most 2 new tags** from the RFC budget (`ruby-class.ts` is the expected
  one).
- If a file's right answer needs a decision beyond this story's scope, file it
  with `pnpm tasks new arel-extra-surface-burndown <slug> --body-file <path>`
  and finish the others; do not stall the whole story on one file.
- `pnpm vitest run packages/arel` green.
