---
title: "Importing activesupport testing/autorun outside a vitest run throws"
status: draft
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/testing/autorun.ts` (dist `testing/autorun.js:1,80`) imports `beforeEach`/`afterEach` from `vitest` and registers them at module top level. Any module that imports `describe` from autorun therefore throws "Vitest failed to access its internal state" when loaded by a plain `tsx` script.

trailmap hit this in trailmap#159: `test/support/transactional-tests.ts` needed autorun's `describe(suite)` to opt a vitest suite out of fixtures, and the gate scripts (`gate:lists --self-test`) load that support file outside vitest. The workaround is a lazy `await import(...)` inside `withoutFixturesIn`.

Expected shape: importing autorun's pure exports (`describe`, the suite→TestCase map) has no side effects; hook registration happens only under a running vitest (or from a separate entry such as `testing/autorun/register`), as Minitest's `require "minitest/autorun"` does nothing harmful outside a test process.

## Acceptance criteria

- `node --import tsx -e 'await import("@blazetrails/activesupport/testing/autorun")'` does not throw outside vitest.
- A test in activesupport covers the out-of-vitest import.
- trailmap's lazy import in `test/support/transactional-tests.ts` can become a static import (follow-up there).
