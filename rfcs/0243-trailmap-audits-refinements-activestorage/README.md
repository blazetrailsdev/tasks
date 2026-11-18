---
rfc: "0243-trailmap-audits-refinements-activestorage"
title: "trailmap: audits and RFC refinements are records with an Active Storage body"
status: active
created: 2026-11-17
updated: 2026-11-18
owner: "@deanmarano"
packages:
  - activestorage
  - activerecord
clusters:
  - storage
  - audits
  - refinements
  - writers
  - import
  - retire
related-rfcs:
  - "0136-trailmap"
  - "0209-activestorage-port"
---

# RFC 0243 — trailmap: audits and RFC refinements are records with an Active Storage body

## Summary

Agent audit reports and RFC refine reports are files today. Audits are
markdown files under `~/.btwhooks/data/github/<owner>/<repo>/audits/`, which
trailmap lists through an ActiveModel over `AUDITS_DIR`. Refine reports are
JSON maps in ringo's data dir. This RFC makes both of them ActiveRecord models
on trailmap's `Base` (the SQLite task domain). Each record keeps its report
body in an Active Storage attachment on the Disk service. The agents that write
them POST to trailmap's loopback API instead of writing files. A one-time
import carries the existing reports across, and then the filesystem path and
`AUDITS_DIR` are deleted.

