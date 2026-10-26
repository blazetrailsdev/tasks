---
title: "actionpack/actionview: spell Enumerable calls on Sets/Maps as new Enumerable(x).m(...)"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9329
claim: "2026-10-26T14:48:26Z"
assignee: "create-with-value-and-finder-conditions-native-empty"
blocked-by: null
closed-reason: null
---

## Context

trails#9292 made `new Enumerable(x)` (`packages/ruby-compat/src/enumerable.ts`) wrap any Array, Set, Map, generator or `each`-answerer. The call gates credit `new Enumerable(xs).m(...)` as Ruby's `xs.m(...)`: the call set gets `m`, the call-args site gets `xs` as its receiver, and no construction is recorded. In actionpack, actionview, a Rails body that calls an `Enumerable` method on a Set, a Hash or a lazy collection is often ported as a spread or `Array.from` followed by a JS array method. That spelling drops the Ruby method name, so the call gates can't credit it.

Candidate sites, found by grepping for `[...x].filter|map|reduce|some|find` and `Array.from(x.values())`. Check each one against its Rails body before converting:

```text
packages/actionpack/src/abstract-controller/callbacks.ts:77:      const missingAction = [...this._actions].find((a) => !controller.isAvailableAction(a
packages/actionpack/src/action-dispatch/http/mime-type.ts:267:    return [...this.synonyms, this].some((synonym) =>
packages/actionpack/src/action-dispatch/journey/gtg/transition-table.ts:25:  const flags = [...re.flags].filter((f) => "isd".includes(f));
packages/actionpack/src/action-dispatch/journey/gtg/transition-table.ts:178:      stdparamStates[from] = Object.fromEntries([...inner].map(([re, v]) =
packages/actionpack/src/action-dispatch/journey/gtg/transition-table.ts:182:      regexpStates[from] = Object.fromEntries([...inner].map(([re, v]) =>
packages/actionpack/src/action-dispatch/journey/router.ts:103:    const asts = [...groups.values()].map((r) => r.ast);
packages/actionpack/src/action-dispatch/journey/path/pattern.ts:276:      for (const node of [...this.spec].filter((n) => n.isSymbol())) {
packages/actionpack/src/action-dispatch/middleware/debug-locks.ts:71:        const blockers = Array.from(threads.values()).filter((binfo) =>
packages/actionpack/src/action-dispatch/middleware/debug-locks.ts:79:      const blockees = Array.from(threads.values()).filter((binfo) =>
packages/actionpack/src/action-dispatch/middleware/cookies.ts:239:      [...requestJar].filter(([k]) => !(this._deletedCookies.has(k) || this._setCook
packages/actionpack/src/action-dispatch/middleware/cookies.ts:246:    return [...this._cookies].map(([k, v]) => `${this.escape(k)}=${this.escape(v)}`)
packages/actionpack/src/action-dispatch/routing/mapper.ts:272:    return [...new Set(values)].filter((a) => !validActions.includes(a));
packages/actionpack/src/action-dispatch/routing/mapper.ts:1571:      [app, path] = ([...options].find(([k, _]) => rbObjRespondTo(k, "call")) ?? []) as
packages/actionview/src/path-registry.ts:51:    return Array.from(this._fileSystemResolvers.values());
packages/actionview/src/lookup-context.ts:92:    return Array.from(DetailsKey._digestCache.values());
packages/actionview/src/dependency-tracker/tse-tracker.ts:279:        [...this.source.matchAll(TSETracker.EXPLICIT_DEPENDENCY)].map((m) => m.slice(1))
packages/actionview/src/template/handlers.ts:40:    return [...handlers.keys()].map(symbolToS).sort();
packages/actionview/src/template/resolver.ts:133:    return Array.from(this.unboundTemplates.values())
```

## Acceptance criteria

- [ ] Every site whose Rails body calls an `Enumerable` method on a non-Array receiver is spelled `new Enumerable(x).<railsName>(...)`, or as the free function where the receiver is already an Array.
- [ ] Sites whose Rails body really builds an Array first (`to_a`, `values`) are left alone.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` stay green. Delete any baseline row that goes stale and tighten its mark.
