---
title: "Store story and RFC bodies at ingest so /search queries them in SQL"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#78's `/search` matches ids and titles in SQL, but bodies are not columns: `tasks ingest` stores metadata and leaves the markdown on disk. `app/models/concerns/search.ts` (`bodyIndex`) therefore reads every story and RFC file (~14,000, ~37 MB) once per `meta.last_ingested_sha` and holds them lowercased in process memory: +70 MB RSS, ~1.1s for the first search after an ingest.

## Acceptance criteria

- Ingest writes each document's body (frontmatter stripped) to a column on `stories` and `rfcs`, through a trailmap migration.
- `/search` matches bodies in SQL through the framework's query surface (Arel `matches`, or an FTS5 table if trails can express one — file a trails story if not), and the in-process body cache is deleted.
- Show pages may keep reading the file; this story is about search.
