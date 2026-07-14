---
title: "rails-file-structure-method-order-dormant-and-per-file"
status: ready
updated: 2026-07-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

Surfaced by review of PR #4877 (arel-attribute-caster-is-a-trails-invention).

The `blazetrails/rails-file-structure-method-order` ESLint rule has two
defects that together make it both dormant in CI and actively wrong when it
does fire locally.

**1. Dormant in CI.** The rule reads
`eslint/rails-file-structure-method-order.json`, which is gitignored
(`.gitignore:27`) and written only by `pnpm api:compare`. The loader returns
an empty manifest when the file is absent
(`eslint/rails-file-structure-method-order.mjs:36-39`):

```js
if (!fs.existsSync(MANIFEST_PATH)) {
  manifestCache = { files: {} };
  return manifestCache;
}
```

CI's lint job (`.github/workflows/ci.yml:375-385`) is checkout →
`pnpm install` → `pnpm lint`; it never runs `api:compare`, so the manifest
does not exist and the rule silently no-ops for every file. It fires only for
developers who happen to have run `api:compare` locally — and then runs as a
pre-commit auto-fix, silently reordering members of files unrelated to the
change being committed. This is how #4877 picked up an unintended reorder of
`Arel::Nodes::Quoted`.

Verified: `packages/arel/src/nodes/casted.ts` on `origin/main` fails the rule
with 5 mismatches once the manifest exists locally, while `main` is green in
CI.

**2. Order data is per-file and name-deduped, so multi-class files are
unrepresentable.** The manifest entry for a file is one flat list. For
`packages/arel/src/nodes/casted.ts` it is:

```json
[
  "value",
  "attribute",
  "valueBeforeTypeCast",
  "constructor",
  "valueForDatabase",
  "isInfinite",
  "infinite",
  "buildQuoted"
]
```

`casted.rb` defines two classes whose members share names:

- `Casted` — `value_before_type_cast` (alias, `casted.rb:7`) precedes
  `value_for_database` (`casted.rb:17`).
- `Quoted` — `value_for_database` (alias, `casted.rb:38`) precedes
  `value_before_type_cast` (`casted.rb:39`).

Because the list is flat and deduped, `Quoted`'s members are collapsed into
`Casted`'s positions, and the rule demands `valueBeforeTypeCast` precede
`valueForDatabase` **in both classes** — contradicting `casted.rb:38-39`. The
Rails-correct order is therefore unachievable while the rule is active: the
auto-fixer reverts it. #4877 works around this by leaving the manifest
deleted locally.

## Acceptance criteria

- [ ] Decide and implement the rule's intended enforcement model: either
      generate the manifest in CI before `pnpm lint` (making the rule live
      repo-wide, which requires first fixing every currently-violating file),
      or commit the manifest, or retire the rule. Do not leave it in the
      current state where it is dormant in CI but auto-fixes locally.
- [ ] Key order data per class (or per class+file), not per file, so files
      defining multiple classes with overlapping member names can express
      each class's true Rails order.
- [ ] `packages/arel/src/nodes/casted.ts` passes the rule with `Casted` as
      `valueBeforeTypeCast` → `valueForDatabase` and `Quoted` as
      `valueForDatabase` → `valueBeforeTypeCast`, matching `casted.rb:7,17`
      and `casted.rb:38-39` respectively (this is the state #4877 ships).
- [ ] If the rule goes live in CI, the pre-commit auto-fix must not reorder
      members of files outside the staged change's intent.
