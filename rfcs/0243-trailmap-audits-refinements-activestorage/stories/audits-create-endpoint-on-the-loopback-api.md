---
title: "trailmap: POST /audits on the loopback API attaches the report body"
status: ready
updated: 2026-11-18
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: audits
packages: ["activestorage"]
deps: [trailmap-audits-to-activestorage, trailmap-ingest-token-guards-create-endpoints]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

trailmap's machine API is `ApiController`
(`app/controllers/api-controller.ts:25-31`). It includes `LoopbackOnly`
(`app/controllers/concerns/loopback-only.ts`), which refuses any request
with proxy provenance, and skips forgery protection. It is reachable only at
`http://127.0.0.1:8080` (trailmap `docs/deploy.md:9`). #151's
`POST /rfc-refines` is the closest precedent. The writer this replaces is
trails `.claude/skills/audit-report/run.sh:22,44-51`: a kebab-case slug,
owner and repo from `git remote`, and a UTC `YYYYMMDDTHHMMSSZ` stamp.
The largest existing body is 285 KB. `nginx.conf.sigil:82,144,205` set
`client_max_body_size` from `CLIENT_MAX_BODY_SIZE`.

## Acceptance criteria

- [ ] `POST /audits` (JSON: `slug`, `repo`, `body`, optional `format`
      (`md` default | `html`), `title`, `writtenAt`) creates an `Audit` and
      attaches `body` as `<slug>-<ts>.<format>` (`text/markdown` or
      `text/html`). It answers 201 `{id, url}`, where `id` is the legacy
      filename `toParam` answers.
- [ ] A bad slug, unknown format or empty body is a 422 with the error
      message. A missing or wrong ingest token is a 401. A proxied request is refused, as for every `ApiController`
      action. An existing `(repo, slug, writtenAt)` answers 200 with the
      existing id (the import relies on this).
- [ ] The loopback block admits a 1 MB body, and a test posts a 300 KB one.
- [ ] Controller tests cover each status. The `rails/` twin matches.
