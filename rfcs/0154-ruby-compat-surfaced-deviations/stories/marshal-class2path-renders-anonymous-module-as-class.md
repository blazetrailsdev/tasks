---
title: "Marshal.dump of an anonymous Module raises with a #<Class:…> path, not #<Module:…>"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails#8520. `class2path` (`packages/ruby-compat/src/marshal.ts`,
port of `vendor/ruby/v3.3.11/marshal.c:273-287`) builds its path as
`rbModName(klass) ?? rbModToS(klass)`. For an anonymous `Module` instance
`rbModToS` renders `#<Class:0x…>`, so `Marshal.dump(new Module())` raises
`can't dump anonymous module #<Class:0x…>`. MRI 3.3.11 raises
`TypeError: can't dump anonymous module #<Module:0x…>` (`rb_class_path`,
`vendor/ruby/v3.3.11/variable.c:483-486`, under `must_not_be_anonymous`,
`marshal.c:256-271`). `wExtended` in the same file already renders a `Module`
through `m.inspect()` for this reason (#8520).

## Acceptance criteria

- [ ] `class2path` renders an anonymous `Module` as `#<Module:0x…>`, through the
      same expression `wExtended` uses, with no second copy of it.
- [ ] `marshal.trails.test.ts` pins `Marshal.dump(new Module())` raising
      `TypeError` matching `/^can't dump anonymous module #<Module:0x/`.

## Verification

`pnpm vitest run packages/ruby-compat/src/marshal.trails.test.ts`.
