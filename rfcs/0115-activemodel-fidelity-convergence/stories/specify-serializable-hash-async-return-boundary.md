---
title: "Specify the serializableHash async-return boundary"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel", "activerecord", "actionview"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6813
claim: "2026-08-20T22:18:55Z"
assignee: "delete-model-xml-serialization-and-nullify-blanks"
blocked-by: null
closed-reason: null
---

## Context

Prerequisite for `resolve-serialization-thenable-hash-async-return`, which is
registered `blocked` on it.

`packages/activemodel/src/serialization.ts:473` `thenableHash` exists because
`serializable_add_includes` (`vendor/rails/activemodel/lib/active_model/
serialization.rb:191`, `if records = send(association)`) reads associations
synchronously in Ruby and asynchronously in trails. The workaround is a `Proxy`
that is simultaneously a hash and a thenable — 67 code lines with no Rails
counterpart across `thenableHash`, `asJsonThenable` (`:449`),
`isSerializableCollection` (`:542`) and `sendAssociation` (`:524`).

RFC 0063 already decided the analogous case one way: `isValid()` returns
`Promise<boolean>`. This story does the equivalent groundwork for
`serializableHash` / `asJson` so the convergence story can proceed as a
mechanical change rather than an unbounded one.

This is a **survey and decision** story, not an implementation story. It ships
the call-site inventory and the decision; the code change is the story it
unblocks.

## Acceptance criteria

- A complete inventory of sync call sites of `serializableHash`, `asJson`,
  `toJSON` and `fromJson` across `packages/activemodel`,
  `packages/activerecord` and `packages/actionview`, with `file:line`. Seed:
  `grep -rn "serializableHash\|asJson(\|toJSON(" packages/{activemodel,activerecord,actionview}/src --include=*.ts | grep -v test`.
- For each, whether it can `await`, and what it costs if the return becomes an
  unconditional `Promise`.
- A recommendation, following RFC 0063's precedent unless the inventory shows
  a reason not to.
- The result is written into this RFC's `## Open questions` item 1 as a
  resolution, and `resolve-serialization-thenable-hash-async-return` is
  unblocked (`pnpm tasks status-set … ready`) or the follow-up RFC is filed.

## Definition of done

Not done if it concludes "keep the thenable and tag it PERMANENT" without the
inventory that would justify that.
