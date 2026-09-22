---
title: "deprecation-callstack-blame-has-no-eval-file-attribution"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`deprecation_test.rb:764-790` covers which frame a warning blames. All three
tests lean on Ruby facilities JS has no counterpart for: `caller_locations`
returning `absolute_path`/`lineno` for the CALLER of a test-file method
(`:764-769`), and `class_eval(<<~RUBY, "/path/to/template.html.erb", 1)`
(`:771-775`, `:783-787`) attributing generated code to a fabricated file name so
the message reads `(called from … at /path/to/template.html.erb:2)`.

trails' `callerLocations`
(`packages/activesupport/src/deprecation.ts:110-126`) parses `Error().stack`,
whose frame offsets do not line up with Ruby's `caller_locations(2)`, and there
is no JS `eval` form that names the compiled unit the way `class_eval`'s second
argument does.

## Parked tests

`packages/activesupport/src/deprecation.test.ts`, `it.skip` with converged
bodies and a `BLOCKED: deprecation-callstack-blame-has-no-eval-file-attribution`
line:

- `warn deprecation skips the internal caller locations`
- `warn deprecation can blame code generated with eval`
- `warn deprecation can blame code from internal methods`

## Acceptance criteria

- [ ] Decide whether the three can be converged against a source-map-aware
      caller-location port, or whether this is a genuine language shortcoming
      to ratify in CLAUDE.md with `@noRailsEquivalent PERMANENT` receipts.
- [ ] Either the three parked tests run unskipped and green, or the section is
      written and they carry a ratified receipt.
