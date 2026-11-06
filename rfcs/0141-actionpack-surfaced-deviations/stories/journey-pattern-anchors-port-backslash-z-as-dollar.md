---
title: "Journey::Path::Pattern ports Ruby \\Z as JS $"
status: draft
updated: 2026-11-06
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Journey::Path::Pattern` ports Ruby's `\A` / `\Z` anchors as JS `^` / `$`:
`AnchoredRegexp#accept` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/path/pattern.rb:75-77`, `%r{\A#{visit node}\Z}`),
`UnanchoredRegexp#accept` (`:119-122`, `%r{\A#{path}(?:\b|\Z|/)}`) and
`requirements_for_missing_keys_check` (`:178-182`, `/\A#{regex}\Z/`), in
`packages/actionpack/src/action-dispatch/journey/path/pattern.ts`. Ruby's `\Z`
also matches before one trailing `\n`; JS `$` (no `m` flag) matches only at end
of input, so a path or segment ending in `\n` matches in Rails and not in trails.
Surfaced in review of trails#9782.

## Acceptance criteria

- The three sites spell `\Z` as `(?=\n?$)` (and `\A` as `^`, no `m` flag), matching Rails.
- `pattern.test.ts` expected sources follow; a trails test pins a requirement matching `"test\n"` in the missing-keys check as Ruby does.
