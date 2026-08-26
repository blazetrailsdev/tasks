---
title: "A leading colon is stripped from string writes once the model's types are loaded"
status: done
updated: 2026-08-26
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7085
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Once a model's types are loaded, writing a string that **starts with a colon**
silently drops exactly one leading colon. Mid-string colons are unaffected.

```ts
await Story.findBy({ id }); // loads the model's types
await Story.where({ id }).updateAll({ title: "::Alpha" });
// stored: ":Alpha"
```

Measured against `stories.title` (a plain `varchar`) on the node-sqlite adapter:

| sent          | stored        |
| ------------- | ------------- |
| `::Alpha`     | `:Alpha`      |
| `:Alpha`      | `Alpha`       |
| `:::Alpha`    | `::Alpha`     |
| `Alpha::Beta` | `Alpha::Beta` |

The trigger is the type load, not the statement shape: a fresh process doing
`updateAll({title})` repeatedly is clean, and the same call becomes lossy after
any `findBy` on that model. `count()` does not clear it once poisoned. That
points at the string type-caster rather than binding or statement caching —
stripping a leading `:` is symbol-shaped coercion (`:foo` → `foo`), which is
plausible in a Rails port but wrong for a `varchar` column.

Found by the tasks repo, which is a real trails consumer: 8 story titles about
Ruby constants (`::DateTime hardcodes zone …`, `::Time cannot hold a leap
second …`) were stored a colon short. Because ingest re-derives titles from the
markdown on every scan, each re-scan silently re-corrupted them, and a manual
correction was reverted by the next run — which read as "the update does not
apply" and cost an evening to localize.

This is not niche for this codebase. `::Foo` is how the port refers to Ruby
top-level constants, so it appears throughout story prose, RFC text, and any
data mirroring Rails naming.

## Acceptance criteria

- [ ] `updateAll` / `save` store a leading-colon string verbatim, before and
      after the model's types are loaded.
- [ ] A regression test covers the table above, including the `findBy`-first
      ordering — the bug is invisible without it.
- [ ] Confirm whether `create`/`insertAll` share the path; the tasks importer
      used `insertAll` and did NOT corrupt, so the two disagree today.
- [ ] Check the other adapters. Only node-sqlite was measured.

## Definition of done

Not done if only `updateAll` is fixed and `save` still coerces — the caster is
the suspected layer, so the fix belongs there rather than at one call site.

## Verification

```ts
await Model.findBy({ id });
await Model.where({ id }).updateAll({ name: "::Alpha" });
// expect exactly "::Alpha"
```

The tasks repo carries a bounded workaround (`fixLeadingColon` in
`src/ingest.ts`) that rewrites such titles via raw SQL after the ORM write.
Delete it when this lands.
