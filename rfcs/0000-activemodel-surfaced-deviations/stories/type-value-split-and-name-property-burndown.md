---
title: "activemodel: converge the Type/ValueType split and the per-subclass `name` property (~24 novel rows)"
status: ready
updated: 2026-09-01
rfc: "0000-activemodel-surfaced-deviations"
cluster: invented-arm
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has one class `ActiveModel::Type::Value`
(`vendor/rails/activemodel/lib/active_model/type/value.rb:9`) whose `type`
returns nil (value.rb:34-35); subclasses override `type` (e.g.
`type/integer.rb`'s `def type; :integer; end`).

trails splits it into an abstract `Type` base plus a `ValueType` subclass
(`packages/activemodel/src/type/value.ts:3`, `:136`) and gives every subclass
an invented `name` field (`type/integer.ts`, `float`, `decimal`, `string`,
`boolean`, `date`, `time`, `date-time`, `big-integer`, `binary`,
`immutable-string` — 11 files), with `Type#type()` reading `this.name` and
`ValueType` inverting it (value.ts:31-33, 139-141). `equals` sits on
`ValueType` (value.ts:143) where Rails' `==` is on `Value` (value.rb:121-127).
This is ~24 of activemodel's 50 novel extra-surface rows
(`pnpm parity:api:extra --package activemodel`), all unreceipted, and is the
main blocker for enrolling activemodel in `parity:api:extra:gate`.

The convergent shape: one `ValueType` class mirroring `Value` (with `equals`
and `type` on it), subclasses overriding `type()` as Rails does (returning the
colon-prefixed Symbol string per convention), and the `name` field deleted or
receipted if some consumer genuinely needs it (check `type/registry.ts` and
activerecord's schema dumping before deciding). Likely needs splitting into
2-3 PRs by file group — file follow-up stories here rather than fanning out.

## Acceptance criteria

- The decomposition matches Rails: one class per Rails class, `type` overridden
  per subclass, `equals` on the Value mirror.
- activemodel `novel` drops by the row count this covers, verified with a
  fresh `pnpm build && pnpm parity:api:extra --package activemodel`.
- Any surviving extra member carries a legal receipt.
