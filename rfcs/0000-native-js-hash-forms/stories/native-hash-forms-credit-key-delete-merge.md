---
title: "Comparator credits key? / delete / merge! / merge from a marked native form on a matching receiver"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: gate
packages: []
deps: [native-hash-form-marks-in-ts-extractor]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`NATIVE_FORM_ANALOGUES` (`scripts/api-compare/enumerable-idioms.ts:262-284`)
maps a Ruby call to the marked TS form that is its whole port, and
`hasNativeFormAnalogue` (`scripts/api-compare/compare.ts:848-871`) drops the
Ruby call from significance for ONE body when the paired TS body has the form,
no Ruby site's receiver kind is in the row's `uncreditedKinds`, and every Ruby
receiver name matches a `<form>:<name>` mark. `size` → `length` is the model.

The hash names are bound to helpers by `scripts/parity/ruby-compat.ts`:
`Hash#key?` / `Hash#has_key?` → `hasKey` (`:51-52`, unconditional),
`Hash#delete` → `hashDelete` (`:111`), `Hash#include?` → `hasKey` (`:116`),
`Hash#merge` (`:117`), `Hash#merge!` → `mergeBang` (`:118`), `Hash#update`
(`:122`), all receiver-keyed. `scripts/api-compare/lint-ruby-compat-calls.ts`
reads the table in reverse: a flagged call resolving to an export is a row
telling the port to import it.

`compare.ts:303-307` records why `key?` left `NO_JS_CALL_FORM` (the `in`
operator was "a shape the gate cannot tell from a dropped guard"), and
`:330-331` says `delete`, `merge` and `fetch` stay in the comparison. The RFC's
§ "Answering `compare.ts:330-352`" argues the native forms differ from the
`size` / `first` population; this story implements it.

## Acceptance criteria

- [ ] `NATIVE_FORM_ANALOGUES` gains rows for `key?`, `has_key?`, `include?`,
      `member?` (form `in`), `delete` (form `delete`), `merge!` and `update`
      (form `assign`), and `merge` (form `spread`). Each is
      `receivers: "explicit"` with `uncreditedKinds` of `self`, `ivar` and
      `const`.
- [ ] `include?` and `member?` credit from `@in` only where every recorded
      receiver kind is `hash`: on an Array or a Relation they are a different
      method (`ruby-compat.ts:114-116`).
- [ ] `delete`, `merge` and `merge!` credit from a form only where no recorded
      kind disproves a Hash, the rule `rubyCompatAliases`
      (`ruby-compat.ts:226-240`) already applies to the helper.
- [ ] `fetch` gets no row. A test pins that `h.k ?? d` does not credit
      `h.fetch(:k, d)`.
- [ ] The reverse gate does not report a row for a call a native form credited.
      Where it still reports one for a hash name, its message names the native
      form alongside the export.
- [ ] Comparer tests, positive and negative, for each row:
  - `options.key?(:x)` with `"x" in options` credits; with no membership test
    flags; with `"x" in other` flags;
  - `@options.key?(:x)` (ivar) with `"x" in this.options` flags;
  - a bare `merge(other)` (no receiver) with a spread flags;
  - `relation.merge(other)` on an `ivar` / `expr` receiver with a spread flags.
- [ ] `compare.ts:303-307` and `:330-331` are rewritten to say what is now
      true: the names stay in the comparison and a marked native form satisfies
      them. `NO_JS_CALL_FORM` is unchanged (nine entries).
- [ ] No row is removed from `RUBY_COMPAT_EXPORTS` or
      `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`, and
      `scripts/parity/conventions.ts:1469` (`HAS_PREDICATE_ALIASES`) is
      untouched: it spells ported members such as `Rack::Headers#hasKey`.
- [ ] All call gates green with no baseline row added. A baseline row that
      goes STALE because a hand-written `in` is now credited is deleted by
      hand and the mark tightened with `pnpm parity:api:calls:tighten`.

## Definition of done

A `NO_JS_CALL_FORM` entry for any of these names does not close this story.

## Verification

```bash
pnpm vitest run scripts/api-compare
pnpm parity:api:calls && pnpm parity:api:calls:args
```
