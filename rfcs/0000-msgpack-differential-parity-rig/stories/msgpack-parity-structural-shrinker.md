---
title: "msgpack parity: structural shrinker for a failing value-spec"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
cluster: rig
packages: ["msgpack"]
deps: ["msgpack-parity-driver-and-byte-diff-report"]
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A generated spec that diverges is usually a deep tree whose divergence comes
from one leaf. Committing it to the corpus unshrunk makes a corpus case that is
unreadable and over-constrained — it would red on any unrelated change to a
sibling type.

`shrink.ts` minimises a failing spec by repeated structural reduction, keeping
only reductions that still diverge.

## Acceptance criteria

- [ ] `shrink.ts` reduces a failing spec by: dropping array and map elements,
      replacing a container with one child, shrinking integer magnitude toward
      zero, truncating strings, and replacing a leaf with `nil`.
- [ ] Each candidate reduction is re-checked against the oracle and kept only
      if it still diverges.
- [ ] Shrinking terminates — a fixpoint, with an iteration cap as a backstop —
      and never returns a spec that does not diverge.
- [ ] The shrunk spec is what the corpus writer records.
- [ ] A unit test shrinks a synthetic failure (a deliberately broken packer
      stub) down to the expected minimal spec.

## Definition of done

A shrinker that can return a passing spec does not close this story; the
post-condition is that the returned spec still diverges.

## Verification

```bash
pnpm vitest run packages/msgpack/parity/shrink.test.ts
```
