---
title: "Hash#fetch (both arms) and KeyError land in ruby-compat, replacing four private fetch copies and eight ad-hoc KeyErrors"
status: draft
updated: 2026-08-29
rfc: "0000-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activerecord", "activemodel", "actionpack"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Hash#fetch` is CLAUDE.md's named idiom trap — _"`h.fetch(:k, default)` returns
the STORED value whenever the key exists — including a stored `nil` or `false`.
`h.k ?? default` substitutes the default for `null`/`undefined`. They differ, and
Rails relation readers depend on the difference."_ — and it is the single largest
population in the whole inventory: **25 `@missingRailsCall fetch — PERMANENT`
receipts**, whose text is uniformly some spelling of "Ruby Hash#fetch has no JS
call analogue" (`activesupport/src/json/encoding.ts:33-36`,
`number-helper/number-to-delimited-converter.ts:25`,
`number-helper/rounding-helper.ts:34`, and 22 more).

Four private copies exist, three of them byte-identical:

| Site                                                                 | Body                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activerecord/src/connection-adapters/postgresql-adapter.ts:157`     | `key in hash ? (hash[key] as T) : defaultValue`                                                                                                                   |
| `activerecord/src/connection-adapters/abstract-mysql-adapter.ts:127` | identical                                                                                                                                                         |
| `activesupport/src/core-ext/string/conversions.ts:27`                | identical, with the best JSDoc of the four (`:20-26`) — it names the exact case, `:offset` set from a `nil` return for an unknown zone (`date_parse.c:2290-2294`) |
| `activesupport/src/core-ext/date-and-time/calculations.ts:201`       | the **raising** arm — `if (value === undefined) throw new KeyError(...)`                                                                                          |

Both arms are needed: the two-argument default form and the one-argument raising
form. Ruby's block form (`h.fetch(k) { ... }`) is a third — see
`actionpack/src/action-controller/test-case.ts:817`, which yields the missing key
— so include it only if a call site needs it, per the standing rule.

`KeyError` is the raise, and it is duplicated too. Canonical:
`activesupport/src/core-ext/key-error.ts:12`, whose JSDoc already says it is
"Ruby core, not Rails, so there is no Ruby file to mirror". A **second class
declaration** at `actionpack/src/action-dispatch/middleware/cookies.ts:509`, and
**six** sites that build a plain `Error` and then assign the name:
`actionpack/src/action-controller/test-case.ts:822`,
`actionpack/.../strong-parameters.ts:505`,
`actionpack/.../http/mime-type.ts:475`,
`activemodel/src/attribute-set/builder.ts:157`,
`activemodel/src/attribute-set.ts:31`,
`activerecord/src/token-for.ts:107`,
`rack/src/request.ts:673`.

(`grep -rn 'name = "KeyError"' packages/*/src` returns 9; two of those are the
real class bodies — the canonical `key-error.ts:15` and the duplicate
`cookies.ts:512` — leaving seven ad-hoc assignments.)

RFC 0111's draft `one-shared-nomethoderror-class` is the same consolidation for
a sibling Ruby core error class; follow its shape rather than inventing a second
one, and if it has landed by the time this story runs, reuse whatever home it
chose for `NameError` / `NoMethodError`.

The message format matters and is already settled by
`key-error.ts:7-10`: a Symbol key keeps its colon (`key not found: :expression`
— see `activerecord/.../abstract/schema-statements.ts:1812`), a String key is
quoted (`key not found: "k"` — `actionpack/.../request/session.ts:375`).

**The prize.** `compare.ts:200-248` explains that `key?` / `has_key?` sit in
`NO_JS_CALL_FORM` because "Rails' options/params hashes port to object literals,
whose membership tests are the `in` operator… so keeping them would baseline
every options-hash port forever **with no way to ever discharge it**." A callable
`fetch` / `hasKey` is that discharge. Retiring the entries is a separate story
(`retire-no-js-call-form-entries`) so this one stays a move.

## Acceptance criteria

- `fetch` (both arms — default-returning and `KeyError`-raising) and `hasKey` /
  `key?` live under `packages/ruby-compat/src/hash.ts`, with
  `vendor/ruby/hash.c:LINE` citations (`rb_hash_fetch`, `rb_hash_has_key`).
- The stored-`nil`/`false` semantics are the point and are covered by tests
  asserting a stored `null` and a stored `false` are RETURNED, not defaulted.
- `KeyError` moves to ruby-compat; `activesupport/src/core-ext/key-error.ts`
  becomes a re-export shim so `@blazetrails/activesupport`'s export
  (`index.ts:2`) is unchanged.
- The duplicate class at `cookies.ts:509` is deleted and all seven ad-hoc
  `err.name = "KeyError"` sites construct the real class instead.
- All four private `fetch` helpers deleted, callers importing the shared export;
  `conversions.ts:20-26`'s JSDoc explaining the `:offset` case carries across.
- Message format preserved exactly at every site (Symbol keys colon-prefixed,
  String keys quoted).
- The block form is included only if a call site needs it; if
  `test-case.ts:817` is that call site, it adopts the export.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra` show no new rows; actionpack, activemodel, activesupport
  and all three AR lanes green.
- If this exceeds the LOC ceiling, ship `fetch` + `hasKey` and file the
  `KeyError` consolidation as a follow-on story — do not fan out a sibling PR.
