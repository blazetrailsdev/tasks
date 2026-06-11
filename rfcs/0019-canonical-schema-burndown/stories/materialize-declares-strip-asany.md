---
title: "Materialize model declares: migrate test-local model classes + strip redundant as any"
status: ready
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["materialize-declares-rollout-waves"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to the declare-materialization pilot (trails PR #3099). This is the
actual payoff of the materialization program. The pilot proved that
materializing canonical models alone drops ~0 `as any` casts because most
attribute/Topic tests define a **test-local** `class Topic extends Base` inside
the `it(...)` body — the materialized canonical declares never apply to those
ad-hoc classes. With the whole graph materialized
(`materialize-declares-rollout-waves`), those test-local classes can be replaced
by the canonical model imports and the now-redundant casts removed.

## Acceptance criteria

- [ ] Migrate representative test files that define a test-local
      `class X extends Base` inside `it(...)` bodies to import the canonical
      model from the registry instead.
- [ ] Strip the `as any` casts those test-local classes forced, where the
      canonical declares now make them redundant.
- [ ] `pnpm typecheck` green after each conversion.
- [ ] Report the measured `as any` delta per converted file to validate the
      end-to-end payoff.

## Notes

Some remaining casts target framework-internal members not in the declare set
(`readAttribute`, `idWas`, `_dirty`, `columnsHash`, `connection`); those are
out of scope here and should be left in place. Keep each PR ≤500 LOC and
register continuation work as new stories rather than stacking.
