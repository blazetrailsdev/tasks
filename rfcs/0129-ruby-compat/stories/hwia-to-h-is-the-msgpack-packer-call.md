---
title: "HashWithIndifferentAccess#toH, the to_h the msgpack packer actually calls"
status: done
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7431
claim: "2026-09-03T02:25:21Z"
assignee: "drop-deep-stringify-keys-around-to-hash"
blocked-by: null
closed-reason: null
---

## Context

`write_hash_with_indifferent_access`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:236-238`)
is `packer.write(hwia.to_h)` — `Hash#to_h`, NOT `to_hash`. The two differ:
`to_h` on a Hash subclass answers a plain `Hash` with the SAME values, while
`to_hash` (`hash_with_indifferent_access.rb:376-381`) additionally runs
`convert_value_to_hash` over every value, so a nested
`HashWithIndifferentAccess` is converted too.

trails has no `toH` on `HashWithIndifferentAccess`, so the msgpack packer
(`packages/activesupport/src/message-pack/extensions.ts:200`) calls `.toHash()`
instead — and since `hwia-to-hash-returns-ruby-compat-hash` made `toHash()`
answer `@blazetrails/ruby-compat`'s `Hash` with nested `Hash` values, that call
site now additionally spells the tree back out with `deepStringifyKeys`. Rails'
registration is `recursive: true`, so its packer never needed either step: the
nested HWIA is packed by the type-17 handler again.

The registration is at `extensions.rb:101-104` /
`packages/activesupport/src/message-pack/extensions.ts:195-205`.

## Converged shape

`HashWithIndifferentAccess#toH` answering the ruby-compat `Hash` copy WITHOUT
`convert_value_to_hash` — `Hash#to_h` (`vendor/ruby/hash.c:3018`
`rb_hash_to_h`), which for a subclass receiver is `rb_hash_dup` into a bare
Hash. Then `extensions.ts`'s packer is `packer.write(v.toH())` with no
`deepStringifyKeys`, matching `:237` call-for-call, and the recursive packer
handles the nested HWIA the way Rails does.

## Acceptance criteria

- `HashWithIndifferentAccess#toH` exists and does not deep-convert values.
- The type-17 packer calls it, and the `deepStringifyKeys` at
  `extensions.ts:200` is deleted rather than moved.
- A round-trip test over a NESTED `HashWithIndifferentAccess` asserts the
  nested value comes back as a `HashWithIndifferentAccess`, which the current
  `deepStringifyKeys` spelling cannot answer.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` show no new
  rows.
