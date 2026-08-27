---
title: "strip-english-comments-enrolled-packages"
status: draft
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**Policy, 2026-08-27 (maintainer): trails carries no English-language comments.**
Superseding the narrower policy `strip-english-comments-arel-visitors` was
written against, the maintainer ruled that:

- Rails citations go too — a `Mirrors:` line, a `.rb:LINE` reference and a Ruby
  constant path are deleted like any other comment. A line number rots the
  moment Rails edits the file above it, and in practice the citation was the
  hook the prose hung off. The Ruby is vendored; `pnpm rails:find <query>` maps
  a name to its `file:line` on demand.
- A JSDoc tag document carries **simple data or nothing** — the tag keeps the
  arguments the extractors read and loses the English reason after them.
- The sweep is implemented as the **autofix of
  `blazetrails/no-freeform-comments`**, not as a hand sweep, so the rule is what
  stops the prose coming back.

`no-freeform-comments` was already enrolled across `packages/arel/src/**`,
`packages/activemodel/src/**` and several `packages/activerecord/src/**` trees
(`eslint.config.mjs`), so changing what the rule KEEPS re-swept every enrolled
file at once. That is why this landed as one change across three packages rather
than per-directory slices, and it is what this story records: the arel slicing
table in `strip-english-comments-arel-visitors` was written for a hand sweep and
does not survive the rule-driven approach.

Shipped in PR #7132.

## Keep / delete

**Keep** — exactly two kinds:

- The repo's JSDoc flags reduced to their data: `@internal`,
  `@noRailsEquivalent`, `@missingRailsCall`, `@missingRailsArgs`, `@deprecated`,
  `@empty`. `@missingRailsCall <ruby_call> — PERMANENT: <prose>` becomes
  `@missingRailsCall <ruby_call> — PERMANENT`; the `<ruby_call>` and the
  permanence token are machine input and stay.
- Tool directives — `eslint-*`, `@ts-*`, `prettier-ignore`, coverage pragmas,
  `boundary:` / `@boundary-file:`, `@nie disposition=` — byte-identical,
  including any prose inside them.

**Delete** — everything else: `//` narration, JSDoc prose, descriptive
summaries, `@param` / `@returns` / `@example`, `Mirrors:` lines, `.rb`
citations, Ruby constant paths.

**Leave alone** — a tag carrying no permanence claim (pre-existing, e.g.
`@noRailsEquivalent Ruby needs no name for a duck type.`). There is no data to
reduce it to, a bare tag fails the empty-reason contract
(`scripts/api-compare/build.ts:24`), and inventing `PERMANENT` would fabricate a
reviewed judgement.

## Acceptance criteria

- [ ] `blazetrails/no-freeform-comments` keeps only the two categories above,
      with the reduction implemented as its autofix.
- [ ] Every enrolled tree is swept as that fixer's `--fix` output, not by hand.
- [ ] No tool directive is deleted or rewritten — not one, in any package.
- [ ] No machine-read tag loses an argument the extractors read. A tag that
      cannot be reduced is left verbatim.
- [ ] `scripts/api-compare/**` contracts are UNCHANGED — the data-only tag form
      satisfies them as written.
- [ ] `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` and
      `parity:api:extra:gate` all pass, with no baseline row added or removed
      and `arel novel 0/0`.
- [ ] `pnpm lint` clean; no new eslint-disable.
- [ ] An intentionally-empty block keeps `/** @empty */` rather than an English
      sentence, so `no-empty` stays enforced.

## Notes

The four arel slice stories filed under the hand-sweep plan
(`strip-english-comments-arel-root`, `-arel-nodes`, `-arel-test-helpers`,
`-arel-attributes-collectors`) are superseded by this one and should be closed
against PR #7132.
