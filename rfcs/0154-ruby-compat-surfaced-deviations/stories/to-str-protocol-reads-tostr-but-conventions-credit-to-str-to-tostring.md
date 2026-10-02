---
title: "ruby-compat: the to_str protocol reads toStr while the naming table credits to_str to toString"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8413. `rb_str_equal` (`vendor/ruby/v3.3.11/string.c:3742-3752`) asks a non-String operand that answers `to_str` to compare in turn. `equalOrEql` (`packages/ruby-compat/src/rb-equal.ts`) ports that as `rbObjRespondTo(b, "toStr")`.

`docs/ruby-ts-conventions.md` maps both `to_s` and `to_str` onto `toString`, and `parity:api` credits a class's `to_str` to its `toString`. So a class ported by the convention never defines `toStr`, and the arm never fires for it. `ActiveModel::Type::Binary::Data` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/binary.rb:51`, `alias_method :to_str, :to_s`) had to add a `toStr` with a `@noRailsEquivalent PERMANENT` receipt (`packages/activemodel/src/type/binary.ts`) for `"x" == data` to work. `rb_check_string_type` in `kernel-integer.ts` and `output-safety.ts` read `toStr` the same way.

The two cannot both be right: either `to_str` has its own TS spelling that `parity:api` credits, or the protocol reads the spelling the convention produces.

## Acceptance criteria

- [ ] One spelling for Ruby's `to_str`, used by both `scripts/parity/conventions.ts` and ruby-compat's `to_str` readers.
- [ ] `Data#toStr` no longer needs a receipt: it is either credited to `binary.rb:51` or deleted because the protocol reads `toString`.
- [ ] `pnpm parity:api:extra:gate` green.
