---
title: "Classify the ivar-underscore, mixin .call(this) and block-idiom naming rows as permanent"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6543
claim: "2026-08-14T20:45:06Z"
assignee: "alias-attribute-definition-through-pattern"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6540 (`naming-burndown-3-ar-model-encryption-tasks`), which read
all 18 remaining `naming` call-argument rows in its slot against `vendor/rails`
and found only 2 closable by renaming. The rest are not deviations at all — they
are **recorder artifacts**: the TS body already matches Rails, but the extractor
spells the two sides differently. They are currently classified `burndown`, which
means `naming-gate-flip` (blocked) can neither baseline them nor watch them go to
zero.

`scripts/api-compare/naming-taxonomy.ts` already has the three `permanent`
classes (`js-reserved-word`, `no-js-equivalent`, `conventions-rename`). These are
three more mechanical classes it can recognise, each provable from the shape of
the two argument strings rather than from a judgement call.

### 1. Ruby ivar `@foo` vs TS private field `_foo`

Rails reads an ivar bare; trails spells the same ivar `this._foo`. The recorder
emits `ref:foo` vs `ref:_foo`.

- `activerecord/lib/active_record/migration.rb:1422,1535` — `@direction`, passed
  to `migration.migrate(@direction)`; trails `migration.ts:2575`
  `migrate(this._direction)`.
- `activerecord/lib/active_record/attribute_methods.rb:43,47` — `include
@generated_attribute_methods`; trails `attribute-methods.ts:285`
  `include(this, this._generatedAttributeMethods)`.

Note `attribute_methods.rb:47` includes the **ivar**, not the
`generated_attribute_methods` reader — so trails is already correct here and
there is nothing to converge. The `_` prefix is the settled repo-wide spelling
for a Ruby ivar.

Detection: TS ref equals the Ruby ref with a single leading `_`.

### 2. Module-mixin `.call(this)` receiver

The settled trails idiom for Ruby `include` (CLAUDE.md, "Module mixins") turns
`foo` into `foo.call(this)`, and the recorder takes the outermost callee, so the
argument records as `ref:call`.

- `model-schema.ts:775` — `Object.values(columnsHash.call(this))` vs
  `activerecord/lib/active_record/model_schema.rb:433` `columns_hash.values`.

Detection: TS ref is exactly `call` and the Ruby ref names a method that exists
as a this-typed export in the same TS file. Overlaps the already-done
`module-mixin-receiver` class, which covers the receiver being passed as a
leading argument; this is the same idiom recorded at a different position.

### 3. Block-parameter idiom

Ruby `owner.instance_exec(&block)` is trails' `block(this.owner)` — the block
becomes a plain function and the receiver becomes its argument.

- `activerecord/lib/active_record/associations/belongs_to_association.rb:47` —
  `writer(owner.instance_exec(&block)) if reader.nil?`; trails
  `associations/belongs-to-association.ts:76`
  `await this.writer(await block(this.owner))`.

Detection: Ruby ref is `instanceExec` / `instance_exec` and the TS ref is
`block`.

## Converged shape

Three more entries in `NAMING_CLASSES` in
`scripts/api-compare/naming-taxonomy.ts`, each `permanent: true` with one shared
reviewed reason (the RFC 0096 `## Residue taxonomy` contract: one reason per
class, never per row). `pnpm parity:api:calls:args:report` then splits them out
of `burndown`, and `naming-gate-flip` gets a reachable zero.

Re-measure the whole `naming` population afterwards — these classes are not
slot-local, so the wave-3 slot estimates that are still open should be re-derived
from the new counts before anyone claims them.

## Acceptance criteria

- [ ] `naming-taxonomy.ts` recognises the ivar-underscore, mixin-`.call`, and
      block-idiom classes, each `permanent` with one reviewed reason.
- [ ] The classes are unit-tested in `naming-taxonomy.test.ts` against the
      real argument pairs cited above.
- [ ] `pnpm parity:api:calls:args:report` shows the repo-wide `burndown` count
      drop by the reclassified rows, with no row moved out of `burndown` that a
      rename could still close.
- [ ] No baseline row added, widened or reseeded.
