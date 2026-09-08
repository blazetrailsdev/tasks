---
title: "TSETracker's interpolation and sigil arms are ERB-shaped and never fire on a .tse template"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR 7628 ported `ERBTracker` as `TSETracker`
(`packages/actionview/src/dependency-tracker/tse-tracker.ts`) LITERALLY, matching
`vendor/rails/actionview/lib/action_view/dependency_tracker/erb_tracker.rb`
line for line. `parity:api` reports 13/13, and review passed on fidelity
grounds. But the tracker scans TEMPLATE SOURCE, and trails templates are `.tse`,
not `.erb` — so three arms of the literal port can never fire on a real trails
template:

- `addStaticDependency` keys the wildcard walk on `#{`
  (`erb_tracker.rb:114-150`, ported at the `dependency.includes("#{")` guard and
  the `indexOf("#{", pos)` loop). A `.tse` template interpolates with `${`, so
  the whole brace-matching loop — including the bail-on-unbalanced `return` —
  is unreachable, and a genuinely interpolated partial path yields no `/*`
  wildcard for `WildcardResolver` to expand.
- `VARIABLE_OR_METHOD_CHAIN` carries Ruby's `(?:\$|@{1,2})?` sigil prefix
  (`erb_tracker.rb:17`). trails has no `@`/`@@` sigils; an instance variable is
  `this.x`.
- `PARTIAL_HASH_KEY` / `LAYOUT_HASH_KEY` carry the hash-rocket arm
  `:partial\s*=>` (`erb_tracker.rb:30-38`). trails kwargs are object literals
  with one spelling.

This is the unmet half of `tse-tracker-ports-the-erb-regex-tracker`, whose
"Converged shape" already specified exactly this adaptation and required each
dropped arm be noted at the constant with its Rails `file:line`. That story is
still `ready` and unclaimed; its Context now reads as "port this file", when the
file exists — read it as "adapt the existing file".

## Converged shape

Resolve the tension first, because it is a real one and this story exists to
settle it: literal Rails fidelity (what shipped, what the fidelity gates
measure) versus the RFC's TSE adaptation (what actually detects dependencies in
a trails template). The tracker's job is finding render dependencies in `.tse`
source, so the adaptation is very likely right — but it makes
`erb_tracker.rb <-> tse-tracker.ts` intentionally diverge, which needs a
recorded decision rather than a silent edit, and the divergence must be spelled
at each constant with the Rails `file:line`, as the parent story requires.

If adaptation wins: `${` replaces `#{` in `addStaticDependency`; the sigil
prefix and hash-rocket arms drop; each site carries its note. If literal
fidelity wins, say so at the constants instead, and record that trails templates
get no interpolation wildcards.

## Acceptance criteria

- [ ] A recorded decision at the constants, with Rails `file:line`, for each of
      the three arms.
- [ ] A test over a real `.tse` template body proving the chosen behaviour: an
      interpolated partial path either yields a `/*` wildcard that
      `WildcardResolver` expands, or is documented as yielding none.
- [ ] An unbalanced brace discards the dependency rather than emitting a partial
      path, on whichever delimiter is chosen.
- [ ] `pnpm parity:api --package actionview` still reports 13/13 for
      `dependency_tracker/erb_tracker.rb`.
- [ ] `tse-tracker-ports-the-erb-regex-tracker` is retitled/rewritten or closed
      as superseded, so it no longer reads as "port a file that exists".
