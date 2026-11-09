---
title: "ruby-compat optparse: port require_exact and raise_unknown arms"
status: draft
updated: 2026-11-09
rfc: "0154-ruby-compat-surfaced-deviations"
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

`packages/ruby-compat/lib/optparse.ts` (after trails#9918) ports `List`, `OptionMap#complete` and the `parse_in_order` long/short arms, but omits MRI's `require_exact` / `raise_unknown` accessors (vendor/ruby/v3.3.11/lib/optparse.rb:1150-1151, 1227-1230) and their arms in `parse_in_order` (optparse.rb:1645-1650, 1674, 1682): an abbreviated long option is refused when `require_exact`, and an unknown option `throw :terminate, arg` unless `raise_unknown`.

## Acceptance criteria

- `OptionParser#requireExact` / `raiseUnknown` accessors with MRI defaults (`false` / `true`).
- `parse_in_order`'s long and short branches take the `require_exact` and `raise_unknown` arms at the MRI positions, line for line.
- Tests: an abbreviated `--fo` raises `InvalidOption` with `requireExact = true`; an unknown option stops parsing and stays in argv with `raiseUnknown = false`.
