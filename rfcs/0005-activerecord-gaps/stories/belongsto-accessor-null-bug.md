---
title: "Investigate belongsTo accessor returning null despite valid FK"
status: ready
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In minimal inline-model + handler-suite tests, `await book.author === null`
despite a valid `author_id`. Join SQL and ordering are correct — only the
accessor is broken.

## Acceptance criteria

- [ ] Root cause of the null belongsTo accessor identified
- [ ] Accessor returns the associated record for a valid FK in inline-model setups
- [ ] Regression test

## Notes

From the relation gap plan (belongsTo accessor bug), ready now.
