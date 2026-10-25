---
title: "Delete the dead ruby-compat exports and unexport the internal-only ones"
status: ready
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The triage in `triage-ruby-compat-exports-with-no-external-importer`
(table in `docs/ruby-compat-export-triage.md` in trails) found these exported
functions with no non-test importer outside `packages/ruby-compat`.

Dead (no reference beyond the declaration):

- `monEnter`, `monExit` (`monitor.ts`)
- `pbkdf2Async` (`crypto-adapter.ts`)

Internal-only (used by other ruby-compat files or in their own file only):

- `rbGetAllocFunc`, `methodOwner`, `rbModGe`, `initializeIncludedModules` (`include.ts`)
- `rbPathToClass` (`variable.ts`), `rbStructInitialize`, `rstructGet` (`struct.ts`)
- `temporalTag` (`temporal-tag.ts`), `cmpint` (`comparable.ts`)
- `chdir` (`process-adapter.ts`), `rbRegEqual` (`regexp.ts`)
- `rbStrByteslice` (`string/byte-methods.ts`), `succ` (`string/succ.ts`)
- `findAll` (`enumerable.ts`), `reject` (`hash.ts`)
- `excDetailedMessage`, `rbDecorateMessage` (`exc-detailed-message.ts`)
- `globalIoExecutor` (`thread-pool-executor.ts`)

## Acceptance criteria

- [ ] The dead exports are deleted, with any test covering only them.
- [ ] Each internal-only export is dropped from `index.ts` (and from its own
      file's `export` where no sibling file imports it); ruby-compat tests
      import it by relative path.
- [ ] Each export removed loses its row in `packages/ruby-compat/README.md`.
- [ ] `pnpm parity:api:extra:gate` is green; tighten the ruby-compat mark if it fell.
