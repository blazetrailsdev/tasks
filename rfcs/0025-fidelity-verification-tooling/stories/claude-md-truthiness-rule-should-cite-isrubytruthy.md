---
title: "CLAUDE.md truthiness rule teaches the open-coded guard instead of isRubyTruthy"
status: draft
updated: 2026-08-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5979 (the fidelity-instructions audit), after merge.

That PR added a "Ruby idioms that do not translate literally" section to
CLAUDE.md. Its truthiness bullet tells agents to hand-roll the guard:

> Port `if x` as `x != null && x !== false` — or just `x != null` once you
> have checked the value can't be a boolean

That is correct but incomplete: the repo already has a shared helper,
`isRubyTruthy` in `packages/activerecord/src/ruby-truthy.ts:15`, adopted
repo-wide by the `rails-ruby-truthiness-audit-and-isrubytruthy-adoption`
story (PR #5215). A brand-new standing instruction that teaches the
open-coded form instead of the helper will re-scatter exactly the pattern
that story consolidated, and the next audit will find hand-rolled guards
that CLAUDE.md itself told agents to write.

Rails reference for the semantics being ported: Ruby treats only `nil` and
`false` as falsy, so every `if x` / `x && ...` in the vendored source (e.g.
`vendor/rails/activerecord/lib/active_record/associations/association.rb`
`stale_state` guards) is a two-value check, not a JS truthiness test.

## Acceptance criteria

- CLAUDE.md's truthiness bullet names `isRubyTruthy`
  (`packages/activerecord/src/ruby-truthy.ts:15`) as the default port for a
  Ruby truthiness guard, with the inline `x != null && x !== false` form kept
  only as the explanation of what the helper does and for packages that
  cannot import it.
- The bullet states where the helper lives and whether packages outside
  `activerecord` (arel, activemodel, activesupport) may import it; if they
  cannot, say what they should use instead rather than leaving it implicit.
- No other CLAUDE.md rule is reworded in the same change.

## Re-verified 2026-08-17 (draft sweep)

Still valid, verbatim. `grep -c isRubyTruthy CLAUDE.md` = **0**, and
`packages/activerecord/src/ruby-truthy.ts` still exists. The standing instruction
still teaches the open-coded guard over the shared helper.
