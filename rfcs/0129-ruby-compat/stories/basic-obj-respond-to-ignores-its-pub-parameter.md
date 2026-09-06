---
title: "basicObjRespondTo ignores the pub parameter it now accepts"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7575 while porting `ActiveModel::AttributeMethods#respond_to?`'s
middle arm (`activemodel/lib/active_model/attribute_methods.rb:528-533`), which
answers `false` for a name found among ALL methods but not among the
non-private ones.

Landing that arm required `basicObjRespondTo`
(`packages/ruby-compat/src/object.ts`) to accept the `pub` parameter Ruby's
`basic_obj_respond_to` takes and that trails had dropped:

```c
static inline int
basic_obj_respond_to(rb_execution_context_t *ec, VALUE obj, ID id, int pub)
{
    switch (method_boundp(klass, id, pub|BOUND_RESPONDS)) { ... }
}
```

(`vendor/ruby/vm_method.c:2864-2879`). Without it, Rails' two `super` calls —
`super` (`pub = !include_private_methods`) and `super(method, true)`
(`pub = false`) — spell the identical TS call and eslint's `no-dupe-else-if`
rejects the middle arm as a provably dead branch.

The parameter is now plumbed (`respondTo` passes `!includePrivateMethods` then
`false`; `rbObjRespondTo` forwards `!priv`, mirroring `vm_method.c:2945`), but
the body still opens with `void pub;` — `mid in Object(obj)` is the whole
`method_boundp` here and `in` has no notion of visibility, so both `pub` values
answer the same.

## Converged shape

Establish what `pub` can honour in JS and either honour it or ratify the gap
repo-wide, the way CLAUDE.md ratifies the other language shortcomings.

Two carriers exist and neither has been differentially checked: a `#private`
field is already absent from `in` (so it is invisible at BOTH `pub` values,
where Ruby would report it at `pub = 0`), and a TS `private`/`protected` member
is erased to an ordinary property (so it is visible at BOTH, where Ruby would
hide it at `pub = 1`). The second is the one that could plausibly be honoured —
TS visibility is a compile-time fact, not a runtime one, so it likely cannot,
but that is a finding to establish rather than assume.

If neither can be honoured, the close is a ratified section in CLAUDE.md that
`basicObjRespondTo` cites, so no future port re-derives the decision at its own
call site — not a `void pub;` with no receipt behind it.

## Acceptance criteria

- [ ] `pub` is either read, or the gap is ratified in one place that
      `basicObjRespondTo` cites, keyed to `vendor/ruby/vm_method.c:2864-2879`.
- [ ] The `void pub;` line does not survive as the whole justification.
- [ ] `attribute-methods.test.ts` and `object.test.ts` stay green, and
      `respondTo`'s three-arm shape is unchanged.
