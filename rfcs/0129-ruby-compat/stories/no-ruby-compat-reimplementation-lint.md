---
title: "A lint that fails a re-implementation of a ruby-compat primitive outside the package"
status: draft
updated: 2026-08-29
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The gate the maintainer asked for: **validate we are using ruby-compat
everywhere it is expected.** Without it, the package relocates today's duplicates
and the tree grows fresh ones — which is exactly the history that produced them.
The motivating case is `escapeRegExp`: `activesupport/src/core-ext/regexp.ts:18`
has been the canonical `regexpEscape` for a long time, and three byte-identical
private copies exist anyway
(`activerecord/src/support/quote-regex.ts:27`,
`activerecord/src/support/run-token.ts:23`,
`trailties/src/generators/trails-actions.ts:191`).

House precedent for "ban a construct outside its sanctioned home":
`eslint/no-native-date.mjs`, `eslint/no-node-builtins.mjs`, with the
scope-module + only-shrink exclude-JSON pattern of
`eslint/no-raw-sql.mjs` / `no-raw-sql-scope.mjs` /
`no-standalone-associations-exclude.json`.

**What it flags.** A function, method or class **declared outside
`packages/ruby-compat/`** whose name is a ruby-compat export name, or a
registered known-alias of one. The alias register is seeded from today's tree and
grows by one row whenever a convergence uncovers another spelling:

| Alias found in tree                                         | ruby-compat export   |
| ----------------------------------------------------------- | -------------------- |
| `escapeRegExp` (×3)                                         | `regexpEscape`       |
| `isSymbol` (×5)                                             | the Symbol predicate |
| `cmp` / `compare` / `spaceship` (×3)                        | `Comparable`'s `<=>` |
| a local `fetch(hash, key, default)` over a `Record` (×4)    | `Hash#fetch`         |
| a second `KeyError` class (`actionpack/.../cookies.ts:509`) | `KeyError`           |

**What it cannot do, stated plainly in the rule's header comment:** it will not
catch a copy under a name nobody has seen. The complete answer is structural
detection, which is filed separately as **report-only**
(`structural-duplicate-detector-report`) precisely because its false-positive
rate is unknown until it runs against the real tree. Shipping the name-based rule
first and gated beats shipping the structural one late and ungated.

Beware the false positives the name rule WILL have: Rails-anchored methods
legitimately named `fetch` (`ActiveSupport::Cache::Store#fetch`), `dig`
(`Session#dig`, `Parameters#dig`) or `compare`. Those are Rails ports and must
not be flagged — which is why the register is per-alias-with-context, not a bare
name list.

## Acceptance criteria

- `eslint/no-ruby-compat-reimplementation.mjs` plus its scope module and
  `no-ruby-compat-reimplementation-exclude.json`, wired into
  `eslint.config.mjs`.
- The exclude JSON is seeded with exactly today's copies, one row each, and is
  **only-shrink** — a row is deleted by the move story that converges it, and a
  new row is never added to cover new code.
- Rails-anchored same-named methods (`Cache::Store#fetch`, `Session#dig`,
  `Parameters#dig`) are not flagged; a test case pins each.
- The rule's header comment states plainly what it cannot catch, and points at
  the structural-detector story.
- `no-ruby-compat-reimplementation.test.mjs` covering: a flagged copy, an
  allowlisted row, a Rails-anchored homonym, and a declaration inside
  `packages/ruby-compat/` (never flagged).
- `pnpm lint` green on the tree as it stands, with every current duplicate
  either converged or holding a seeded row.
