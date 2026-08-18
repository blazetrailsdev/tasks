---
title: "Converge rubyInspect's non-plain-object fallback and hash-key rendering on Ruby"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into retire-remaining-ruby-inspect-copies-onto-the-activesupport-port — this is one of the private partial Object#inspect copies that story retires onto core-ext/object/inspect.ts; retiring the copy IS the fix"
---

## Context

`rubyInspect` (`packages/activerecord/src/relation/ruby-inspect.ts:23`) is now
used by `Migration#formatArguments` (`packages/activerecord/src/migration.ts`,
PR #5772) in addition to `Relation#_renderExplainBinds`, so two shortcuts in it
are user-visible in migration announce labels:

- Non-plain objects fall through to `String(value)` (ruby-inspect.ts:52-53).
  Ruby's `Object#inspect` gives `#<Widget ...>`; a plain JS class instance
  renders `[object Object]`.
- `rubyInspectHash` (ruby-inspect.ts:62) always emits `key: value`, matching
  Ruby's _symbol_-key Hash form. Ruby renders string keys as `"key" => value`.
  trails has no symbol/string key distinction, so every hash takes the symbol
  form — correct for options hashes, wrong for genuine string-keyed data.

Both predate #5772 and were left alone there to keep that PR scoped to
`format_arguments` itself.

## Acceptance criteria

- [ ] Decide and implement the non-plain-object fallback: either `#<Ctor>`
      (constructor-name based) or a documented deliberate deviation at the
      call site.
- [ ] Document (or converge) the hash-key rendering choice against Ruby's
      `Hash#inspect`.
- [ ] Existing `rubyInspect` consumers (`Relation#inspect`, explain binds,
      `formatArguments`) keep their current output where it is already
      Rails-faithful.