This **reverses RFC 0136's ruling** that `/audits` stays file-backed
(`rfcs/0136-trailmap/README.md:495-497`, "`/audits` is the one file-backed
exception"). The `Audit` model repeats that ruling in its JSDoc
(trailmap `app/models/audit.ts:37-44`, "RFC 0136 leaves them so"). The
exception was justified as "serving a directory of agent-supplied files is
exactly the unglamorous surface the proving ground is for". Active Storage is
the Rails answer to that surface, and trails now ports it (RFC 0209). So the
proving-ground argument now points the other way: trailmap should drive
`has_one_attached`, the Disk service and an upload endpoint, not
`readdir`/`stat`/`readFile` through `getFs`.

## Motivation

### Audits

- **Writer.** trails `.claude/skills/audit-report/run.sh:44-51` derives the
  owner and repo from `git remote`, `mkdir -p`s
  `/home/dean/.btwhooks/data/github/${OWNER}/${REPO}/audits` and writes
  `<slug>-<YYYYMMDDTHHMMSSZ>.md`. Only one directory exists today
  (`blazetrailsdev/trails/audits`), holding 88 `.md` files and 2.0 MB. The
  largest file is 285 KB (`activerecord-permanent-receipts-20260917T170322Z.md`).
  `config/audit-files.ts:11` also admits `.html`, but no `.html` file exists
  yet. The parent session reads a report back from the path `run.sh` prints
  (`:52`), so the report only works on the host that wrote it.
- **Reader.** trailmap `app/models/audit.ts` is an ActiveModel whose "table" is
  `AUDITS_DIR` (`auditsDir()`, `:14-17`, read from `config.x.audits.dir`, which
  `config/application.ts:31` sets from `env.AUDITS_DIR`). `all()` (`:63-91`)
  runs `readdir`, a `stat` per entry and a sort by mtime. `findBy` (`:98-101`)
  re-lists the whole directory, and `read()` (`:139-151`) reads the file. The
  primary key is the filename, constrained by `AUDIT_FILE_RE`
  (`config/audit-files.ts:11`), which `config/routes.ts` reuses as the `:id`
  segment constraint (`AUDIT_SEGMENT`). `app/controllers/audits-controller.ts`
  and `app/views/audits/{index,raw}.html.tse` render from it.
- **Deploy.** Production reads a read-only dokku mount of the btwhooks
  directory (0136 story `mount-the-audits-directory-on-the-deployed-app`:
  `dokku storage:mount trailmap …/audits:/audits:ro` plus `AUDITS_DIR=/audits`).
  So the deployed app depends on a path in another service's data dir, and
  only one repository's audits are visible.

### Refinements

- **Writer.** The tasks repo's `scripts/rfc-refine-done.sh` POSTs
  `{kind: "rfc-refine", id, outcome, pane, summary}` to btwhooks'
  `/cleanup-pane` (`:59-71`). btwhooks routes it to `SpawnLoop.RecordRefine`
  (btwebooks `webhook/spawnloop.go:2465-2485`), which stores
  `refineReport{When, Outcome, Summary, Stories}` (`:209-219`) twice. The
  latest report per RFC goes in `refines.json` (`saveRefinesLocked`, `:2420`).
  Every report goes in `refine-history.json`, capped at 50 per RFC
  (`refineHistoryMax`, `:189`; `saveRefineHistoryLocked`, `:2446`). Today
  `refines.json` holds 128 RFC keys, and `refine-history.json` holds 93 RFC keys
  and 258 reports. History was added after `refines.json`, so 35 RFCs exist
  only in `refines.json`.
- **Readers.** ringo's RFC page folds history into the RFC marks
  (`webhook/rfcs.go:167`, `mergeRefineHistory` at `webhook/rfcmarks.go:371`).
  It also lists reports as audit items (`listRefines`, `webhook/audits.go:116`)
  and serves one in `HandleRefineFile` (`:235`). trailmap's
  `app/models/concerns/rfc-marks.ts:14-15` says outright that it omits
  `mergeRefineHistory` "which is the loop's local state and is not here".
- **In flight.** 0136 story `rfc-page-refinements-tab` (in progress,
  trailmap#151, open) adds `RfcRefine` (`app/models/rfc-refine.ts`) **on
  `Hub`** (Postgres) with `summary` as a text column, a
  `db/hub-migrate/20261117000007_create_rfc_refines.ts` migration, a loopback
  `POST /rfc-refines` (`app/controllers/rfc-refines-controller.ts`) and the
  `/rfc/:id/refinements` tab. Nothing writes to it yet. This RFC builds on that
  PR rather than duplicating it, and moves the model to `Base` with an attached
  summary (Open question 1).
- `rfc-autorefine.json` (`webhook/rfcautorefine.go:212-230`) is ringo's
  per-RFC auto-refine cooldown clock. It is loop state, not a report, so it is
  out of scope (see Non-goals).

### Prior art folded in

- **0123 `trailmap-audits-to-activestorage`** is the original version of the
  audits half. It was claimed on 2026-11-09 and blocked on
  `trails-tsc-build-views-runs-initializers-before-engines`, which has since
  landed (done, trails#10009). Its WIP branch
  (`origin/wip/trailmap-audits-to-activestorage-build-views`, trailmap 9ca1442)
  put the Active Storage tables and `audits` on **Hub**. This PR **moves that
  story into this RFC**, keeping its id, and narrows it to the model. The
  vendoring, configuration and import parts that it bundled get their own
  stories here.
- **0189 `attach-touch-runs-commit-callbacks-on-a-second-instance`** (draft).
  The WIP branch found that `record.report.attach({ io, filename })` saves the
  blob and attachment rows but never uploads the file, because the
  attachment's `touch` enrolls a second record instance. This is a trails bug
  and it blocks every attach in this RFC, so the vendor bump depends on it.
- **0209 `active-storage-install-copies-migrations`** (done, trails#9675).
  `active_storage:install` exists, so the migration can be installed by the
  task instead of copied by hand, as the 0123 story's acceptance assumed.
- 0200 `ringo-audits-direct-hooks-against-the-relay` is about webhook-delivery
  auditing. It is unrelated, despite the shared word.

## Design

### Database: `Base`, and what that implies

By operator decision, the models live on `Base`, the task-domain SQLite, not
on `Hub`. This is also Rails' default: `ActiveStorage::Record` is
`ActiveRecord::Base`'s abstract subclass (trails
`packages/activestorage/lib/record.ts:5-7`), so the Active Storage tables go on
the primary connection with no `connects_to`. The WIP's Hub wiring
(`app/models/hub.ts` +12) is not carried forward.

`Base` is the CLI's live `tasks.db`, and **trailmap never migrates it**:
`tasksEntry()` sets `databaseTasks: false` (trailmap
`config/database.ts:95-113`). The migration that reaches the live file is the
tasks repo's same-version twin (trailmap
`db/migrate/20261114000010_add_stage_to_stories.ts:3-8`; tasks
`src/migrator.ts:17`, `db/migrate/`). Two more rules apply to that file:

- `config/write-protocol.ts`'s `tableOwners` lists every table in
  `db/schema.ts` with exactly one writer. The new tables are all `trailmap`.
- The tasks CLI's `ingest`/`export` must ignore the new tables. It never reads
  them, and nothing joins them to `stories`. The `rfc` column on a refinement
  is the RFC id as a string, the same convention #151 uses.

So the schema lands first, as one tasks-repo story that adds all three
migrations. Each trailmap story then adds the same-version mirror next to its
model.

### Schema

- **Active Storage** — `active_storage_blobs`, `active_storage_attachments`,
  `active_storage_variant_records`, exactly as trails'
  `packages/activestorage/lib/db/migrate/20170806125915_create_active_storage_tables.ts`
  (installed by `active_storage:install`).
- **`audits`** — `slug` (string, not null; `run.sh`'s first token), `title`
  (string; defaults to `auditTitle(name)`'s de-kebabed slug), `format`
  (string, `md` | `html`), `repo` (string `owner/repo`, matching
  `repo-scope.ts`'s convention), `written_at` (datetime, not null),
  timestamps. Unique index on `(repo, slug, written_at)`, which is the import's
  idempotency key. `has_one_attached :body`.
- **`refinements`** — `rfc_id` (string, not null), `outcome` (`changed` |
  `no-change` | `aborted`, from #151's `RFC_REFINE_OUTCOMES`), `stories`
  (integer, null for imported reports that never recorded it), `created_at`
  (the report's `when`), timestamps. Index on `(rfc_id, created_at)`.
  `has_one_attached :summary`.

### Keeping the URL contract

`/audits/<filename>` stays the URL. ringo's and older agents' links point
there, and `config/routes.ts`'s `AUDIT_SEGMENT` constraint stays as it is.
`Audit#toParam` answers the legacy name, `<slug>-<written_at as
YYYYMMDDTHHMMSSZ>.<format>`. `Audit.find(name)` parses the name back into
`(slug, written_at, format)` and raises `RecordNotFound` with the current
message (`audit.ts:27-29`). `isHtml()`, `title`, `size` (now the blob's
`byte_size`) and `when` (now `written_at`) keep their names, so the controller
and both views do not change. The raw action streams `body.download`.

### Ingest: the loopback API

trailmap's machine API is `ApiController`
(`app/controllers/api-controller.ts`), which includes `LoopbackOnly`
(`app/controllers/concerns/loopback-only.ts`). That concern refuses any request
carrying `X-Forwarded-*` / `Forwarded`, and reads the raw `Host`. It is
reachable only at `http://127.0.0.1:8080` through nginx's loopback server
block (trailmap `docs/deploy.md:9`). Nothing off the box can reach it. The CLI
and ringo already use it, and #151's `POST /rfc-refines` is one of its
endpoints. That is the auth this RFC uses: both new writers run on the same
host. A shared-secret header on top is Open question 2.

- `POST /audits` (new): JSON `{slug, repo, format?, title?, body,
writtenAt?}`. It creates the record and attaches `body` as
  `<slug>-<ts>.<format>` with the matching content type. It answers 201
  `{id, url}`. `writtenAt` is accepted so the import can keep original times,
  and defaults to now. A malformed slug (`run.sh:22`'s
  `^[a-z0-9][a-z0-9-]*$`) is a 422.
- `POST /rfc-refines` (#151's, kept): it gains `stories`, measured by trailmap
  itself from the RFC's story count at create time, as ringo's
  `rfcStoryCount` does. It also gains `when` for the import, and attaches
  `summary` instead of writing a column.
- **No direct-upload flow.** trails ports
  `ActiveStorage::DirectUploadsController` (`packages/activestorage/lib/config/routes.ts:47-48`),
  but a report is one small text body. A two-step direct upload (create the
  blob, then PUT to `disk#update`) adds a round trip and a signed-id protocol
  for the shell scripts to speak, and buys nothing at 285 KB. nginx's
  `client_max_body_size` (`nginx.conf.sigil:82,144,205`) must admit at least
  1 MB on the loopback block.

### Writers

- **audit-report (trails repo).** `run.sh` POSTs to
  `http://127.0.0.1:8080/audits`, prints the returned URL, and exits non-zero
  on anything but 201. `SKILL.md` tells the parent to read the report with
  `curl` on `/audits/<id>/raw`, not from a path.
- **rfc-refine-done.sh (tasks repo).** This is the refine report's real
  writer. It POSTs the report to trailmap `/rfc-refines`, then POSTs
  `/cleanup-pane` to btwhooks without `summary`, only to reap the pane. One
  caller is not an RFC: btwebooks `webhook/grades.go:210` calls it with the
  slug `grades`, which #151's controller answers with a 404. The story
  decides that arm.
- **btwhooks (btwebooks repo).** `RecordRefine` stops persisting
  `refines.json` and `refine-history.json`. Its RFC page reads refinements
  from trailmap's API for `mergeRefineHistory`, and `listRefines` and
  `listAudits` read from trailmap too (or the pages redirect to trailmap's;
  that is the story's call). ringo already reads trailmap over HTTP
  (`rfcStoryCount`, `spawnloop.go:2495`).

### Import, then removal

A trailmap script, run once on the box, walks `AUDITS_DIR` and the union of
`refine-history.json` and `refines.json`, and POSTs each item to the two
endpoints with its original time. It is idempotent: an existing
`(repo, slug, written_at)` or `(rfc_id, created_at)` is skipped. Driving the
import through the endpoints means no second write path to test, and no mount
of ringo's data dir into the container. After the import is verified and both
writers have switched, `AUDITS_DIR`, `auditsDir()`, the `getFs` code in
`audit.ts`, the dokku mount and `config.x.audits` are deleted.

### trails-side gaps

Only one framework gap was found that blocks this RFC:
`attach-touch-runs-commit-callbacks-on-a-second-instance` (0189, draft). trails
already provides the rest: the Disk service (`lib/service/disk-service.ts`),
`hasOneAttached` (`lib/attached/model.ts`), the tables migration,
`active_storage:install`, direct uploads, and the disk controller routes. Any
further gap found while building is a trails story in
`0209-activestorage-port` (or `0189-activerecord-surfaced-deviations` for an
AR cause), never a trailmap workaround (trailmap `CLAUDE.md`, "A framework bug
gets fixed in trails").

## Non-goals

- **`rfc-autorefine.json`.** This is ringo's auto-refine cooldown clock, which
  is loop state. It belongs with the rest of ringo's JSON state in 0136 Phase B
  ("Fleet state to tables", `rfcs/0136-trailmap/README.md:441`).
- **A Hub placement.** The operator ruled `Base`. The 0123 WIP's Hub wiring is
  dropped.
- **Variants, previews and analyzers.** Reports are text. No image processing
  is configured.
- **A cloud service.** Disk on the dokku `storage/` mount only (RFC 0215 is
  where S3/GCS live).
- **Serving every repository's audits on one page with filters.** `repo` is
  stored so that page can be built later. This RFC keeps today's single list.

## Alternatives considered

- **Text columns instead of attachments.** #151 stores `summary` as `text`,
  which would also work for audits. It was not chosen: the operator asked for
  Active Storage, `.html` audits are whole documents better served as blobs,
  and the proving-ground argument that justified the file exception applies
  even more strongly to Active Storage.
- **Direct upload from the scripts.** Rejected above. It adds two requests and
  a signed blob id for no gain at this size.
- **Mount ringo's data dir into trailmap for the import.** Rejected. The POST
  path already exists and is tested, and a second mount is exactly the
  coupling this RFC removes.
- **btwhooks forwards refine reports to trailmap.** This keeps
  `rfc-refine-done.sh` unchanged, but leaves ringo as a relay for data it no
  longer owns. Posting from the agent matches the audits path.
- **`deps-rfc: [0136-trailmap]`.** `deps-rfc` waits for the named RFC to
  close (tasks `src/ranking.ts:156`), and 0136 is a long-running epic. So this
  RFC names it under `related-rfcs` and takes story-level `deps` on the 0136
  stories it actually needs.

## Rollout

1. Framework — `attach-touch-runs-commit-callbacks-on-a-second-instance`
   (0189, trails), then `trailmap-bump-trails-for-activestorage`.
2. Schema — `tasks-cli-migrates-audit-refinement-and-active-storage-tables`
   (tasks repo), then `trailmap-configures-active-storage-on-base`.
3. Models — `trailmap-audits-to-activestorage`,
   `refinement-is-a-base-record-with-an-attached-summary` (after
   `rfc-page-refinements-tab`).
4. Ingest — `audits-create-endpoint-on-the-loopback-api`.
5. Writers — `audit-report-skill-posts-to-trailmap` (trails),
   `rfc-refine-done-posts-the-report-to-trailmap` (tasks),
   `btwhooks-reads-refinements-and-audits-from-trailmap` (btwebooks).
6. Import — `import-existing-audits-and-refine-reports`.
7. Retire — `retire-audits-dir-and-the-filesystem-audit-path`.

## Verification

- After the import, `Audit.count` equals the file count in every
  `~/.btwhooks/data/github/*/*/audits/` (88 today). `Refinement.count` equals
  293: the 258 history reports plus the 35 `refines.json` entries not in history.
  A re-run creates 0 rows.
- After the writers switch, a fresh `audit-report` run and a fresh
  `rfc-refine-done.sh` each create exactly one row, and no new file appears
  under `~/.btwhooks/data`.
- After retirement, `grep -rn "AUDITS_DIR\|auditsDir\|getFs" app config` in
  trailmap returns nothing, and `dokku storage:report trailmap` lists no
  `/audits` mount.

## Open questions

1. **trailmap#151's `RfcRefine` on Hub.** The PR is open and would land a
   Hub table that `refinement-is-a-base-record-with-an-attached-summary` then
   moves. Recommendation: retarget #151 onto `Base` before it merges (that
   needs the schema story first), or merge it as is and let the story move
   it. Also: keep the name `RfcRefine` / `rfc_refines`, or rename it to
   `Refinement` / `refinements` as this RFC's prompt proposed? The stories
   say `Refinement` and accept either.
2. **Auth beyond loopback.** `LoopbackOnly` is the existing mechanism, and
   both writers are on the box. Is a bearer token (`TRAILMAP_INGEST_TOKEN`)
   wanted as defence in depth? Recommendation: no, since it would be the only
   API endpoint with one.
3. **A soak with a file fallback.** Should `run.sh` keep writing the file when
   the POST fails, for a week of overlap? Recommendation: no. Fail loudly
   instead, so a broken ingest is noticed.
4. **The `grades` caller of `rfc-refine-done.sh`.** Store non-RFC refine
   reports (a nullable `rfc_id` plus a `subject`), or skip the trailmap POST
   for them? Recommendation: skip it, keeping ringo's handling until grades
   gets its own home.
5. **The 0123 story's claim.** `trailmap-audits-to-activestorage` still
   carries the 2026-11-09 claim and its now-resolved `blocked-by`. After
   merge: `pnpm tasks status-set trailmap-audits-to-activestorage draft` and
   release the claim.

## After merge

- `pnpm tasks rfc-status <this rfc> active` once the open questions are
  settled.
- Promote `attach-touch-runs-commit-callbacks-on-a-second-instance` from
  draft.
- Reset the moved story's state (Open question 5).

## Changelog

- 2026-11-17: initial RFC. Moves `trailmap-audits-to-activestorage` in from 0123.
