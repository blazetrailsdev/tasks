---
title: "Unexport ruby-compat names only other packages' tests import"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9329
claim: "2026-10-26T14:48:26Z"
assignee: "create-with-value-and-finder-conditions-native-empty"
blocked-by: null
closed-reason: null
---

## Context

The export triage behind trails#9305 listed `initializeIncludedModules`, `chdir`, `rbRegEqual` and `succ` as internal-only, but tests in other packages import them from `@blazetrails/ruby-compat`:

- `trailties/src/thor/shell.trails.test.ts` (`initializeIncludedModules`)
- `trailties/src/commands/dev.test.ts` (`chdir`)
- `activesupport/src/message-pack/serializer.test.ts:240` (`rbRegEqual`)
- `activesupport/src/core-ext/range-ext.test.ts:340` (`succ`)

For that reason they stayed exported.

## Acceptance criteria

- Each of those tests asserts through the ported public API instead: `Regexp#==` via `rbEqual`, a string Range for `succ`, the Thor `Shell` construction path, and `Dir.chdir`. Then each name is dropped from `packages/ruby-compat/src/index.ts`.
- `pnpm parity:api:extra:gate` stays green.
