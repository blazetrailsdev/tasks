---
title: "Model enum's Ruby Symbol values as leading-colon strings"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6494
claim: "2026-08-13T21:27:10Z"
assignee: "drop-assert-valid-keys-set-for-rails-include"
blocked-by: null
closed-reason: null
---

## Context

PR #6478 converged `relation/query-methods.ts` and
`associations/join-dependency.ts` to the settled colon-string Ruby Symbol model
(CLAUDE.md: "a Ruby Symbol is a JS string, never a JS `Symbol`"). `enum.ts` is
the next-largest holdout: `assertValidEnumDefinitionValues` still discriminates
on `typeof v === "symbol"` and reads symbol-keyed hashes via `Reflect.ownKeys`.

- `packages/activerecord/src/enum.ts:1130` — `values.every((v) => typeof v === "string" || typeof v === "symbol")`
- `packages/activerecord/src/enum.ts:1140-1141` — rejects `Symbol("")` / `Symbol("   ")`, mirroring Ruby `Symbol#blank?`
- `packages/activerecord/src/enum.ts:1154,1163` — `Reflect.ownKeys` so `{ [Symbol("draft")]: 0 }` is seen
- `packages/activerecord/src/enum.trails.test.ts:215-260` — manufactures real JS `Symbol`s

Rails: `activerecord/lib/active_record/enum.rb:172-238` (`enum`), where the
values are Ruby Symbols (`enum status: [:draft, :published]`) and blankness is
`value.blank?` on a Symbol.

## Converged shape

`:draft` is `":draft"`; `typeof v === "symbol"` becomes a leading-colon check;
`Reflect.ownKeys` becomes `Object.keys`; the blank-name guard tests the name
after `.slice(1)`. The trails test drops its `Symbol("draft")` construction and
spells the values `":draft"` the way `enum.rb` spells them.

## Acceptance criteria

- [ ] No JS `Symbol` remains as a Ruby-Symbol stand-in in `enum.ts`.
- [ ] `Symbol("")` / `Symbol("   ")` blank rejection is preserved as a
      colon-string check (`":"`, `":   "`).
- [ ] `enum.trails.test.ts` and `enum.test.ts` pass on all three adapters.
