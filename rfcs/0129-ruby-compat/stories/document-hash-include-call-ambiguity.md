---
title: "Hash#include? is missing from both ruby-compat call registers"
status: in-progress
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 38
pr: 7330
claim: "2026-09-01T12:03:02Z"
assignee: "converge-argument-error-onto-ruby-compat-activesupport"
blocked-by: null
closed-reason: null
---

## Context

PR #7314 converged `activesupport`'s duplicate `isInclude`
(`hash-utils.ts:119-121`) onto `@blazetrails/ruby-compat`'s `hasKey`, the port
of `rb_hash_has_key` (`vendor/ruby/hash.c:3671`). Its one call site,
`packages/activemodel/src/validations/format.ts:33`, mirrors
`activemodel/lib/active_model/validations/format.rb:22`:

```ruby
if options.include?(:with) == options.include?(:without)
```

The import had to be written `import { hasKey as isInclude } from
"@blazetrails/ruby-compat"` — the alias exists purely so the call gate still
resolves Rails' `include?` through the `include?` → `isInclude` convention
rename. A bare `hasKey` call raised a new `call-mismatches` row
(`activemodel validations/format.ts check_validity! include?`), which is the
gate correctly reporting that it cannot see `hasKey` as the port of `include?`.

`Hash#include?` is in NEITHER register in `scripts/parity/ruby-compat.ts`:

- not in `RUBY_COMPAT_EXPORTS`, because the bare name `include?` is claimed by
  `Enumerable#include?` and `Range#include?` (whose port is a real, separate
  `isInclude` on `ruby-compat/src/range.ts:156`) — admitting it would credit
  `hasKey` for a dropped `Enumerable#include?`, exactly what the table's
  MRI-keying rule forbids;
- not in `AMBIGUOUS_RUBY_CALLS` either, so the exclusion is undocumented and
  the next reader has to re-derive it, as this PR did.

Ruby aliases the two (`vendor/ruby/hash.c:3671` defines `key?`, `has_key?` and
`include?` onto one C function), so `hasKey` IS the port; only the comparator's
inability to recover a receiver keeps the row out.

## Converged shape

- Add `["Hash#include?", "`Enumerable#include?`and`Range#include?`(ported as`isInclude`) are also `include?`."]` to `AMBIGUOUS_RUBY_CALLS` in
  `scripts/parity/ruby-compat.ts`, beside the nine rows already there. That is
  the register's stated purpose — "the table's burndown, not its scrap heap" —
  and makes the exclusion reviewable instead of silent.
- Once `record-ruby-call-receiver-hints` lands a receiver hint, promote the row
  into `RUBY_COMPAT_EXPORTS` keyed on a Hash receiver, and drop the
  `as isInclude` import alias in `packages/activemodel/src/validations/format.ts:4`
  so the call site reads `hasKey(this.options, "with")` under its own name.

## Acceptance criteria

- `Hash#include?` has a row in `AMBIGUOUS_RUBY_CALLS` naming both homonyms.
- `scripts/parity/ruby-compat.test.ts` still passes; no row is added to
  `RUBY_COMPAT_EXPORTS` while the receiver is unresolvable.
- `pnpm parity:api:calls` stays green with no new baseline row.
