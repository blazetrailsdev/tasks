---
title: "Audit ported Ruby truthiness guards; adopt isRubyTruthy"
status: done
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 20
pr: 5215
claim: "2026-07-24T04:53:23Z"
assignee: "rails-ruby-truthiness-audit-and-isrubytruthy-adoption"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by [#4964](https://github.com/blazetrailsdev/trails/pull/4964), where a
single ported Ruby conditional was wrong TWICE in review for two different
reasons, both invisible to tests until a reviewer named the exact value.

Ruby and JS truthiness disagree in both directions. In Ruby ONLY `nil` and
`false` are falsey, so `""`, `0`, `0.0`, `NaN` and `[]` are all truthy; in JS
the first four are falsy. Any `if some_value` / `some_value && ...` /
`some_value ? :` guard ported as a bare JS truthiness check therefore silently
changes behavior for empty strings and zeroes — and, where a value can be
`false`, a naive `!= null` "fix" over-corrects in the other direction.

Concretely in #4964, porting
`postgresql_adapter.rb:326`:

```ruby
conn_params[:user] = conn_params.delete(:username) if conn_params[:username]
```

- as `if (username)` wrongly skipped `username: ""` (truthy in Ruby), and
- as `if (username != null)` wrongly accepted `username: false` (falsey in Ruby,
  and it survives the `@config.compact` on the preceding line).

PR #4964 extracted `isRubyTruthy` into
`packages/activerecord/src/ruby-truthy.ts` — it already existed, privately, in
`encryption/encrypted-attribute-type.ts`, which is itself evidence this hazard
recurs and gets solved locally each time. Both adapters and the encryption type
now share it.

The open question is how many other ported Ruby guards carry the same defect.
`adapter-args.ts:215` (`adapterConfig.socket !== ""`) is one hand-rolled example
found immediately, without looking. Nobody has swept for the rest.

## Acceptance criteria

- Sweep ported Ruby conditionals for bare-JS-truthiness guards where the guarded
  value can be `""`, `0`, or `false`. Prioritize config/option reading and
  attribute/default paths, where empty string and zero are realistic values;
  `vendor/rails` is the oracle for what each guard means.
- Fix the real divergences found by routing them through `isRubyTruthy`
  (`packages/activerecord/src/ruby-truthy.ts`). Each fix cites the Rails
  `file:line` it ports and the value that diverged.
- Adopt `isRubyTruthy` at the hand-rolled sites already known:
  `adapter-args.ts:215`, plus any others the sweep turns up.
- Decide whether a lint is feasible and record the conclusion either way. A
  general rule is likely NOT tractable (nothing marks a value as Ruby-derived),
  but a scoped rule may be — e.g. flag bare truthiness on values read from a
  configuration hash. `rails-callback-invocation-lint-rule` is the precedent for
  a manifest-driven lint in this RFC. If not feasible, say so explicitly rather
  than leaving it open.
- If the sweep is larger than one PR, ship the highest-risk slice and register
  the remainder as follow-on stories — do NOT fan out sibling PRs.

## Notes

Size is a guess pending the sweep; the audit portion may justify splitting the
burndown into its own story once the true count is known.
