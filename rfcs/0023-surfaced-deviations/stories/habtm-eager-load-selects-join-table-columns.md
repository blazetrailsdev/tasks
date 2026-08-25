---
title: "habtm-eager-load-selects-join-table-columns"
status: done
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4460
claim: "2026-07-03T01:33:52Z"
assignee: "habtm-eager-load-selects-join-table-columns"
blocked-by: null
---

## Context

Surfaced while porting
`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`
(RFC 0048, `redo-habtm-associations-faithful-port`), specifically
`test_join_with_group`.

Rails eager-loads `Developer.includes(projects: :developers)` and SELECTs only
`developers.*`, the nested `developers_projects_2.*` (the nested developers
alias), and `projects.*`. Its `GROUP BY` therefore lists exactly those columns.

trails' eager-load SELECT additionally emits the HABTM **join-table** columns —
`developers_projects.*` and `developers_projects_projects_join.*`
(developer_id, project_id, joined_on, access_level) — that Rails does not
select. Under PostgreSQL's strict GROUP BY this makes the Rails-faithful group
list insufficient ("column developers_projects.x must appear in the GROUP BY
clause"), so the ported test must add the join-table alias columns to its group.

- Test: `has-and-belongs-to-many-associations.test.ts` → `it("join with group")`
  groups the extra join-table alias columns and notes this deviation.

## Acceptance criteria

- [ ] trails' HABTM eager-load SELECT omits the intermediate join-table columns,
      matching Rails (so the join model's columns are not projected into the
      eager result).
- [ ] `join with group` groups only developers/developers_projects_2/projects
      (Rails' exact list) and still passes on SQLite, PostgreSQL and MySQL.
- [ ] No canonical-schema or fixture regressions.
