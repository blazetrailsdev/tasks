---
title: "Converge CollectionAssociation#target= into the setter Rails writes it in"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6675
claim: "2026-08-17T23:07:59Z"
assignee: "admit-first-to-receiver-as-first-arg"
blocked-by: null
closed-reason: null
---

# Converge CollectionAssociation#target= into the setter Rails writes it in

## Context

Rails puts the `has_many_inversing` fold in the `target=` writer
(activerecord/lib/active_record/associations/collection_association.rb:285-296):

```ruby
def target=(record)
  return super unless reflection.klass.has_many_inversing
  case record
  when nil   then # cannot be removed from the inverse
  when Array then super
  else replace_on_target(record, true, replace: true, inversing: true)
  end
end
```

trails ports that body in `inversedFrom`
(packages/activerecord/src/associations/collection-association.ts) — the one
Rails path that reaches the writer — while the TS `set target` is only the
shared-store holder write. So `reflection.klass` and `replace_on_target` are
never called from the setter, and one Rails method is spread across two.

Surfaced by RFC 0106 wave 3, which recorded the gap as per-row justifications on
`target= | klass` and `target= | replace_on_target` in
`call-mismatches-exclude/activerecord/associations/collection-association.json`.

## Converged shape

Move the arms back into the `target` setter (Rails' decomposition: one Rails
method is one TS method), leaving `inversedFrom` to mirror
`association.rb:inversed_from` alone. Then delete the two rows by hand via
`serializeBaseline` and lower the mark with `pnpm parity:api:calls:tighten`.

## Acceptance criteria

- [ ] `set target` carries Rails' guard and three-way case, in Rails' order.
- [ ] Both `target= | *` rows deleted; gate green, no `--write`.
