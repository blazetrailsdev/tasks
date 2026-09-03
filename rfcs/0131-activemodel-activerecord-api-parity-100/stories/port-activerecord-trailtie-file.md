---
title: "Point the tooling at trailties' ActiveRecord trailtie so railtie.rb stops being the one file activerecord is short, taking it to 281/281"
status: ready
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: ["activerecord", "trailties"]
deps: []
deps-rfc: []
est-loc: 250
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on `origin/main` `8f2de0daf` after a clean `pnpm build`, with
`API_COMPARE_FORCE=1 pnpm parity:api --package activerecord`:

```text
railtie.rb  ->  trailtie.ts   0   1   1   0%   X
```

This is the **only** file activerecord is short — the row behind
`files: 280/281` — and the RFC's own verification section asks for 281/281.

Its one credited member is not a `def` in `railtie.rb`. Rails' class is

```ruby
class Railtie < Rails::Railtie # :nodoc:
  include ActiveRecord::Railties::ControllerRuntime
  include ActiveRecord::Railties::JobRuntime
```

and `ActiveRecord::Railties::JobRuntime#instrument`
(`vendor/rails/activerecord/lib/active_record/railties/job_runtime.rb:9`,
private, wrapping `super` to stamp `payload[:db_runtime]` from
`ActiveRecord::RuntimeRegistry.sql_runtime`) reaches `ActiveRecord::Railtie`
through that include, so the extractor credits `Railtie#instrument`.

**The trailtie itself is already ported — it just does not live in
`packages/activerecord`.** trails settled every framework's trailtie into the
`trailties` package: `packages/trailties/src/trailties/` holds
`active-record.ts` (192 lines, `class Trailtie extends BaseTrailtie` with the
`railtie.rb` initializers), alongside `active-model.ts`, `action-controller.ts`,
`action-dispatch.ts`, `action-view.ts`, `active-support.ts` and `global-id.ts`.
`packages/activerecord/src/trailtie.ts` does not exist and **should not be
created** — a second `ActiveRecord::Railtie` carrier next door to the real one
is exactly the duplication this layout decision removed.

Both Ruby includes are accounted for on the activerecord side:
`packages/activerecord/src/trailties/job-runtime.ts:19`
(`export const JobRuntime = { instrument }`, re-exported from `index.ts:294`)
and `packages/activerecord/src/trailties/controller-runtime.ts`, whose Ruby
source is a standing `unported-files` row
(`scripts/parity/unported-files/unscoped.ts:170`).

So the file reads 0/1 for a **tooling** reason, not a porting one:
`rubyFileToTs` resolves `activerecord:railtie.rb` within the activerecord
package (`PATH_SEGMENT_ALIASES` gives `railtie → trailtie`,
`scripts/parity/conventions.ts:134`), and `RUBY_FILE_TS_OVERRIDES`
(`conventions.ts:153`) is keyed `<pkg>:<rubyFile>` → a TS path **inside that
same package's `src`**. There is no way today to say that a Ruby file's port
lives in a sibling package.

## Converged shape

Two halves, in this order.

1. **Teach the file mapping about the cross-package trailtie.** Extend the
   override mechanism so `activerecord:railtie.rb` resolves to
   `packages/trailties/src/trailties/active-record.ts` — a package-qualified
   override value (or a parallel `RUBY_FILE_CROSS_PACKAGE_OVERRIDES` table),
   plumbed through `rubyFileToTs`'s callers in `scripts/api-compare/` so the
   member scan reads the trailties file when scoring the activerecord row.
   Regenerate `docs/ruby-ts-conventions.md` from `conventions.ts` — never
   hand-edit it — and cover the new shape in `scripts/parity/conventions.test.ts`.

   The mechanism is deliberately general: `active-model.ts` next door is the
   same shape for `activemodel:railtie.rb`, and the other five trailties are
   the same shape for their frameworks. Land it for activerecord (this story's
   scored row) and file the rest rather than widening scope here.

2. **Land `instrument` on the trailties class.** `active-record.ts` currently
   has no `instrument`; mix in the already-ported
   `@blazetrails/activerecord`'s `JobRuntime` so the method arrives through the
   include the way Ruby's does, not as a second hand-written copy of
   `trailties/job-runtime.ts`'s body.

Two judgement calls for the author, who will have the file open:

1. **How much more of `railtie.rb`'s 417 lines to port.** Only `instrument` is
   scored, and `active-record.ts` already carries the initializers with trails
   counterparts. Do not invent config seats to fill the file — an initializer
   with no trails framework behind it is a novel name, and
   `parity:api:extra:gate` will say so.
2. **`ControllerRuntime`.** Its Ruby source stays unported
   (`unscoped.ts:170`); the class should carry only the `JobRuntime` include
   until that row is retired, and should not fake the other one.

## Acceptance criteria

- No `packages/activerecord/src/trailtie.ts` is created.
- `activerecord:railtie.rb` maps to
  `packages/trailties/src/trailties/active-record.ts` through a reviewed
  cross-package mapping in `scripts/parity/conventions.ts`, with a
  `conventions.test.ts` case, and `docs/ruby-ts-conventions.md` regenerated
  (not hand-edited).
- `railtie.rb` reads **1/1**, and activerecord reports **files: 281/281**.
- `instrument` arrives on `active-record.ts`'s `Trailtie` through the ported
  `JobRuntime`, not as a second copy of its body.
- No `unported-files` row is added for `railtie.rb`, and none of the existing
  ones is widened.
- `pnpm parity:api:extra:gate` stays green — the trailties file gains no public
  name without a Rails counterpart, and the newly-mapped file does not surface
  the rest of `active-record.ts` as activerecord extras. If it does, resolve it
  by mapping, not by baselining.
- `pnpm parity:api:calls`, `:calls:args`, `:params` clean; trailties and boot
  suites green.
- The equivalent cross-package rows for the other six trailties
  (`active-model.ts`, `action-controller.ts`, `action-dispatch.ts`,
  `action-view.ts`, `active-support.ts`, `global-id.ts`) are filed as their own
  story rather than folded in here.
