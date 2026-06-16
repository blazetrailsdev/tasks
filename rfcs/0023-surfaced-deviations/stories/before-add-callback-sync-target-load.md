---
title: "before_add proc cannot synchronously force-load association target"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while landing RFC 0030 d3 (#3451),
`nested-attributes-with-callbacks.test.ts`.

Rails' `nested_attributes_with_callbacks_test.rb` declares
`has_many :birds_with_add_load, before_add: proc { |p, b| @@add_callback_called << b; p.birds_with_add_load.to_a }`
— the `before_add` proc force-LOADS the association target synchronously
(`.to_a`) from within the callback. trails fires `before_add` synchronously from
the collection-proxy build path, but its collection load is **async**, so the
port can only do `void p.birdsWithAddLoad.toArray()` (fire-and-forget) — the
callback's force-load does not actually complete before the callback returns.

The "and callback loads target" variant tests still pass, because the record is
added to the in-memory target by the synchronous build path regardless of the
callback's (floating) load. So the observable assertion matches Rails, but the
callback semantics deviate: a `before_add` proc that depends on the target being
loaded _as a side effect of the callback itself_ would not see it loaded in
trails.

## Acceptance criteria

- Decide convergence: either make collection `before_add` callbacks able to
  observe a synchronously-loaded target (matching Rails' `.to_a` in-proc load),
  or document this as a tracked-pending-convergence deviation with the precise
  semantics and the trails async-load constraint that blocks it.
- If converging, update `nested-attributes-with-callbacks.test.ts`'s
  `birdsWithAddLoad` proc to `await`/load faithfully rather than `void`.
- No regression in test:compare for `nested_attributes_with_callbacks_test.rb`.
