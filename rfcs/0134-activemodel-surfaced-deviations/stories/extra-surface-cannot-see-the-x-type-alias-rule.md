---
title: "parity:api:extra scores the sanctioned <X>Type rename novel in the activemodel barrel"
status: done
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: receipt-hygiene
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 7506
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7400's receipt sweep
(`no-counterpart-files-receipt-sweep`), which cleared every other novel name in
`packages/activemodel/src/index.ts` and left exactly these twelve, because the
sweep's story scoped them out as "falling out of the Type/ValueType story" — a
story that does not exist under that name.

`pnpm parity:api:extra --package activemodel`:

```text
index.ts — 12 novel, 2 moved [no Rails counterpart]
  BigIntegerType  BinaryType  BooleanType  DateTimeType  DateType  DecimalType
  FloatType  ImmutableStringType  IntegerType  StringType  TimeType  ValueType
```

Each is a barrel re-export whose declaration is already the `<X>Type` rename
`parity:api` sanctions for `ActiveModel::Type::<X>` (`TS_PARENT_ALIASES` /
`<X>Type` in `scripts/api-compare/compare.ts`) — e.g. `type/string.rb`'s
`ActiveModel::Type::String` is `StringType` in `type/string.ts`, which scores
clean in its own file. They read as novel ONLY in `index.ts`, which no Rails
file maps onto, so the file-level receipt is refused (the barrel has two `moved`
names, `AttributeMethods` and `Types`) and the non-renamed re-export takes its
tag from the declaring file, where the name is already allowed.

This is the same tooling gap PR #7400 closed for CLASS renames by moving
`TS_CLASS_RENAMES` into `scripts/parity/conventions.ts` and teaching
`extra-surface.ts` to read it: the systematic `<X>Type` alias is encoded in
`compare.ts` alone and `parity:api:extra` still cannot see it.

## Converged shape

Prefer the tooling fix over twelve receipts: hoist the systematic `<X>Type`
alias rule to `scripts/parity/conventions.ts` beside `TS_CLASS_RENAMES` and have
`collectAllowedNames` in `scripts/api-compare/extra-surface.ts` admit it the way
it now admits a per-class rename, so a barrel re-export of a sanctioned rename
stops scoring novel everywhere at once. Receipting the twelve by hand is the
fallback, and it leaves the rule encoded in one tool only — the exact split
`modelname-vs-rails-name-tooling-disagreement` was filed to end.

## Acceptance criteria

- `index.ts`'s twelve `*Type` rows are gone from
  `pnpm parity:api:extra --package activemodel`, by the shared rule rather than
  twelve tags.
- `scripts/api-compare/extra-surface.test.ts` and
  `scripts/parity/conventions.test.ts` green; no mark or baseline widened.
