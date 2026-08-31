---
title: "Converge Journey::Route#required_defaults' object spread onto a ported Hash#dup"
status: ready
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 29
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `journey/route.ts`'s Hash call sites in PR #7284
(RFC 0129).

Rails' `Journey::Route#required_defaults` is

```ruby
@required_defaults ||= @defaults.dup.delete_if do |k, _|
  parts.include?(k) || !required_default?(k)
end
```

(`vendor/rails/actionpack/lib/action_dispatch/journey/route.rb:135-137`).

PR #7284 converged the `delete_if` half onto `@blazetrails/ruby-compat`'s
`deleteIf`, but left `dup` as an object-spread literal:

```ts
this._requiredDefaultsCache = deleteIf(
  { ...this.defaults },
  (k) => this.parts.includes(k) || !this.isRequiredDefault(k),
);
```

(`packages/actionpack/src/action-dispatch/journey/route.ts:206-210`).

Two reasons this is worth converging rather than leaving:

1. **`Hash#dup` has a real MRI counterpart** (`rb_obj_dup`, `vendor/ruby/object.c`;
   `Hash#dup` also carries the `default` / `default_proc` over, which a plain
   object spread cannot — see `ruby-compat-hash-dig-and-plain-object-default-seat`).
   The spread is the "no JS call form" shape RFC 0129 exists to retire.
2. **The spread makes the whole call site invisible to the call-argument gate.**
   `{ ...this.defaults }` normalizes to `OPAQUE_DESCRIPTORS.has("hash")`
   (`scripts/api-compare/call-args.ts:39` / `:362`), so the pair is skipped into
   the `opaqueTsArg` bucket before it reaches the comparer. That is why the
   sibling site `route.ts::requirements` needed a `@missingRailsArgs delete_if —
PERMANENT` receipt for its identical block-as-positional-argument shape and
   this one needed none: the delta is present but unmeasured. Verified in
   #7284 by adding the tag and observing that `suppressed` was unchanged and
   `staleTags` stayed empty.

Converging `dup` therefore both removes a deviation and un-blinds the gate at
this site — at which point the `@missingRailsArgs` receipt this site will then
need should be added deliberately rather than by accident.

## Acceptance criteria

- `dup` is exported from `packages/ruby-compat/src/hash.ts` with a
  `vendor/ruby/*.c:LINE` citation, ONLY if this or another real call site adopts
  it — RFC 0129's standing rule is "only what trails actually calls".
- `Hash#dup` carries the receiver's `default` / `default_proc` (MRI
  `rb_hash_initialize_copy`), matching the `Hash` class shipped by #7284.
- `route.ts::requiredDefaults` adopts it in place of `{ ...this.defaults }`.
- Once the site is no longer `opaqueTsArg`, adjudicate the argument-shape delta
  the gate then reports: pass what Rails passes, or add a
  `@missingRailsArgs delete_if — PERMANENT` receipt matching the one already on
  `route.ts::requirements`.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra:gate` green; actionpack journey suite green.
