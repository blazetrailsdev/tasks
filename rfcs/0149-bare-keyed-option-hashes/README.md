---
rfc: "0149-bare-keyed-option-hashes"
title: "Bare-keyed option hashes: symbolize_keys only where Symbol-ness is observable"
status: closed
created: 2026-09-15
updated: 2026-09-23
owner: "@deanmarano"
packages:
  - activerecord
  - actionpack
  - actionview
clusters:
  - symbolize-keys-policy
  - option-hash-key-names
---

# RFC 0149 — Bare-keyed option hashes

## Summary

Rails calls `symbolize_keys` to collapse Ruby's two key types (`"adapter"` and
`:adapter`) into one before a hash is read. A JS object has one key type, so a
bare-keyed hash is already normalized. After trails#7750, `symbolizeKeys`
yields `":name"` keys (CLAUDE.md, "A Ruby Symbol is a JS string"). Porting a
`symbolize_keys` call that way re-keys a hash only for readers to index
`[":adapter"]` instead of `.adapter`, and nothing in those bodies turns on
Symbol vs String. This RFC decides that **option hashes stay bare-keyed, and a
port calls `symbolizeKeys` only where Symbol-ness is observable**: where the
hash is rendered through `inspect` / `rbInspect`, where control flow turns on
`Symbol === key`, or where it is merged with a hash that already carries
`":name"` keys. It makes the call gate treat `symbolize_keys` as optional. Keys
keep trails' camelCase spelling of the Rails name (`checkoutTimeout`,
`onlyPath`), per `docs/ruby-ts-conventions.md`.

## Motivation

- RFC 0130's `symbolize-keys-bare-key-callers-converge` asked to restore two
  `symbolize_keys` calls trails#7750 dropped:
  `database_configurations.rb:257` and `routing_url_for.rb:89`. Doing that
  faithfully means Symbol-keying the whole db-config surface (`HashConfig`,
  every adapter's `@config`, pool, tasks, about 170 reads and every config
  literal) and the whole url_for chain. That is roughly 7 PRs and a public config
  break (`configurationHash[":adapter"]`), and it buys no behavior: no reader
  distinguishes Symbol from String keys.
- Rails calls `symbolize_keys` at 58 sites in `vendor/rails/*/lib`. Almost all are
  that same boundary normalization (`abstract_adapter.rb:132,144,147`,
  `hash_config.rb:40`, `cookies.rb`, `asset_tag_helper.rb` ×8,
  `routing/url_for.rb:185,188`).
- trails calls `symbolizeKeys` at 5 non-definition sites
  (`actionview/src/template/error.ts:105`, `activerecord/src/migration.ts:1208`,
  `connection-adapters/abstract/schema-statements.ts:1672,1745`,
  `connection-adapters/postgresql/schema-statements.ts:899,1023`). Every one
  feeds `rbInspect` for an error or log message, which is the observable case.
  Most have no `symbolize_keys` in the Rails body, because a Ruby kwargs hash is
  already Symbol-keyed. The call stands in for the key type, not for a Rails call.
- The dropped calls are not flagged by `parity:api:calls`, and a
  `@missingRailsCall` receipt at those sites reported STALE (per the 0130 story).
  So the gate already treats the omission inconsistently, and it does so
  implicitly.
- One url_for key is spelled two ways. actionpack's `UrlOptions` reads the
  camelCase `onlyPath` (`http/url.ts:11-26`), while ActionView writes the Ruby
  spelling `only_path` (`actionview/src/routing-url-for.ts:19,36,81-93`).

## Design

**Rule.** A hash Rails normalizes with `symbolize_keys` is a bare-keyed JS object
in trails, keyed by the camelCase translation of the Rails Symbol's name
(`checkoutTimeout` for `:checkout_timeout`, per `docs/ruby-ts-conventions.md`).
The port omits the `symbolize_keys` call and reads `hash.checkoutTimeout` /
`hash.onlyPath`. `symbolizeKeys` is called only
when Symbol-ness is observable:

