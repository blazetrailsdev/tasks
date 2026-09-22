---
title: "hwia-has-no-enumerator-form-or-yaml-dump"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Converging `hash_with_indifferent_access_test.rb`'s assertions under RFC 0132
stopped at two gaps in `packages/activesupport/src/hash-with-indifferent-access.ts`.

**1. `select` / `reject` have no arity-0 Enumerator form.** Rails
(`vendor/rails/activesupport/test/hash_with_indifferent_access_test.rb:395-398,421-424`):

```ruby
enum = ActiveSupport::HashWithIndifferentAccess.new(@strings).select
assert_instance_of Enumerator, enum
```

`HashWithIndifferentAccess#select` / `#reject`
(`vendor/rails/activesupport/lib/active_support/hash_with_indifferent_access.rb`)
inherit Ruby's block-less Enumerator return. trails' `select(fn)` / `reject(fn)`
require the block, and trails has no `Enumerator` analogue at all, so there is
nothing for `assert_instance_of Enumerator` to assert against.

**2. There is no `to_yaml`.** `test_inheriting_from_hash_with_indifferent_access_properly_dumps_ivars`
(`hash_with_indifferent_access_test.rb:871-883`) asserts the YAML dump of a
subclass carries both the `hash-with-ivars` tag and `@foo: bar`:

```ruby
yaml_output = klass.new.to_yaml
assert_includes yaml_output, "hash-with-ivars"
assert_includes yaml_output, "@foo: bar"
```

trails has no `toYaml` on `HashWithIndifferentAccess` and no `hash-with-ivars`
tag anywhere in `packages/activesupport/src`.

Three tests in `packages/activesupport/src/hash-with-indifferent-access.test.ts`
are parked `it.skip` with a `BLOCKED:` line pointing here — `indifferent select
returns enumerator`, `indifferent reject returns enumerator`, and `inheriting
from hash with indifferent access properly dumps ivars`. Their bodies are the
pre-convergence ones, because the surface they would assert against does not
exist yet.

Separately, this file still has 2 unported Rails test names and 40 TS-only
extras; that name gap belongs to RFC 0105, not here.

## Acceptance criteria

- [ ] The arity-0 `select` / `reject` form is decided — ported to a JS iterator
      analogue, or recorded as unportable with a receipt — and the two parked
      enumerator tests converge or close with a recorded reason.
- [ ] `HashWithIndifferentAccess#toYaml` is decided the same way, and the ivars
      test converges or closes.
- [ ] `pnpm parity:test -- --package activesupport --assertions` reports
      `hash_with_indifferent_access_test.rb` at 0 count / 0 kind / 0 value.
