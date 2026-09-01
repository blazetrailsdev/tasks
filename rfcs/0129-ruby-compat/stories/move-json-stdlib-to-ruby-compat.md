---
title: "Ruby's stdlib JSON (not ActiveSupport::JSON) moves to ruby-compat"
status: claimed
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 90
priority: 50
pr: null
claim: "2026-09-01T18:53:13Z"
assignee: "move-string-io-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/json-stdlib.ts` (**29 lines**, `export namespace
JSON` with `dump` and `load`) is Ruby's **stdlib `json`**, not
`ActiveSupport::JSON`. Its own header draws the distinction:

> This is stdlib, not Rails — `ActiveSupport::JSON` (`json.ts` in this package)
> is a different module with `encode`/`decode`, and its `dump` carries
> ActiveSupport's HTML-escaping encoder rather than the json gem's plain
> `generate`.

It exists because Rails hands the bare constant to a `serializer:` kwarg
(`vendor/rails/activerecord/lib/active_record/signed_id.rb:79`), so the port
needs the name `JSON` to be spellable at that call site — which
`activerecord/src/signed-id.ts:44` does today
(`import { JSON } from "@blazetrails/activesupport"; … serializer: JSON`).

Four-part test (README §1, §2, §4), item by item:

1. **No `vendor/rails/` counterpart.**
   `parity:api:extra --package activesupport` scores `json-stdlib.ts` as
   `0 novel, 3 moved [no Rails counterpart]` — no Rails file maps onto it.
   `ActiveSupport::JSON` is a _different_ module and stays in activesupport
   with its own anchor; this story must not touch `json.ts`.
2. **MRI counterpart.** `vendor/ruby/ext/json/lib/json/common.rb:615`
   (`def dump`) and `:541` (`def load`). `json` is an ext bundled inside
   `ruby/ruby`, so the citation resolves at the pinned `v3_3_11` — same
   situation as `stringio`, and unlike `rexml`, which is a bundled gem absent
   from the vendored tree.
3. **trails actually calls it.** Small but real: one consumer,
   `activerecord/src/signed-id.ts:3,44`, reached through the barrel re-export
   at `activesupport/src/index.ts:573`. Two exports, one call site — so check
   `load` has a reachable caller before moving it; if it does not, README §1
   says delete it rather than relocate it.
4. **No workspace dependency dragged.** `json-stdlib.ts` has **zero `import`
   statements** (it captures `globalThis.JSON` in a module-local const at `:1`,
   precisely so the exported namespace can shadow the global name). It is
   already a leaf.

Sizing: this is the smallest candidate in the audit. If the scheduler prefers,
it can ride along with `move-string-io-to-ruby-compat` — both are Ruby stdlib
bundled inside `ruby/ruby`, both are zero-import leaves, and together they are
well under the ceiling. Filed separately because README's migration shape is
"one primitive per PR".

## Acceptance criteria

- The stdlib `JSON` namespace lives at `packages/ruby-compat/src/json.ts`,
  exported from the package index, with resolving
  `vendor/ruby/ext/json/lib/json/common.rb:615` / `:541` citations and a
  `@noRailsEquivalent PERMANENT` receipt.
- `activesupport/src/json-stdlib.ts` becomes a bare re-export shim; the
  `@blazetrails/activesupport` public surface is unchanged, `index.ts:573`
  keeps exporting `JSON`, and `activerecord/src/signed-id.ts` is untouched.
- `ActiveSupport::JSON` (`activesupport/src/json.ts`) is **not** touched — it is
  Rails-anchored surface and moving it would destroy working `parity:api`
  coverage.
- Any export with no reachable call site (check `load`) is deleted rather than
  moved, with the count stated in the PR body.
- `packages/ruby-compat` still has no `dependencies` block.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  this diff, sized to the exports actually added — never a reseed.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows.
