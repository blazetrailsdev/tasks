---
title: "JSON.stringify stands in for Ruby inspect at the non-String sites"
status: draft
updated: 2026-09-05
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7518, which converged the `String#inspect` half of this class:
`paths.ts`, `attribute-set.ts`, `url.ts`, `tag-helper.ts`, `route-set.ts`,
`metal.ts` and `rfc3986-parser.ts` now spell `#{x.inspect}` as ruby-compat's
`rbInspect`, not `JSON.stringify`.

`JSON.stringify` is not `inspect`. For a String the two agree on ordinary
characters and diverge on the escapes Ruby renders and JSON does not — `\e`,
`\a`, `\v`, a `#{`/`#$`/`#@` sequence, and a non-ASCII byte, which Ruby emits
as `\xNN` for a binary string (`vendor/ruby/string.c` `rb_str_inspect`). For
every other type they are not even close: Ruby renders a Hash as
`{:a=>1}`, an Array as `[1, 2]`, a Symbol as `:name`, `nil` as `nil`, and a
Time through its own `inspect`.

PR #7518 deliberately left the non-String sites alone, because each renders a
value whose Ruby `inspect` spelling is a decision of its own with existing
assertions behind it. `rbInspect` (`packages/ruby-compat/src/object.ts:64`)
already implements all of them — `inspectHash`, `inspectAry`, the Symbol and
nil arms — so the remaining work is per-site verification, not new machinery.

The sites, each with its Ruby counterpart:

- `actionpack/.../routing/route-set.ts:733,875` — `"No route matches #{constraints.inspect}"`
  (`actionpack/lib/action_dispatch/routing/route_set.rb:266`) and
  `journey/formatter.rb:54`'s `Hash[constraints.sort_by { |k, v| k.to_s }].inspect`,
  which SORTS before inspecting.
- `activerecord/.../postgresql/oid/hstore.ts:154` — the `HSTORE_ERROR` input.
- `arel/src/nodes/bound-sql-literal.ts:43` — `"missing values for #{missing.inspect}"`,
  an Array.
- `activesupport/src/cache/serializer-with-fallback.ts:186` and
  `activesupport/src/messages/serializer-with-fallback.ts:192` —
  `KeyError: key not found: #{format.inspect}`, where `format` is a Symbol and
  Ruby renders `:marshal_7_1`, not `"marshal_7_1"`.
- `activesupport/src/messages/metadata.ts:173` — `"no time information in #{expires_at.inspect}"`,
  a Time.
- `actionpack/.../http/permissions-policy.ts:163,195`,
  `abstract-controller/collector.ts:43`,
  `activerecord/.../schema-definitions.ts:48`, `mysql2-adapter.ts:284,287,939,993,996`,
  `activerecord/src/support/config.ts:32`, `trailties/.../updater.ts:59` and
  `trailties/.../trails-actions.ts` — check each against its Ruby raise; several
  have no Rails counterpart at all and are trails-invented messages, which is a
  different finding to record per site rather than convert.

## Converged shape

Per site: read the Ruby raise, and if it calls `inspect`, import `rbInspect`
from `@blazetrails/ruby-compat` and use it. Where the Ruby side sorts or
otherwise transforms before inspecting (`journey/formatter.rb:54`), port that
too — the sort is part of the message, not incidental.

Where a site has no Ruby counterpart, leave `JSON.stringify` and note the site
here as trails-invented surface rather than converting it; an invented message
is a separate deviation from a mis-spelled one.

Expect assertion churn: a Hash message changes from `{"a":1}` to `{:a=>1}` (or
Ruby 3.4's `{a: 1}` — settle which the repo targets and apply it uniformly),
and a Symbol from `"marshal_7_1"` to `:marshal_7_1`.

## Acceptance criteria

- [ ] Every listed site either goes through `rbInspect` or is recorded here as
      having no Ruby counterpart, with the Rails file:line checked either way.
- [ ] The Hash-inspect spelling is settled once and applied uniformly, not
      per-site.
- [ ] `journey/formatter.rb:54`'s sort-before-inspect is ported, not dropped.
- [ ] Touched suites green; `pnpm parity:api:calls` does not regress.
