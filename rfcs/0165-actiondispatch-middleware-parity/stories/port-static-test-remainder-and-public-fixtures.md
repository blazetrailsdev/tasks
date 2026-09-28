---
title: "Port static_test.rb's remainder over the public/ and 公共/ fixtures"
status: draft
updated: 2026-09-28
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/static_test.rb`: `StaticTest`
(`:31-310`) is 28/35. `dispatch/static.test.ts` builds its own temporary
directory (`fs.mkdtempSync(…"static-test-")`, `:18`) where Rails reads
`test/fixtures/public/` and `test/fixtures/公共/` (40 files; the `.gz` / `.br`
ones are binary). The seven missing tests are the ones that need those files:
bad URL encoding, ASCII-8BIT URLs (including on Windows-31J), non-English
filenames plain and gzipped, gzip content-type fallback, and gzip with
`not modified`.

The public fixtures also back `abstract_unit.rb`'s default
`ShowExceptions` / `PublicExceptions` stack (`:120-131`), so they land under
the harness's fixtures directory.

## Acceptance criteria

- `fixtures/public/` and `fixtures/公共/` are copied byte for byte under the
  harness's fixtures directory.
- `static.test.ts` reads them instead of a temp dir, and the seven tests are
  ported.
- The file reports 35/35.
