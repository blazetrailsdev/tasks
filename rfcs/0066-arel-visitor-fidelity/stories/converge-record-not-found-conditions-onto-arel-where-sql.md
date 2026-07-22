---
title: "converge-record-not-found-conditions-onto-arel-where-sql"
status: claimed
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 31
pr: null
claim: "2026-07-22T14:25:51Z"
assignee: "converge-record-not-found-conditions-onto-arel-where-sql"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5037 (arel-tests-lack-fakerecord-quoting-double), which gave
Arel's `whereSql` a connection parameter and thereby made the wide call ratchet
notice a pre-existing divergence. The gap itself pre-dates #5037.

Rails builds the RecordNotFound condition string directly off Arel:

    # activerecord/lib/active_record/relation/finder_methods.rb:418
    conditions = " [#{arel.where_sql(model)}]" unless where_clause.empty?

trails instead routes through a host method `_conditionsClause()`:

    // packages/activerecord/src/relation/finder-methods.ts:314, :674
    const conditions = this._conditionsClause();

`_conditionsClause` is a trails invention: it is declared on the host interface
at `finder-methods.ts:286` and called from `finder-methods.ts:314`/`:674` and
`associations/collection-proxy.ts:3466`, but grepping `packages/**/src` for its
definition turns up no implementation — only the generated `dist/*.d.ts`
declarations. Whatever supplies it at runtime is not obvious from source, which
is itself worth resolving.

Baselined for now at
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/finder-methods.json`
(`raise_record_not_found_exception!` / `where_sql`), with the reason recorded
inline. That baseline entry should be DELETED by this story, not kept.

Note `arel.where_sql(model)` passes the engine, and Arel's `whereSql` now
accepts a connection (`packages/arel/src/select-manager.ts`, #5037), so the
Rails-faithful call is expressible today.

## Acceptance criteria

- [ ] Locate `_conditionsClause`'s actual runtime definition and document it.
- [ ] `raiseRecordNotFoundExceptionBang` builds `conditions` via Arel's
      `whereSql(connection)`, matching `finder_methods.rb:418` including the
      `where_clause.empty?` guard and the `" [...]"` wrapping.
- [ ] The `collection-proxy.ts:3466` caller converges or is justified at the
      call site.
- [ ] The `raise_record_not_found_exception!`/`where_sql` entry is removed from
      the wide-call exclude file and the ratchet still passes.
- [ ] RecordNotFound message assertions across activerecord still pass.
