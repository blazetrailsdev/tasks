---
title: "Flag a Rails body that dispatches through a dynamic setter where the port writes the attribute directly"
status: draft
updated: 2026-09-20
rfc: "0000-parity-beyond-name-presence"
cluster: "call-gate"
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`update-attribute-uses-public-send-setter` (0155): Rails' `update_attribute` is `public_send("#{name}=", value)` (`vendor/rails/activerecord/lib/active_record/persistence.rb:533`, bang form `:555`). trails' calls `this.writeAttribute(name, value)` (`packages/activerecord/src/persistence.ts:562`, `:573`). The setter is bypassed, so a non-column `attr_accessor`, or any overridden writer, raises `MissingAttributeError` or is silently skipped.

`call-skeletons.json` records both sides (`ruby: [..., "ref:public_send", ...]`, `ts: [..., "ref:writeAttribute", ...]`) and `call-mismatches.json` has no row, because `public_send` maps to no TS candidate and `significantMissingCalls` (`scripts/api-compare/compare.ts:609`) suppresses such a call.

**The fix is NOT to make `public_send` a scored call name.** `send` and `public_send` differ only in visibility, which JS does not have at run time (CLAUDE.md § "Method visibility is not a runtime fact in JS"). Both port to a computed member access, and the faithful port of `public_send("#{name}=", value)` is `this[name] = value`: a property assignment with no callee at all. A call-name comparison would flag the correct port as well as the wrong one.

The signal that does exist is narrow: the Ruby body dispatches to a dynamically named SETTER (`send` / `public_send` whose first argument is a string ending in `=`), and the TS body contains no computed-member assignment but does call `writeAttribute` / `_writeAttribute`. Real Rails sites in activerecord and activemodel (comments excluded): `persistence.rb:514,533,555`, `attribute_assignment.rb:50`, `secure_token.rb:56`, `delegated_type.rb:255`, `associations/has_many_through_association.rb:64,107`, `encryption/contexts.rb:37`, `connection_adapters/sqlite3_adapter.rb:840`. About ten, so this is a small keyed check in the manner of RFC 0113's missing-`throw` stratum.

## Acceptance criteria

- The Ruby extractor marks a body that calls `send` / `public_send` / `__send__` with a first argument that is a string or dstring ending in `=`.
- The TS extractor marks a body that contains a computed-member assignment (`x[expr] = ...`).
- A matched pair with the Ruby mark, without the TS mark, and with a `writeAttribute` / `_writeAttribute` call is listed. `updateAttribute` and `updateAttributeBang` appear.
- Every row of the first run is hand-audited in the PR body. The population is about ten, so this is the whole population, not a sample.
- `send` and `public_send` stay out of the call-name comparison, and a comment at `NO_JS_CALL_FORM` or the SKIP group says why, citing the CLAUDE.md section.
