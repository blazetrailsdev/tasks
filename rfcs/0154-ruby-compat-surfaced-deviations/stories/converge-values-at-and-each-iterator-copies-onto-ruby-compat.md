---
title: "converge valuesAt and each-iterator copies onto ruby-compat"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["actionpack", "rack"]
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

`pnpm parity:structural-duplicates:report` lists five candidates once an element access keeps its
literal index. Four are real copies of a ruby-compat primitive:

- `valuesAt` (`packages/ruby-compat/src/hash.ts`):
  - `actionpack/src/action-controller/metal/strong-parameters.ts:492` is
    `keys.map((k) => this.get(k))`. Rails is
    `convert_value_to_parameters(@parameters.values_at(*keys))`
    (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:1005-1007`).
  - `rack/src/headers.ts:87` is `keys.map((k) => this.get(k))`. Rack is
    `keys.map { |k| self[k.downcase] }` (`vendor/rack/v3.1.14/lib/rack/headers.rb:198-200`).
- `Enumerator`'s `[Symbol.iterator]` (`packages/ruby-compat/src/enumerator.ts:33`), the
  `each`-to-iterator bridge:
  - `actionpack/src/action-dispatch/journey/nodes/node.ts:16`, where Rails has `include Enumerable`
    (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/nodes/node.rb:70`).
  - `rack/src/files.ts:37`, where `Rack::Files::Iterator` defines `each` only
    (`vendor/rack/v3.1.14/lib/rack/files.rb:130`).

The fifth, `actionview/src/template/resolver.ts:245 escapeEntry` against `regexpEscape`, is not this
story's: it escapes glob metacharacters, a different character class.

## Acceptance criteria

- [ ] `Parameters#valuesAt` calls ruby-compat's `valuesAt` on `_parameters` and
      `convertValueToParameters`, as `strong_parameters.rb:1005-1007` does.
- [ ] `Rack::Headers#valuesAt` takes `headers.rb:198-200`'s body.
- [ ] `Journey::Nodes::Node` gets its iterator from ruby-compat's `Enumerable` include, and
      `Rack::Files::Iterator`'s hand-written bridge is removed or converged onto the primitive.
- [ ] The four rows leave `pnpm parity:structural-duplicates:report`.
