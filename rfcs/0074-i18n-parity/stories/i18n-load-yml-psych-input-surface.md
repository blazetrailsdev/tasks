---
title: "Accept the full Psych input surface in load_yml"
status: draft
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
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

## The rest of the repo already settled this: take the `yaml` dep

Every other Psych call site in trails routes through the npm `yaml` package —
there is no hand-rolled parser anywhere else, and the no-third-party-dep
premise above does not describe this repo:

- `packages/activesupport/package.json:92` — `"yaml": "^2.8.3"`.
- `packages/activesupport/src/yaml.ts:1` — the whole file is
  `export { parse, stringify } from "yaml";`
- `packages/activesupport/src/configuration-file.ts:2,32` — the
  `ActiveSupport::ConfigurationFile` port (`database.yml`, AR fixtures) imports
  `parse` from `"yaml"` directly and lets it decide what is valid, exactly as
  Rails hands the file to Psych.
- Consumers of the re-export: `packages/activerecord/src/coders/yaml-column.ts:1`
  (`ActiveRecord::Coders::YAMLColumn`),
  `packages/activemodel/src/attribute-set/codecs/yaml.ts:1`,
  `packages/actionview/src/helpers/debug-helper.ts:2`.

So AR's strategy for "Rails calls Psych here" is: **don't port a parser, call
`yaml`** — which is also the only shape that can accept the full Psych input
surface. `packages/i18n/src/yaml.ts` is the sole exception, and it costs the two
novel names `api:extra --package i18n` reports for a file with no Rails
counterpart (`yaml.ts — 2 novel, 0 moved [no Rails counterpart]`).

Note on wiring: `packages/i18n` already imports `@blazetrails/activesupport`
(`packages/i18n/src/backend/fallbacks.ts`), and activesupport imports
`@blazetrails/i18n` (`html-safe-translation.ts:2`, `i18n.ts:20`,
`locale/en.ts:11`). Declaring `yaml` as a direct dependency of `packages/i18n`
and importing it there — the shape `configuration-file.ts` already uses —
avoids deepening that cycle for a leaf utility.

## Converged shape

`loadYml` accepts everything Psych accepts, and raises `InvalidLocaleData` only
for input Psych would also reject, by delegating to `yaml` the way
`ConfigurationFile` does. Do **not** extend `src/yaml.ts` to full YAML 1.1
coverage (anchors/aliases, tags, block scalars with chomping, multi-document
streams) — that is a large parser trails has already decided not to own.

## Acceptance criteria

- `packages/i18n/package.json` declares the `yaml` dependency at the same
  version range activesupport pins (`^2.8.3`), and `Backend::Base#loadYml`
  (`packages/i18n/src/backend/base.ts:542`) parses through it.
- `packages/i18n/src/yaml.ts`'s hand-rolled parser is deleted, not kept as a
  fallback; if the file survives it is a re-export in the shape of
  `packages/activesupport/src/yaml.ts:1`, and `pnpm api:extra --package i18n`
  loses the two `yaml.ts` novel names.
- A locale file using anchors/aliases, a block scalar, or `- key: value` loads
  through `loadYml` instead of raising.
- `InvalidLocaleData` is raised only for genuinely malformed YAML, carrying the
  parser's message the way `base.rb:268` carries `e.inspect`.
- The existing probe (all vendored locale files under `vendor/rails` and
  `vendor/i18n` parse) still passes.
