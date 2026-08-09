---
title: "configuration_file.rb requires yaml lazily; configuration-file.ts imports it statically"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Optional-dependency resolution mechanics (ESM eager link vs Ruby's conditional require); with yaml installed behaviour is identical to configuration_file.rb. Packaging robustness, not Rails fidelity."
---

## Context

`active_support/configuration_file.rb:45` loads YAML lazily, inside
`parse`:

```ruby
require "yaml" unless defined?(YAML)
```

`packages/activesupport/src/configuration-file.ts:2` instead does a static
top-level import of the bare `yaml` package:

```ts
import { parse as yamlParse } from "yaml";
```

`yaml` is an `optionalDependency` of `@blazetrails/activesupport` (#6077), and
an ESM static import is an eager link-time edge, so
`import "@blazetrails/activesupport/configuration-file"` is a hard
`ERR_MODULE_NOT_FOUND` when `yaml` is absent — the same hazard #6078 removed
for the `activerecord` and `actionview` roots. It is not reachable from any
package's `index.ts` today, so it did not block that story, but it is the last
static `from "yaml"` in `packages/` and Rails' own `require` here is
explicitly conditional.

## Converged shape

Import through `./yaml.js` (which resolves the optional package once, via a
caught dynamic import, and throws only at the call site) instead of the bare
`yaml` package:

```ts
import { parse as yamlParse } from "./yaml.js";
```

Behaviour with `yaml` installed is unchanged.

## Acceptance criteria

- `packages/activesupport/src/configuration-file.ts` no longer statically
  imports the bare `yaml` package.
- With `yaml` uninstalled, `import "@blazetrails/activesupport/configuration-file"`
  resolves; only calling `parse` throws.
- `scripts/test-deps/yaml-optional-dependency.test.ts` is extended to cover the
  `./configuration-file` subpath entry point (it currently walks `index.ts`
  roots only).
