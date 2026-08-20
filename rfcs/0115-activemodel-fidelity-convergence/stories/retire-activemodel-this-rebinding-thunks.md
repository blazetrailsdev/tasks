---
title: "Retire activemodel's 82 this-rebinding thunks onto include()/extend()"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: api-compare
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: "2026-08-20T23:33:52Z"
assignee: "retire-activemodel-this-rebinding-thunks"
blocked-by: null
closed-reason: null
---

## Context

RFC 0107 retired a ~330-line block of `this`-rebinding thunks from
`relation.ts` as its F5 finding
(`retire-relation-private-thunk-block`, PR #6590), replacing them with
`include()` / `Included<>` per CLAUDE.md's "Module mixins" section.

`packages/activemodel` carries the same shape and has no equivalent story.
Measured 2026-08-19, `.call(this` occurrences outside tests:

```text
attribute-methods.ts        25
model.ts                    18
attributes.ts               12
dirty.ts                     9
attribute-registration.ts    6
attribute-set/builder.ts     5
validations.ts               1
validations/length.ts        1
validations/inclusion.ts     1
validations/exclusion.ts     1
validations/acceptance.ts    1
secure-password.ts           1
                          ----
                            82
```

Each is a wrapper whose only job is to make a helper implemented in a sibling
module reachable as `this.x()` — the same thing Rails gets for free from
`include`. Rails' ActiveModel has no counterpart to any of them.

The `model.ts` 18 are absorbed by this RFC's Phase 1 fan-out stories, which
delete the file's shadow members outright. **This story is the remaining ~64**,
concentrated in `attribute-methods.ts`, `attributes.ts`, `dirty.ts`,
`attribute-registration.ts` and `attribute-set/builder.ts` — where a module's
functions are `.call`ed across file boundaries rather than mixed in.

Related: this RFC's F0 records that `include()` has only three real call sites
in the whole package (`model.ts:2814`, `naming.ts:457`,
`serializers/json.ts:214`, all pulling `toJSON` off
`ToJsonWithActiveSupportEncoder`) and `extend()` has none, which is why the
thunks accumulated.

Sequence after the Phase 1 fan-outs — several of the wrappers disappear with
the members they serve, and attacking them first would conflict on the same
files.

## Acceptance criteria

- `.call(this` occurrences in `packages/activemodel/src` outside tests drop
  from 82 to **≤ 20**, and each survivor is a place Ruby genuinely calls a
  module function explicitly rather than mixing it in.
- The helpers reach `this` via `include()` / `Included<>` (instance) or
  `extend()` / `Extended<>` (class), per CLAUDE.md "Module mixins" — not via a
  new wrapper layer under a different name.
- No behaviour change; the activemodel suites pass unchanged and no test is
  renamed or reworded.
- `pnpm parity:api:extra --package activemodel` novel/moved counts do not rise.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `:args` clean, no reseed; any row stranded in
  `scripts/api-compare/call-mismatches-exclude/activemodel/` is hand-deleted
  and the shard tightened.

## Verification

```bash
grep -rc "\.call(this" packages/activemodel/src --include=*.ts | grep -v test | grep -v ':0'
pnpm vitest run packages/activemodel/src
```
