---
title: "Capture Hash keys a constant gains through CONST.update(...)"
status: done
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 3
pr: 7351
claim: "2026-09-01T17:59:08Z"
assignee: "test-compare-gate-stack-does-not-follow-a-helper-call"
blocked-by: null
closed-reason: null
---

## Context

`credit-ruby-hash-and-option-keys-as-ruby-surface` (RFC 0126, PR #7193) added
`file_hash_keys` to `scripts/api-compare/extract-ruby-api.rb`: a per-file pool of
Ruby Hash KEY names that `extra-surface.ts`'s `collectAllowedNames` unions into
the matched file's allowed set.

`literal_hash_keys` is reached only from `maybe_record_constant`, i.e. only for
the RHS of a `CONST = {...}` assignment. Keys a constant gains AFTER its
assignment, through `CONST.update(k => v)`, are not captured.

The live instance is `ActiveSupport::XmlMini::PARSING`
(`vendor/rails/activesupport/lib/active_support/xml_mini.rb:90-93`):

```ruby
PARSING.update(
  "double"   => PARSING["float"],
  "dateTime" => PARSING["datetime"]
)
```

Measured on the merge commit: `file_hash_keys["xml_mini.rb"]` contains
`dateTime` (it is independently a `FORMATTING` key at `xml_mini.rb:58`) but NOT
`double`. `packages/activesupport/src/xml-mini.ts:246-247` ports both aliases
faithfully (`double: PARSING["float"]`, `dateTime: PARSING["datetime"]`), so a
TS `double` is a faithful port of a real Ruby key that the pool cannot see.

The gap is latent rather than active today — neither name is currently scored as
extra — but it is a hole in the mechanism, and the next Hash constant that gains
its keys through `update`/`merge!` will surface a faithful port as novel.

## Converged shape

Record the literal keys of a Hash argument to `CONST.update(...)` /
`CONST.merge!(...)` where `CONST` is a constant already recorded in
`@file_collection_constants` for the current file, through the same
`literal_hash_keys` helper. Keep it lexical: a non-literal key, or an `update`
on something that is not a known Hash constant of this file, records nothing —
matching the existing "anything not lexically resolvable stays novel" contract.

Do NOT widen this to every `x.update(...)` call site; the receiver must resolve
to a Hash constant declared in the same file.

## Acceptance criteria

- `file_hash_keys["xml_mini.rb"]` contains `double`.
- A `CONST.update(...)` where `CONST` is not a recorded Hash constant of that
  file records nothing — unit test.
- A computed key inside an `update` hash is skipped while its literal siblings
  are recorded — unit test.
- No package's `pnpm parity:api:extra` novel count rises.
