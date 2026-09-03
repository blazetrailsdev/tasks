---
title: "Port ActiveRecord's Trailtie so railtie.rb stops being the one file activerecord is short, taking it to 281/281"
status: ready
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
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
`packages/activerecord/src/trailtie.ts` does not exist.

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

**Both includes are already accounted for in trails.** `JobRuntime` ships at
`packages/activerecord/src/trailties/job-runtime.ts:19`
(`export const JobRuntime = { instrument }`, re-exported from `index.ts:294`)
and `railties/controller_runtime.rb` is a standing `unported-files` row
(`scripts/parity/unported-files/unscoped.ts:170`). What is missing is the
carrier class that includes them.

CONTRIBUTING.md's rule for an `unported-files` row is that the surface does not
exist and is not intended to. Here it does: `railtie.rb`'s two initializer
blocks configure a framework trails ships, `@blazetrails/trailties` ships the
`Trailtie` base (`packages/trailties/src/trailtie.ts`), `rails/all` was wired
in #7439, and `packages/trailties/src/assets/trailtie.ts` is a worked example of
a `Trailtie` subclass in this repo. So the fix is the port, not an exclusion —
and the RFC forbids closing a row with an `unported-files` entry anyway.

## Converged shape

`packages/activerecord/src/trailtie.ts` defining `ActiveRecord`'s `Trailtie`
as a subclass of `@blazetrails/trailties`' `Trailtie`, mixing in the ported
`JobRuntime` so `instrument` lands on the class the way the Ruby `include`
does, and carrying the `railtie.rb` initializers that have trails counterparts.

Two judgement calls for the author, who will have the file open:

1. **How much of `railtie.rb`'s 417 lines to port.** Only `instrument` is
   scored; the initializers are `config.*` wiring, and several configure
   frameworks trails does not have. Port what has a counterpart, and do not
   invent config seats to fill the file — an initializer with no trails
   framework behind it is a novel name, and `parity:api:extra:gate` will say
   so.
2. **`ControllerRuntime`.** It stays unported (`unscoped.ts:170`); the class
   should carry only the `JobRuntime` include until that row is retired, and
   should not fake the other one.

## Acceptance criteria

- `packages/activerecord/src/trailtie.ts` exists with a real body — no
  `declare`, no bodyless signature, no placeholder class.
- `railtie.rb` reads **1/1**, and activerecord reports **files: 281/281**.
- `instrument` arrives on the class through the ported `JobRuntime`, not as a
  hand-written second copy of `trailties/job-runtime.ts`'s body.
- No `unported-files` row is added for `railtie.rb`, and none of the existing
  ones is widened.
- `pnpm parity:api:extra:gate` stays green — every public name the new file
  adds has a Rails counterpart, or the file does not add it.
- `pnpm parity:api:calls`, `:calls:args`, `:params` clean; boot / trailties
  suites green.
