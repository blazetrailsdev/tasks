---
title: "Accept the full Psych input surface in load_yml"
status: ready
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/yaml.ts` (added by #5995) hand-parses a subset of YAML.
Rails does not parse YAML at all — `load_yml` delegates to Psych and only wraps
parser/load failures:

```ruby
# vendor/i18n/lib/i18n/backend/base.rb:259-270
def load_yml(filename)
  begin
    if YAML.respond_to?(:unsafe_load_file) # Psych 4.0 way
      [YAML.unsafe_load_file(filename, symbolize_names: true, freeze: true), true]
    else
      [YAML.load_file(filename), false]
    end
  rescue TypeError, ScriptError, StandardError => e
    raise InvalidLocaleData.new(filename, e.inspect)
  end
end
```

So any input Psych accepts, `load_yml` accepts. The trails reader instead
rejects anchors, aliases, tags, block scalars (`|`, `>`), multi-document
streams, and mapping entries inside block sequences — each raises and surfaces
as `InvalidLocaleData`, which is indistinguishable from a genuine syntax error.

This was raised twice in review on #5995 and accepted as justified only because
`packages/i18n` may take no third-party runtime dep and JS has no YAML in the
language or platform. It is a real input-surface gap, not a settled decision.

Measured at the time: all 12 locale files vendored under `vendor/rails` and
`vendor/i18n` parse, and 0 of 12 use any rejected construct. That is what makes
it survivable today, not correct.

## Converged shape

`loadYml` accepts everything Psych accepts, and raises `InvalidLocaleData` only
for input Psych would also reject. Reaching that means one of:

1. Take a vetted YAML dependency for `packages/i18n` (a dependency-policy
   decision — the blocker, not the work), or
2. Extend `src/yaml.ts` to full YAML 1.1 block+flow coverage: anchors/aliases
   (`&`/`*` with a node registry), tags, block scalars with chomping and
   indentation indicators, `- key: value`, and multi-document streams.

Option 2 is a large parser; size it before claiming.

## Acceptance criteria

- A locale file using anchors/aliases, a block scalar, or `- key: value` loads
  through `Backend::Base#loadYml` instead of raising.
- `InvalidLocaleData` is raised only for genuinely malformed YAML.
- The existing probe (all vendored locale files parse) still passes.
