---
title: "XmlMini.backend= by name is unresolvable under vitest"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6481
claim: "2026-08-13T17:35:42Z"
assignee: "mysql-tasks-drop-url-reparse-fallbacks"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::XmlMini.backend = "REXML"` (`xml_mini.rb:105-109`) resolves the
name through `cast_backend_name_to_module` (`xml_mini.rb:200-206`), which in Ruby
is `require "active_support/xml_mini/#{name.downcase}"` plus
`const_get "XmlMini_#{name}"`. trails spells that as one dynamic import
(`packages/activesupport/src/xml-mini.ts:568-574`):

```ts
return (await import(`./xml-mini/${name.toLowerCase()}.js`)) as XmlMiniBackend;
```

Under vitest that arm throws `Error: Unknown variable dynamic import:
./xml-mini/rexml.js` — the sources are `.ts`, so vite's glob for
`./xml-mini/*.js` matches nothing and the helper has no entry to resolve. Found
while enrolling `XMLMiniEngineTest` (PR #6471): the suite's `setup` is
`ActiveSupport::XmlMini.backend = engine` with `engine` the STRING `"REXML"`
(`xml_mini_engine_test.rb:25-27`, `rexml_engine_test.rb:20-22`), and it had to
pass the backend module object instead, with the reason noted at the call site
(`packages/activesupport/src/xml-mini/xml-mini-engine.test.ts`).

The module arm is exercised (`xml-mini.test.ts`'s `WithBackendTest`), so only the
name arm — the one Rails' own tests use — is unreachable. Nothing outside a test
run is known to be affected, but the arm is effectively unverified.

## Converged shape

`castBackendNameToModule`'s name arm resolves under vitest as well as under the
built output, so `setBackend("REXML")` / `withBackend("REXML", …)` work and
`xml-mini-engine.test.ts` can pass the Rails string. Options to weigh: a static
`import.meta.glob`-style map of the backend modules (vite-analyzable), a
`switch` over the known backend names mirroring what Ruby's `require` can reach,
or a vitest resolver change. Then drop the module-object workaround and its
call-site note in `xml-mini-engine.test.ts`.

## Acceptance criteria

- [ ] `await setBackend("REXML")` resolves the REXML backend under vitest and in
      the built package.
- [ ] `xml-mini-engine.test.ts` sets the backend by NAME, as
      `xml_mini_engine_test.rb:25-27` does, and its call-site note is removed.
- [ ] A test covers the name arm of `castBackendNameToModule` directly.
