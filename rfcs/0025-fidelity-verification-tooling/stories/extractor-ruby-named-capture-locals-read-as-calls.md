---
title: "Call extractor reads Ruby named-capture locals as method calls, manufacturing unconvergeable baseline rows"
status: draft
updated: 2026-08-20
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The call-set extractor reads a Ruby **named-capture local** as a method call,
which manufactures a permanent, unconvergeable `call-mismatches` row. The
instance that surfaced this cost three review rounds on PR #6783, where a
reviewer read the row as stale and asked for it to be deleted.

Rails `activerecord/lib/active_record/connection_adapters/mysql/schema_dumper.rb:13-14`:

```ruby
if /\A(?<size>tiny|medium|long)(?:text|blob)/ =~ column.sql_type
  spec = { size: size.to_sym.inspect }.merge!(spec)
```

`=~` with a literal regexp on the left and a named capture assigns the capture
to a **local variable** — `size` on line 14 is that local, not a receiverless
call. The extractor cannot tell the two apart from the parse alone, so it puts
`size` on the Ruby call-set. The trails body binds the same capture explicitly,
`const size = sizeMatch.groups["size"].toLowerCase()`
(`packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts:124-125`),
which is a local and contributes no call. Ruby-set minus TS-set is permanently
`size → size`.

The row is therefore baselined at
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/mysql/schema-dumper.json:23`
with a reason recording exactly this. It can never converge by changing the TS
body: the only faithful port of a capture-local _is_ a local.

## Converged shape

Teach the Ruby-side extractor the `=~`-with-named-capture binding form: when a
method body contains `/…(?<name>…)…/ =~ expr` (regexp literal on the LHS — the
only form that creates locals), add every capture name in that literal to the
body's local set for the remainder of the method, so later bare references
resolve as locals and never reach the call-set.

Then delete the now-genuinely-stale baseline row by hand (only-shrink: do not
`--write`/reseed) and run
`pnpm parity:api:calls:tighten activerecord/connection-adapters/mysql/schema-dumper.json`
for the resulting stale high-water mark.

Worth grepping for other instances before landing — `grep -rn '=~' vendor/rails
--include=*.rb | grep '(?<'` — since each one is a latent false-positive row of
the same kind.

## Acceptance criteria

- The extractor treats named-capture locals from `regexp =~ expr` as locals, not calls.
- `prepare_column_options` no longer appears in the regenerated
  `scripts/api-compare/output/call-mismatches.json` for
  `connection-adapters/mysql/schema-dumper.ts`, and its baseline row is deleted.
- Any other rows the same fix retires are deleted in the same PR; mark shards
  tightened with `parity:api:calls:tighten`, never a reseed.
- `pnpm parity:api:calls` / `:args` clean; baseline row count strictly down.
