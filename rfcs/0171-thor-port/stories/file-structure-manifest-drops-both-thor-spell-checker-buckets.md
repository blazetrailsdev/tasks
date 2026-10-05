---
title: "The file-structure manifest drops both thor SpellChecker buckets (EXPECTED_UNRESOLVED_COLLISIONS row)"
status: done
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8538
claim: "2026-10-05T15:39:48Z"
assignee: "arms-extractor-reads-a-block-re-forward-guard"
blocked-by: null
closed-reason: null
---

## Context

`scripts/build-rails-file-structure-manifest.ts:182` carries one reviewed row in `EXPECTED_UNRESOLVED_COLLISIONS`: `thor/error.rb::SpellChecker`. The method-order manifest is keyed by the TS class NAME — the Ruby fqn's last segment — and `Thor::UndefinedCommandError::SpellChecker` (`vendor/thor/v1.3.2/lib/thor/error.rb:25-39`) and `Thor::UnknownArgumentError::SpellChecker` (`:66-81`) are siblings at the same depth, so `resolveLastSegmentCollision` (`scripts/rails-file-structure-collisions.ts`) has no winner and the bucket is dropped.

trails#8341 ported both classes, as `SpellChecker` inside a namespace merged onto each error class (`packages/trailties/src/thor/error.ts`). The row was written when neither was ported; it is still needed, and while it stands `blazetrails/rails-file-structure-method-order` enforces no member order on either class.

## Acceptance criteria

- The manifest can key a nested class by its enclosing class as well as its name, so the two `SpellChecker` buckets are both kept and both enforced.
- The `thor/error.rb::SpellChecker` row is deleted, and `EXPECTED_UNRESOLVED_COLLISIONS` is empty or holds only rows that still have no principled winner.
- `scripts/rails-file-structure-collisions.test.ts` covers the same-depth, different-parent case.