1. the hash is rendered by `inspect` / `rbInspect` (key spelling is in the output);
2. control flow turns on `Symbol === key` (CLAUDE.md's `localize` / `:default` case);
3. the hash is merged with, or compared to, a hash already carrying `":name"` keys.

**Gate.** `symbolize_keys` and `symbolize_keys!` join `NO_JS_CALL_FORM`
(`scripts/api-compare/compare.ts:265`), which already suppresses a Ruby call
from both `parity:api:calls` and `:calls:args` (`call-args.ts:409`). Their
rationale entry states the rule above. An omission is then correct by default,
and a present call is still allowed. The cost the file's own comment warns
about, a dropped call becoming invisible, is acceptable here because every
observable case is an `inspect` whose output an error-message test pins.

**No `@missingRailsCall` receipts** at the omitting sites: the gate entry is the
receipt, and the two 0130 sites need no change.

### Stories

1. `symbolize-keys-optional-in-call-gate` (cluster `symbolize-keys-policy`): the
   gate entry, the rationale, and the CLAUDE.md "Ruby idioms" bullet stating the
   rule.
2. `symbolize-keys-inspect-callers-audit` (cluster `symbolize-keys-policy`): check
   the 5 trails `symbolizeKeys` call sites against their Rails bodies and error
   messages. Keep each only under rules 1-3, and pin its message in a test.
3. `routing-url-for-option-keys-camel-case` (cluster `option-hash-key-names`):
   ActionView's `RoutingUrlFor` writes and reads `onlyPath`, matching actionpack.
4. `route-set-url-for-path-for-port` (cluster `option-hash-key-names`): port
   `RouteSet#url_for` / `path_for` / `RESERVED_OPTIONS` at Rails' signatures,
   reading camelCase option keys, and converge `UrlFor#full_url_for`'s
   `reverse_merge!(url_options)` without the `symbolize_keys`.

## Non-goals

- **Symbol-keying `configuration_hash` / url_for options**: rejected (see
  Alternatives). No reader distinguishes key types.
- **Removing `HashWithIndifferentAccess#symbolize_keys` / `Hash#symbolize_keys`
  themselves**: they are Rails API (`core_ext/hash/keys.rb:27-29`) and stay
  ported. This RFC governs _callers_.
- **`stringify_keys` / `deep_symbolize_keys`**: out of scope. They are rarer, and
  can be filed under the same rule if an audit finds the same pattern.
- **Renaming option keys to Ruby snake_case** (`checkout_timeout`): trails
  spells Ruby names in camelCase repo-wide (`docs/ruby-ts-conventions.md`),
  option keys included.

## Alternatives considered

- **Symbol-key both hashes and restore every call.** This was the first draft
  of this RFC (7 stories). Rejected: about 1,500 LOC and a public API break for
  zero behavioral difference. The `":"` spelling exists to carry a Symbol/String
  distinction, and these hashes have none.
- **Per-site `@missingRailsCall ... PERMANENT` receipts.** Rejected: the same
  justification at every boundary-normalization site is a policy, and a policy
  belongs in the gate table. Per the 0130 story, a receipt at these sites also
  reported STALE.
- **Make `symbolizeKeys` yield bare keys again.** Rejected: that re-opens
  trails#7750 and breaks the inspect callers, which need `":name"` keys to render
  `{column: ...}`.

## Rollout

1. Policy: `symbolize-keys-optional-in-call-gate`, then
   `symbolize-keys-inspect-callers-audit`.
2. Key names, in parallel with phase 1: `routing-url-for-option-keys-camel-case`
   and `route-set-url-for-path-for-port` (independent of each other).
3. RFC 0130's `symbolize-keys-bare-key-callers-converge` closes as superseded by
   this RFC's decision when this PR merges.

## Verification

- `NO_JS_CALL_FORM` contains `symbolize_keys` and `symbolize_keys!`.
  `parity:api:calls` / `:calls:args` report 0 `symbolize_keys` rows.
- `grep -rn "symbolizeKeys(" packages/*/src --include=*.ts` outside
  `hash-utils.ts` / `hash-with-indifferent-access.ts` finds only sites that the
  audit story records under rules 1-3.
- `grep -rn '"only_path"\|only_path:' packages/actionview/src packages/actionpack/src --include=*.ts`
  finds 0 hash keys.
- `parity:api` credits `RouteSet#url_for` and `#path_for` at Rails arity.

## Open questions

1. **Symbol or bare keys for option hashes?** Resolved: bare keys (user decision,
   2026-09-15). See Summary.
2. **Does the gate entry hide a real drop?** Resolved: only an `inspect`-observable
   site can differ, and the audit story pins each one with a message test.

## Changelog

- 2026-09-15: initial RFC, split out of RFC 0130's
  `symbolize-keys-bare-key-callers-converge`. The first draft Symbol-keyed both
  hashes; it was revised to bare keys before merge. A snake_case key-rename
  story was also dropped, because trails spells option keys in camelCase.
