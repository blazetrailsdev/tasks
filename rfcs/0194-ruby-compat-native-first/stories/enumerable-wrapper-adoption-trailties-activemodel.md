---
title: "trailties/activemodel: spell Enumerable calls on Sets/Maps as new Enumerable(x).m(...)"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9329
claim: "2026-10-26T14:48:26Z"
assignee: "create-with-value-and-finder-conditions-native-empty"
blocked-by: null
closed-reason: null
---

## Context

trails#9292 made `new Enumerable(x)` (`packages/ruby-compat/src/enumerable.ts`) wrap any Array, Set, Map, generator or `each`-answerer. The call gates credit `new Enumerable(xs).m(...)` as Ruby's `xs.m(...)`: the call set gets `m`, the call-args site gets `xs` as its receiver, and no construction is recorded. In trailties, activemodel, a Rails body that calls an `Enumerable` method on a Set, a Hash or a lazy collection is often ported as a spread or `Array.from` followed by a JS array method. That spelling drops the Ruby method name, so the call gates can't credit it.

Candidate sites, found by grepping for `[...x].filter|map|reduce|some|find` and `Array.from(x.values())`. Check each one against its Rails body before converting:

```text
packages/trailties/src/paths.ts:39:    return Array.from(new Set(this._entries.values()));
packages/trailties/src/engine/trailties.ts:5:  readonly all: Trailtie[] = [...Trailtie.subclasses(), ...Engine.subclasses()].map((k) =>
packages/trailties/src/generators/active-record/model/model-generator.ts:57:    const className = [...regularClassPath, this.fileName].map((part) => c
packages/trailties/src/generators/named-base.ts:79:    [...this.classPathParts, this.fileName].map((s) => camelize(s)).join("::");
packages/trailties/src/thor/invocation.ts:68:  return flatten(Array.from(this._invocations.values())).map(toSym);
packages/trailties/src/thor/group.ts:218:                !(flatten(Array.from(groupOptions.values())) as Option[]).some(
packages/trailties/src/generators/rails/authentication/authentication-generator.ts:138:      const [namespace, ...words] = [...what.split(/\s+/), ...a
packages/activemodel/src/attribute-set/builder.ts:81:    return [...keys].filter((name) => this.getAttribute(name).isInitialized());
```

## Acceptance criteria

- [ ] Every site whose Rails body calls an `Enumerable` method on a non-Array receiver is spelled `new Enumerable(x).<railsName>(...)`, or as the free function where the receiver is already an Array.
- [ ] Sites whose Rails body really builds an Array first (`to_a`, `values`) are left alone.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` stay green. Delete any baseline row that goes stale and tighten its mark.
