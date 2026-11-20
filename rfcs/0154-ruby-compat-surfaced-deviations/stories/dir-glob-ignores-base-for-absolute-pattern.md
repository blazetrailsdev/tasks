---
title: "dir-glob-ignores-base-for-absolute-pattern"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
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

# Dir.glob strips base from an absolute pattern's results

## Context

`Dir.glob(pattern, flags = 0, base: nil)` (`vendor/ruby/v3.3.11/dir.rb:410`) applies `base` only to a
relative pattern: for an absolute pattern `glob_helper` (`vendor/ruby/v3.3.11/dir.c`) walks from `/`
and returns full paths. `Dir.glob` / `Dir.globAsync` in `packages/ruby-compat/lib/dir.ts` strip the
`base` prefix from every result, including an absolute expansion's.

## Acceptance criteria

- The `base` prefix is stripped only from entries produced by a relative brace expansion; an absolute
  pattern with `base:` answers full paths, in both `glob` and `globAsync`.
- A `dir.trails.test.ts` case pins it, verified against ruby 3.3.11.
