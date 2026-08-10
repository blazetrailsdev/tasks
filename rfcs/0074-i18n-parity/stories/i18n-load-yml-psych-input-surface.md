---
title: "Accept the full Psych input surface in load_yml"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps:
  - yaml-is-an-optional-npm-dependency
deps-rfc: []
est-loc: 150
priority: null
pr: 6091
claim: "2026-08-04T20:44:04Z"
assignee: "i18n-date-parse-have-elem-gates"
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
novel names `parity:api:extra --package i18n` reports for a file with no Rails
counterpart (`yaml.ts — 2 novel, 0 moved [no Rails counterpart]`).

Note on wiring: **take `yaml` as a direct dependency of `packages/i18n`; do not
route through `@blazetrails/activesupport/yaml`.** The dependency edge runs
activesupport → i18n (`packages/activesupport/package.json:89`
`"@blazetrails/i18n": "workspace:*"`, used at `src/i18n.ts:20`,
`src/html-safe-translation.ts:2`, `src/locale/en.ts:11`; same edge from
actionpack, activemodel, activerecord). `packages/i18n` declares **no
`@blazetrails/*` dependency**, and its `src/` contains no `@blazetrails/*`
import — it is a leaf, mirroring the gem, which Rails depends on rather than the
reverse. (It is not dependency-free: `packages/i18n/package.json:25-27` already
declares `"@js-temporal/polyfill": "^0.5.1"`, so a third-party runtime dep here
is precedent, not a new concession. The constraint this note is protecting is
the workspace edge, not the dependency count.)
Consuming the activesupport re-export would invert that edge and create the
cycle. Importing `"yaml"` directly is the shape
`packages/activesupport/src/configuration-file.ts:2` already uses, and it keeps
i18n a leaf.

## Converged shape

`loadYml` accepts everything Psych accepts, and raises `InvalidLocaleData` only
for input Psych would also reject, by delegating to `yaml` the way
`ConfigurationFile` does. Do **not** extend `src/yaml.ts` to full YAML 1.1
coverage (anchors/aliases, tags, block scalars with chomping, multi-document
streams) — that is a large parser trails has already decided not to own.

## Acceptance criteria

- `packages/i18n/package.json` declares the `yaml` dependency at the same
  version range activesupport pins (`^2.8.3`) and in the same **optional**
  shape `[[yaml-is-an-optional-npm-dependency]]` settles on — do not add a
  second hard dependency edge on it — and `Backend::Base#loadYml`
  (`packages/i18n/src/backend/base.ts:542`) parses through it.
- `packages/i18n/src/yaml.ts`'s hand-rolled parser is deleted, not kept as a
  fallback; if the file survives it is a re-export in the shape of
  `packages/activesupport/src/yaml.ts:1`, and `pnpm parity:api:extra --package i18n`
  loses the two `yaml.ts` novel names.
- A locale file using anchors/aliases, a block scalar, or `- key: value` loads
  through `loadYml` instead of raising.
- `InvalidLocaleData` is raised only for genuinely malformed YAML, carrying the
  parser's message the way `base.rb:268` carries `e.inspect`.
- The existing probe (all vendored locale files under `vendor/rails` and
  `vendor/i18n` parse) still passes.
