---
title: "delete-second-round-ruby-compat-reexport-shims"
status: claimed
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-03T00:39:30Z"
assignee: "consolidate-kernel-integer-and-float-conversions"
blocked-by: null
closed-reason: null
---

## Context

`delete-ruby-compat-reexport-shims` (RFC 0129) is `done`, closed by #7300, and
its `story_paths` name only the five files it actually touched
(`key-error.ts`, `regexp.ts`, `succ.ts`, `range-ext.ts`, `tempfile.ts`). Every
RFC 0129 move that landed _after_ it left a fresh `activesupport` re-export
shim behind with no scheduled deletion, because each one's acceptance criteria
pointed at that already-closed story. This is the second-round sweep it cannot
do.

The orphaned shims, all in `packages/activesupport/src/`:

- `rb-equal.ts` — `export { rbEqual } from "@blazetrails/ruby-compat";`
- `string-io.ts` — `export { StringIO } ...` (#7354)
- `json-stdlib.ts` — `export { JSON } ...` (#7354)
- `string-utils.ts:10` — `export { chomp } ...` (#7354; a re-export line inside
  a live file, not a whole-file shim — delete the line, not the file)
- `ruby-empty.ts` — `export { isEmpty } ...` (#7360)
- `rb-hash.ts` — `export { rbHash } ...` (#7360)

Each is load-bearing today: `activesupport/src/index.ts:711` re-exports
`rbHash` through `rb-hash.ts`, and `activerecord` imports `isEmpty` from the
`@blazetrails/activesupport/ruby-empty` subpath in six files
(`attribute-methods.ts:2`, `insert-all.ts:11`, `relation.ts:4`,
`relation/batches.ts:3`, `relation/calculations.ts:5`,
`connection-adapters/postgresql/database-statements.ts:8`). The subpath
resolves through activesupport's `"./*"` exports wildcard, so deleting the file
breaks those imports until they are repointed.

## Acceptance criteria

- Every call site imports its symbol from `@blazetrails/ruby-compat` directly —
  including the six `@blazetrails/activesupport/ruby-empty` subpath imports in
  `activerecord`, and the `rbHash` re-export at
  `activesupport/src/index.ts:711`.
- The six shims above are deleted (`string-utils.ts` loses only its `chomp`
  re-export line).
- The `vitest.config.ts` alias for `@blazetrails/activesupport/ruby-empty` and
  the matching `paths` entries in `packages/activerecord/dx-tests/tsconfig.json`
  and `packages/activerecord/virtualized-dx-tests/tsconfig.json` go with them.
- `pnpm typecheck`, `pnpm lint` and `pnpm build` are green; `parity:api`,
  `parity:api:extra:gate` and both call gates show no new rows.
