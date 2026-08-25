---
title: "Unpublish the AR test harness from the main package"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The published package contains the entire AR test harness: `dist/test-helpers/`
(1.45 MB), plus `dist/test-fixtures/`, `dist/cases/`, `dist/assertions/`,
`dist/testing/` — **1.52 MB across 1,576 files**, including the canonical
schema (`dist/support/canonical-schema.js`, 73,828 B), the full canonical model
corpus and the fixture data.

It is provably unreachable from the public entrypoint: an esbuild metafile scan
of the 653 modules bundled from `import { Base } from "@blazetrails/activerecord"`
for `test-helpers|test-fixtures|canonical|\.test\.|fixtures` returns **zero
hits**. So this is install-weight only — no app pays it at runtime, every
installer pays it on disk.

Rails' equivalent (`activerecord/test/models/`, `test/fixtures/`,
`test/schema/schema.rb`) is not in the gem.

The one thing to settle first: whether any of this is _deliberately_ published
for downstream consumers to reuse the canonical models. If it is, the answer is
a separate `@blazetrails/activerecord-testing` package, not continuing to ship
it inside the main one.

## Acceptance criteria

1. Determine and record whether the harness is intentionally published. Check
   `activerecord-cli`, `dx-tests`, `virtualized-dx-tests`, `packages/website`,
   and any example app for imports of `@blazetrails/activerecord/test-helpers/*`
   or `/support/canonical-schema.js`.
2. If not needed by any consumer: it is excluded from the published tarball,
   and `npm pack --dry-run --json` shows no `test-helpers/`, `test-fixtures/`,
   `cases/`, `assertions/` or `testing/` entries.
3. If it is needed: it moves to its own package with its own `package.json`,
   and `@blazetrails/activerecord`'s tarball no longer contains it. Do **not**
   close this story by writing a justification for shipping it.
4. In-repo test runs are unaffected — they resolve the harness from `src`, not
   from `dist`.
5. Before/after package size and file count in the PR body.
