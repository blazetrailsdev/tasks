---
title: "Call-args gate: admit strip and force_encoding as receiver-first, retire Thor's two @missingRailsArgs receipts"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8514 added two `@missingRailsArgs … — PERMANENT` receipts that exist only because the
call-argument gate could not align a receiver-first ruby-compat function with its Ruby call:

- `packages/trailties/src/thor/actions/empty-directory.ts`, `convertEncodedInstructions`:
  `strip($1)` for `$1.strip` (`vendor/thor/v1.3.2/lib/thor/actions/empty_directory.rb:105`). The row was
  `strip` rubyArgs `[]` vs tsArgs `["ref:1"]`.
- `packages/trailties/src/thor/actions/create-file.ts`, `isIdentical`:
  `forceEncoding(rbStrSNew(render), "ASCII-8BIT")` for
  `String.new(render).force_encoding("ASCII-8BIT")`
  (`vendor/thor/v1.3.2/lib/thor/actions/create_file.rb:45`). The row was `force_encoding` rubyArgs
  `["str:ASCII-8BIT"]` vs tsArgs `["ref:jsStrSNew", "str:ASCII-8BIT"]`.

`alignBuiltinReceiver` (`scripts/api-compare/call-args.ts`) strips a leading receiver only when
`receiverIsFirstArg` admits the name, through `RECEIVER_AS_FIRST_ARG`
(`scripts/api-compare/receiver-as-first-arg.ts`) or `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`
(`scripts/parity/ruby-compat.ts`). Neither admits `strip` or `force_encoding`.
`Shell::Basic#sayStatus` carries the same receipt for `chomp`, and `thor/util.ts` /
`shell/table-printer.ts` for `join`.

## Acceptance criteria

- [ ] `String#strip` → `strip` and `String#force_encoding` → `forceEncoding` are admitted as
      receiver-first (check `String#chomp` and `Array#join` in the same pass).
- [ ] The two receipts from trails#8514 are deleted and `pnpm parity:api:calls:args` stays green
      with no baseline row added.
- [ ] No other package's call-argument count rises.
