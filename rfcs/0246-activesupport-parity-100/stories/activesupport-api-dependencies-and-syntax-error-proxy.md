---
title: "activesupport: port or receipt Dependencies and SyntaxErrorProxy"
status: ready
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `dependencies.rb` (7/17): `interlock`, `interlock=`, `autoload_paths`,
  `autoload_once_paths`, `_eager_load_paths` and
  `_autoloaded_tracked_classes`, plus their writers.
- `dependencies/require_dependency.rb` (✗): `require_dependency`.
- `syntax_error_proxy.rb` (3/12): `path`, `lineno`, `to_s` (+ writers),
  `initialize`, `spot`, `label`. These are `BacktraceLocation`'s and
  `BacktraceLocationProxy`'s Struct members and delegators.
- `dependencies_test.rb` is ✗ in `parity:test` with 0 tests matched.

## Acceptance criteria

- [ ] Port `interlock` / `interlock=` onto the existing load interlock.
- [ ] Per RFC 0246 Open question 3: add `PERMANENT:` rows for the autoload path
      accessors and `require_dependency` that cite "`Module#autoload` is a
      build step" and "The application loader is Zeitwerk".
- [ ] Port the 9 `SyntaxErrorProxy` members.
- [ ] Resolve the ✗ `dependencies_test.rb`: port its tests, or add a
      `PERMANENT:` row that cites the same sections.
