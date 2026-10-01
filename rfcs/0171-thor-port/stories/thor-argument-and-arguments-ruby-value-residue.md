---
title: "Converge Thor::Argument / Arguments residue: =~ on a non-String, to_f, banner ||, predicate value, parse_ name"
status: draft
updated: 2026-10-01
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Residue from trails#8347 (`packages/trailties/src/thor/parser/argument.ts`,
`arguments.ts`). Each is a place the port answers differently from the Ruby
for an input no ported spec covers.

- `parse_numeric`: `peek =~ NUMERIC` (`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:142`)
  on a non-nil, non-String peek raises `NoMethodError` on Ruby 3.3
  (`Object#=~` was removed in 3.2). `parseNumeric` guards the `exec` with
  `typeof === "string"` and raises `MalformattedArgumentError` instead.
- `parse_numeric`: `shift.to_f` (`arguments.rb:146`) is `parseFloat`.
  ruby-compat has `rbStrToF` (`packages/ruby-compat/src/string/convert.ts`),
  which the package index does not export.
- `initialize`: `@banner = options[:banner] || default_banner`
  (`parser/argument.rb:20`) is `options.banner ?? this.defaultBanner()`, so a
  `banner: false` is kept where Ruby falls through to `default_banner`.
- `current_is_value?`: `peek && peek.to_s !~ /^-{1,2}\S+/` (`arguments.rb:84-86`)
  returns `nil` for a nil peek. `isCurrentIsValue` returns `false`.
- `parse`: `send(:"parse_#{argument.type}", ...)` (`arguments.rb:46`) builds
  the TS name by upcasing the first letter of the type, which is right for
  every one-word Thor type and wrong for a subclass type with an underscore.
  `thor-import-boundary` forbids activesupport's `camelize` here.

## Acceptance criteria

- [ ] A non-nil, non-String peek in `parseNumeric` raises `NoMethodError`, as
      MRI 3.3 does, with no invented raise site in the body.
- [ ] `shift.to_f` goes through ruby-compat's `String#to_f`.
- [ ] `banner: false` reaches `defaultBanner()`.
- [ ] `isCurrentIsValue` returns the Ruby value (`nil` / `false` / `true`).
- [ ] The `parse_#{type}` name is built by a Ruby-name to TS-name rule that
      handles an underscored type.
- [ ] A `.trails.test.ts` case pins each.
