---
title: "Object#inspect has no port, so xml-mini and array-utils each grew a private toS"
status: done
updated: 2026-08-15
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6571
claim: "2026-08-15T17:45:08Z"
assignee: "except-only-go-through-relation-with-values"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Object#inspect` has no port in trails, so every body that needs it
grows a private stand-in. Two exist right now, with different behaviour:

- `packages/activesupport/src/xml-mini.ts:264-271` — a private `toS` that
  formats nested Arrays and Hashes.
- `packages/activesupport/src/array-utils.ts` — a private `toS` plus a private
  `inspect`, added by PR #6556 for `Array#to_fs`'s `else` arm, which Rails
  writes as the receiver's own `to_s` (`core_ext/array/conversions.rb:94-105`;
  `Array#to_s` IS `Array#inspect`).

The two disagree on details (nil rendering, symbol-key hash form) and neither
is reachable from anywhere else, so the next body that needs `inspect` will
write a third. `String(x)` is not a substitute: for JS it is `to_s`, which
gives the comma-joined form for a nested Array and `[object Object]` for a
plain object.

## Converged shape

Port `Object#inspect` once, at its Rails-facing location — `core-ext/object/`,
next to `blank.ts`, which is where
[[port-object-blank-to-core-ext-and-retire-private-copies]] put the same shape
for `blank?` — and retire both private copies onto it. That earlier story is the
precedent to follow, including its "retire the private copies" half.

Ruby's rendering is the specification; verify against MRI rather than deriving
it (`ruby -e 'p [1, [2, "a"], {b: 3}, nil].to_s'` →
`[1, [2, "a"], {:b=>3}, nil]`).

## Acceptance criteria

- [ ] One ported `inspect` in `core-ext/object/`; no private `toS`/`inspect`
      left in `xml-mini.ts` or `array-utils.ts`.
- [ ] Rendering matches MRI for nested arrays, hashes, nil, strings and numbers,
      asserted against values checked with `ruby -e`.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new surface.
