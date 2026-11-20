---
title: "declaration-only-mysql2-client-readers-and-struct-attributes-writer"
status: draft
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

What is left of `burn-down-the-declaration-only-population-remaining` once its PR lands. `pnpm parity:api --package <pkg> --missing` still reports three `[declaration-only]` rows:

- mysql2 `client.rb` → `packages/activerecord/lib/mysql2/client.ts`: `Client#query_options` and `#read_timeout`, both `attr_reader`s (`vendor/mysql2/0.5.6/lib/mysql2/client.rb:3`). trails has no `Client` class. `mysql2Client()` decorates the driver connection with data properties (`client.ts:449-498`), `initialize` writes them onto a `Wrapper` (`client.ts:552-559`), and the only declaration is the `Mysql2Client` interface (`client.ts:84-96`). Converging means porting `Mysql2::Client` as a class whose `initialize` sets `@query_options` / `@read_timeout`, with the readers on it. The `mysql2-gem-port` RFC's story `mysql2-client-is-a-class-with-async-new` does exactly that; this row closes when it lands.
- solid-queue `configuration.rb` → `packages/solid-queue/lib/configuration.ts`: `Process#attributes=`. `Process` is `class Process extends Struct.new("kind", "attributes")` (`configuration.ts:31`, Rails `vendor/solid_queue/v1.7.2/lib/solid_queue/configuration.rb:15`). `kind=` credits but `attributes=` resolves to the `setAttributes` candidate (`rubyMethodToTs`, `scripts/parity/conventions.ts:1922-1955`), and the misplaced-cluster verdict (`compare.ts` `misplacedClusterVerdict`) finds only a bodyless `setAttributes`/`attributes` declaration. Find which declaration answers it and whether a `Struct.new` heritage class's generated writer should credit `attributes=`.

## Acceptance criteria

- Each row has its body at the Rails name in the mirror file, and `pnpm parity:api --package <pkg> --missing` shows no `[declaration-only]` row for it.
- No baseline row, `@noRailsEquivalent` tag, or `SKIP_GROUPS` entry is added to make a row disappear.
