---
title: "tsMirrorName takes one string, so an accessor pair or a keyed-table port cannot be credited"
status: draft
updated: 2026-08-18
rfc: "0110-parity-skip-register-correctness"
cluster: null
packages: ["activesupport", "activerecord"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ScopedSkipGroup.tsMirrorName` (`scripts/parity/conventions.ts:539`) exists to
credit a faithful port spelled differently from what `rubyMethodToTs` produces:

> The TS spelling that IS the faithful port of these names inside `rubyFiles`,
> when there is one but it isn't the spelling {@link rubyMethodToTs} produces.
> … extra-surface then treats a declaration of this name in those files as
> allowed rather than novel.

It is typed as a single `string`, and `scopedSkipMirrorName` returns one name.
Two live entries have a port it therefore cannot express, so both fall back to
a bare skip that hides the port instead of crediting it:

1. **`attr_internal_naming_format`** (`core_ext/module/attr_internal.rb`). Ruby
   declares a `class << self` `attr_reader` plus an
   `attr_internal_naming_format=` writer (`attr_internal.rb:22-35`). trails
   ports it as `getAttrInternalNamingFormat` / `setAttrInternalNamingFormat`
   (`packages/activesupport/src/module-ext.ts:262,266`), both exported from
   `packages/activesupport/src/index.ts:345`. The skip's own reason says so:
   "the naming format is reachable as
   `getAttrInternalNamingFormat`/`setAttrInternalNamingFormat`."
2. **The four `supports_*?` predicates** (`adapter_helper.rb`). Ported as
   entries in the feature-keyed table in
   `packages/activerecord/src/support/supports.ts` (`:153`, `:184`). That
   entry's reason states "the table keys are the `supports_<key>?` names, so
   the pairing is checkable" — and then skips instead of pairing.

Both are ported surface counted as absent.

## Acceptance criteria

1. `tsMirrorName` accepts more than one spelling. Per the RFC's open question
   the recommendation is `string | string[]`; if the implementation picks a
   different shape, the RFC's open question is updated to record the decision.
2. `scopedSkipMirrorName` and every consumer (the method comparison and
   extra-surface) handle the multi-name form; existing single-string entries
   such as `messages/rotator.rb` keep working unchanged.
3. The `attr_internal_naming_format` entry carries the get/set pair via
   `tsMirrorName` rather than skipping, and `adapter_helper.rb` credits the
   four table keys the same way.
4. `scripts/parity/conventions.test.ts` covers the multi-name path, including
   an entry whose names partially match.
5. The PR states the `parity:api` delta; five members should move from absent
   to matched.
