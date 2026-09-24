---
title: "Stop extra-surface and naming-taxonomy crediting the Q spelling; ban new *Q predicates"
status: done
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps:
  [
    "rename-q-predicates-ar-connection-state",
    "rename-q-predicates-ar-class-kind",
    "rename-q-predicates-ar-readonly-and-helpers",
    "rename-q-predicates-actionview-actionpack",
    "rename-q-names-rack-ruby-compat-trailties",
  ]
deps-rfc: []
est-loc: 80
priority: 35
pr: trails#8025
claim: "2026-09-24T12:22:00Z"
assignee: "retire-q-suffix-crediting-in-extra-surface-and-naming"
blocked-by: null
closed-reason: null
---

## Context

The drop-q-predicate-suffix PR removed the `Q` candidate from `rubyMethodToTs`
(`scripts/parity/conventions.ts`), the rule `parity:api` pairs names with. Two
other tools still credit the `Q` spelling on their own, and they were left in
place on purpose. Dropping them before the renames land would turn every
remaining `*Q` member into extra surface (activerecord is **rowless**, so each
one would need a receipt) or into a convergeable naming row:

- `scripts/api-compare/extra-surface.ts:423-449`, `rubyMethodCandidates`:
  `return [...base, ...base.map((c) => c + "Q"), literal]`, plus its JSDoc that
  describes `Q` as trails' encoding of `?`.
- `scripts/api-compare/naming-taxonomy.ts:245-247,276`, `classifyPair`:
  `...(bare.endsWith("?") ? [`${camel}Q`] : [])` in the allowed set, plus the
  JSDoc sentence "the `Q` suffix ... is what it adds on top".
- Fixtures that use the spelling: `scripts/api-compare/extra-surface.test.ts:916`
  (`method("connectedToQ")`), and `scripts/api-compare/naming-taxonomy.test.ts`
  (`primaryClassQ`).

Prior art: `track-retire-q-suffix-predicates` (RFC 0082, which is postponed; the
story is draft) asked for the same end state plus "a lint bans new exported `*Q`
identifiers". This story delivers that AC. Close the tracker as superseded when
this lands.

## Acceptance criteria

- `rubyMethodCandidates` no longer appends `Q` variants. It keeps the
  quoted-literal candidate, and its JSDoc no longer describes `Q`.
- `classifyPair` no longer treats `${camel}Q` as an allowed spelling, and its JSDoc
  sentence goes away.
- The fixtures above use `is*` spellings.
- A guard (an eslint rule or a `parity:api:extra` check) fails on any new
  `*Q`-suffixed class member / export / function in `packages/*/src` that
  mirrors a Ruby `?` method, so the class stays closed.
- `pnpm parity:api:extra:gate`, `parity:api:calls:args` (naming) are green with
  marks unchanged or lower. This only holds once the rename stories above have
  landed, which is why they are deps.
