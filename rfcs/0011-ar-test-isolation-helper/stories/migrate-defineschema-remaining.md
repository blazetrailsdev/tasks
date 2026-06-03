---
title: "Migrate remaining defineSchema-per-file tests (batched)"
status: draft
rfc: "0011-ar-test-isolation-helper"
cluster: test-isolation-helper
deps: ["migrate-defineschema-pilot"]
deps-rfc: []
est-loc: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Once the pilot proves the wall-clock win and pins the recipe, migrate the rest
of the `defineSchema`-per-file + global-reset files onto `useHandlerFixtures`.
This is large (~180 files) and **must be shipped in ≤500 LOC batches**, each a
separate PR off `main` with non-overlapping files.

See RFC 0011 §Rollout Phase 2 and
[`fixtures-adoption-inventory.md`](https://github.com/blazetrailsdev/trails/blob/main/docs/activerecord/fixtures-adoption-inventory.md).

## Acceptance criteria

- [ ] All `defineSchema`-per-file + global-`resetTestAdapterState` files moved
      onto `useHandlerFixtures` (schema in `beforeAll`, rollback isolation)
- [ ] Each batch is its own ≤500-LOC PR, non-overlapping files, off `main`
- [ ] No regression on any adapter; net suite wall-clock improvement reported
- [ ] `est-loc` re-estimated per batch before claim (this umbrella story is
      `null` by design — excluded from `next-bundle`)

## Notes

Opportunistic: pair with the fixtures-adoption work already in flight so a file
is touched once for both. Status stays `draft` until the pilot lands.
