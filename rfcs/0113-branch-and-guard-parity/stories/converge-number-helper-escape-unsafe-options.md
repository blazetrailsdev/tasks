---
title: "converge-number-helper-escape-unsafe-options"
status: done
updated: 2026-09-03
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7435
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionview/lib/action_view/helpers/number_helper.rb:125-139`:

```ruby
def escape_unsafe_options(options)
  options[:format]          = ERB::Util.html_escape(options[:format]) if options[:format]
  options[:negative_format] = ERB::Util.html_escape(options[:negative_format]) if options[:negative_format]
  options[:separator]       = ERB::Util.html_escape(options[:separator]) if options[:separator]
  options[:delimiter]       = ERB::Util.html_escape(options[:delimiter]) if options[:delimiter]
  options[:unit]            = ERB::Util.html_escape(options[:unit]) if options[:unit] && !options[:unit].html_safe?
  options[:units]           = escape_units(options[:units]) if options[:units] && Hash === options[:units]
  options
end

def escape_units(units)
  units.transform_values { |v| ERB::Util.html_escape(v) }
end
```

trails (`packages/actionview/src/helpers/number-helper.ts:96-119`) collapses the
six explicit lines into an `ESCAPE_KEYS` loop and routes every escape through a
module-local `escape()` helper that Rails does not have — so the `html_safe?`
guard Rails applies to `:unit` alone is applied to all five keys, and neither
body calls `htmlEscape` directly.

Surfaced by PR for `port-encryption-properties-encoding-accessor`: teaching the
extractor to credit a `for (const [name, value] of Object.entries(HASH))`
generator loop brought `base.ts:423-426`'s `include ::ERB::Util`
(`actionview/lib/action_view/base.rb:158`) into the measured surface, which put
`html_escape` into the call-parity population and flagged both bodies. Two rows
were baselined in
`scripts/api-compare/call-mismatches-exclude/actionview/helpers/number-helper.json`
pending this story.

## Acceptance criteria

- `escapeUnsafeOptions` mirrors `number_helper.rb:125-133` line for line — five
  explicit assignments plus the `units` arm, with the `htmlSafe?` guard on
  `unit` only.
- `escapeUnits` is the `transform_values` over `htmlEscape`; the module-local
  `escape()` helper is gone.
- The two `number-helper.json` call-set baseline rows for `escape_units` and
  `escape_unsafe_options` are deleted.
- `pnpm vitest run packages/actionview/src/helpers/number-helper*.test.ts` passes.
