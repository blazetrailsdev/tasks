---
title: "HWIA/OrderedHash dump their bare JS class name in the !ruby/hash tag, not ActiveSupport::…"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Psych writes a Hash subclass's tag from `o.class`:
`"!ruby/hash:#{o.class}"` / `"!ruby/hash-with-ivars:#{o.class}"`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:452-484`). So
`ActiveSupport::HashWithIndifferentAccess.new(a: 1).to_yaml` is
`--- !ruby/hash:ActiveSupport::HashWithIndifferentAccess`.

trails#8273 ported that arm into `packages/activesupport/src/yaml.ts`
(`visitHashSubclass`). It names the class through `className`, which is
`registeredConstantName(klass) ?? klass.name` (`inflector.ts` registry). HWIA
(`packages/activesupport/src/hash-with-indifferent-access.ts`) never calls
`registerConstant`, so trails dumps `!ruby/hash:HashWithIndifferentAccess`. The
bare JS name does not revive through `constantize` either, so a HWIA
round-trip cannot find its class. The same applies to any other ActiveSupport
Hash subclass, such as `OrderedHash` (`ActiveSupport::OrderedHash`).

## Converged shape

HWIA (and `OrderedHash`) register their Rails constant name
(`registerConstant("ActiveSupport::HashWithIndifferentAccess", HashWithIndifferentAccess)`),
next to the class, the way other `!ruby/object` classes do. Then `dump` writes Psych's tag.

## Acceptance criteria

- [ ] `dump(new HashWithIndifferentAccess({ a: 1 }))` is
      `---\n!ruby/hash:ActiveSupport::HashWithIndifferentAccess\na: 1\n`, pinned in
      `yaml.trails.test.ts`.
- [ ] `OrderedHash` dumps as `!ruby/hash:ActiveSupport::OrderedHash` (`ordered_hash.rb:25`).
