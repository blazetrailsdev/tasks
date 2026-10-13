---
title: "native-delete-at-each-block-tail-is-value-discarding"
status: done
updated: 2026-10-13
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8855
claim: "2026-10-13T13:34:15Z"
assignee: "native-delete-at-each-block-tail-is-value-discarding"
blocked-by: null
closed-reason: null
---

## Context

`native-hash-delete-sites-actionpack-trailties-rack-test` (RFC 0190) replaced
the value-discarding `hashDelete(` statements with `delete h[k]`. Three sites
had to stay on the helper because `parity:api:calls` reds on the native form:

- `Thor::Base::ClassMethods#remove_class_option`
  (`vendor/thor/v1.3.2/lib/thor/base.rb:445-449`) —
  `packages/trailties/src/thor/base.ts` `removeClassOption`.
- `Thor.check_unknown_options!` (`vendor/thor/v1.3.2/lib/thor.rb:350-360`) —
  `packages/trailties/src/thor/thor.ts` `checkUnknownOptionsBang`.
- `Rails::Generators::Base.remove_hook_for`
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:207-214`) —
  `packages/trailties/src/generators/base.ts` `removeHookFor`.

In each the Ruby `delete` is the LAST statement of an `each` block (in
`check_unknown_options!`, the last statement of an `if` arm that is itself the
block's tail). `void_statements` (`scripts/api-compare/extract-ruby-api.rb`,
"The statements whose value nothing reads") marks every statement of a list but
its last, so the call reaches `walk_call_in_order` with `value_used: true`, the
`formless` arm (`value_used && name == "delete"`) names the receiver `"?"` in
`callReceiverNames`, and `hasNativeFormAnalogue` (`compare.ts`) finds no
`@delete:?` form. The TS side is fine: the extractor records
`@delete:classOptions`, `@delete:_checkUnknownOptions`, `@delete:hooks`.

`Array#each` / `Hash#each` / `each_pair` discard their block's value
(`rb_ary_each`, `vendor/ruby/v3.3.11/array.c`), so the tail of such a block is
a void statement. `Thor::Base::ClassMethods#remove_command`
(`base.rb:502-510`) already credits, only because its two deletes are not the
block's last statement.

## Acceptance criteria

- [ ] `void_statements` marks the tail statement of a block passed to a call
      whose block value Ruby discards (`each`, `each_pair`, `each_key`,
      `each_value`, `each_with_index`, `times`), descending through an
      `if` / `unless` / `else` arm that is itself that tail.
- [ ] A block whose value IS read (`map`, `select`, `tap`'s receiver, a
      user-defined yielder) is unchanged; an `extract-ruby-api.test.ts` case
      pins both.
- [ ] The three sites above are `delete h[k]`, their `hashDelete` imports are
      removed where unused, and `pnpm parity:api:calls` is green with no
      baseline row.
- [ ] No other pair changes verdict on `parity:api:calls` or
      `parity:api:calls:args`.
