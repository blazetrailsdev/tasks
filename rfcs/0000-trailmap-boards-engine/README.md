---
rfc: "0000-trailmap-boards-engine"
title: "trailmap boards: a Trello-shaped engine run beside the task domain, then cut over"
status: draft
created: 2026-11-11
updated: 2026-11-11
owner: "@deanmarano"
packages:
  - trailties
  - activerecord
  - actionpack
  - actionview
  - solid-queue
clusters:
  - engine
  - mirror
  - ui
  - cli
  - flip
  - retire
related-rfcs:
  - "0136-trailmap"
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — trailmap boards: a Trello-shaped engine run beside the task domain, then cut over

## Summary

Rebuild the task domain as a mountable trails engine, `Boards`, living in the
trailmap repository and mounted by trailmap. Its vocabulary is Trello's:
workspaces hold boards, boards hold lists, lists hold cards. An RFC becomes a
board, a story becomes a card, and a status becomes the list the card sits in.
The engine runs **in parallel** with today's RFC/story system: first as a
read-only mirror, then as the place new verbs are spelled, and only once an
equivalence gate has held does it become the source of truth. After that the
old tables are fed from it until nothing reads them, and then they are deleted.
At no point is there a single irreversible cutover.

## Motivation

- **Reuse.** The task domain is tied to one repo's conventions: RFC numbers,
  `est-loc`, trails package names. A generic board engine can be mounted by any
  trails app, and trailmap already serves several repos through the hub's
  `/:owner/:repo` hierarchy (`app/controllers/repo-projects-controller.ts`
  already calls an RFC "this domain's project board").
- **trails needs an engine in production.** `packages/actionmailbox/src/engine.ts`
  is the only `isolateNamespace` engine in trails, and no application mounts
  one. trailmap exists to find framework defects (trailmap `CLAUDE.md`, "A
  framework bug gets fixed in trails"). An engine with its own models,
  migrations, routes, views and database exercises:
  - `Engine` / `isolateNamespace` / `mount`;
  - installing an engine's migrations;
  - multi-database `connectsTo`;
  - engine-scoped `.tse` views and route helpers.
- **The prose/state split costs more than it buys.** Story prose lives in git
  and state lives in the DB. That needs `ingest`, `export`, the owned-fields
  guard, the `0000-` finalize dance, and a list of pitfalls agents keep hitting
  (hand-edited `status:` doing nothing, `tasks new` lint rollbacks, shared
  checkout resets). A DB-only model with a markdown snapshot export removes the
  whole category.
- **A board is a better UI for the queue.** It has drag-to-reorder, lists as
  status columns, and an action log. `events` already has the shape of Trello's
  `Action`.

## Design

### Where it lives

`engines/boards/` in the trailmap repo, as Rails lays out an in-app engine:
`Boards::Engine < Trails::Engine` with `isolateNamespace Boards`, mounted by
`config/routes.ts` at `/boards`.

The engine owns its own database: a `boards` entry in `config/database.ts`, a
SQLite file under `storage/`, and history in `db/boards_migrate`.
`Boards::ApplicationRecord` calls `connectsTo({ database: { writing: "boards" } })`.

A separate file means that during phases 1–2:

- the engine never touches `tasks.db`;
- the `write-protocol.ts` table-owner map does not change;
- dropping the file resets the experiment at no cost.

### Data model

| Model                     | Trello     | Columns (beyond timestamps)                                                                                                                                              | Today                              |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `Workspace`               | Workspace  | `name`, `repo` (string; the hub's repo name, no cross-DB join)                                                                                                           | the repo scope (`repo-scope.ts`)   |
| `Board`                   | Board      | `id` (string, = RFC id), `number`, `slug`, `name`, `desc`, `state` (draft/active/postponed/closed/superseded), `position`, `supersededBy`, `closedReason`, `workspaceId` | `rfcs`                             |
| `List`                    | List       | `boardId`, `name`, `role`, `position`                                                                                                                                    | the `status` enum                  |
| `Card`                    | Card       | `id` (string, = story id), `boardId`, `listId`, `name`, `desc`, `position`, `estLoc`, `archived`, `claimedAt`                                                            | `stories`                          |
| `Label` / `CardLabel`     | Label      | `workspaceId`, `kind` (`cluster` / `package`), `name`                                                                                                                    | `cluster`, `story_packages`        |
| `Member` / `CardMember`   | Member     | `name`                                                                                                                                                                   | `assignee`                         |
| `Attachment`              | Attachment | `cardId`, `kind` (`pr` / `path`), `ref`                                                                                                                                  | `pr`, `story_paths`                |
| `CardRelation`            | —          | `cardId`, `targetType` (`Card` / `Board`), `targetId`, `kind` (`dependsOn`)                                                                                              | `story_deps`, `story_rfc_deps`     |
| `Comment`                 | Comment    | `cardId`, `author`, `text`                                                                                                                                               | `blocked_by`, `closed_reason` text |
| `Checklist` / `CheckItem` | Checklist  | `cardId`, `name`, `position`, `checked`                                                                                                                                  | acceptance-criteria prose          |
| `Action`                  | Action     | `type`, `actor`, `boardId`, `cardId`, `data` (JSON)                                                                                                                      | `events`                           |

Four decisions inside that table:

- **Ids are preserved.** A card's id is the story id and a board's id is the RFC
  id. Every existing reference stays valid while both systems run:
  - `deps:` lists;
  - `Closes-story:` trailers;
  - `RFC 0197` citations in code;
  - btwhooks/ringo state.
- **A list has a `role`.** The roles are `draft`, `ready`, `claimed`,
  `in-progress`, `blocked` and `done`; `closed` is `archived: true` plus a
  comment. Verbs and ranking resolve a list by role, never by name, so renaming
  a list in the UI cannot change what `ready` means. A board is seeded with one
  list per role.
- **Dependencies are first-class.** Trello has none, but the ready queue is a
  dependency query, so `CardRelation` is not optional.
- **Ordering.**
  - `Board.position` replaces RFC priority.
  - `Card.position` replaces story priority. It is a float, so a drag writes
    one row.
  - The migration maps today's integer priorities onto positions that keep the
    ready queue's order. The equivalence gate (below) proves it.

### Phases

The authority is one row in the engine's `meta` table: `authority = tasks |
boards`. Every writer reads it. Flipping it, and flipping it back, is the
cutover and its rollback.

1. **Mirror (authority = tasks).**
   - `Boards::MirrorJob` reads the task domain through trailmap's existing
     `Story` / `Rfc` / `Event` models and upserts boards, lists, cards, labels,
     relations and attachments by id.
   - Card and board `desc` come from the stored document body
     (`20261030000009_add_body_to_documents`).
   - A full reconcile runs nightly, and an incremental pass replays `events`
     since a stored cursor every minute (Solid Queue recurring).
   - The board UI is read-only.
   - Nothing that agents use changes.
2. **New verbs, old writes (authority = tasks).**
   - The CLI gains `tasks card …` / `tasks board …` verbs.
   - trailmap gains `/api/cards/*` routes.
   - Both translate to today's verbs (`card move X --to done --pr trails#N`
     is `done X --pr trails#N`).
   - Agents, skills and CLAUDE.md move to the new words one PR at a time
     while the old system still does every write.
3. **Flip (authority = boards).**
   - Mutations write `Boards` models.
   - `Boards::ReverseMirrorJob` writes the old tables from them, so the
     `index.json` / `events.json` read models, ringo and every old-verb caller
     keep working unchanged.
   - Card writes from the UI (drag, edit, comment, checklist) are enabled
     only here.
   - Rollback is flipping `authority` back: the forward mirror resumes from
     its cursor.
4. **Retire.**
   - Once the old verbs and old tables have had zero readers for 14 days
     (measured from `Action.actor` and the read-model fetch log), delete:
     - the reverse mirror;
     - `ingest` / `export`;
     - the markdown-owned fields;
     - the old verbs.
   - `rfcs/` becomes a read-only snapshot written by a markdown export of
     boards.

### Prose

Prose lives only in the DB, with a markdown snapshot export. During phases 1–2
the markdown in this repo is still the source and the mirror copies it, so
`desc` is read-only in the UI. From phase 3, `desc` is edited by verb
(`tasks card edit <id> --desc-file F`) or in the UI. Each edit is an `Action`
carrying the before and after text, which replaces git history for prose. A
scheduled export commits the snapshot here.

### The equivalence gate

The ready queue, `next-bundle`, `list` and `show` must answer identically from
`Boards` and from `Story` over one database. This is the same idea as
trailmap's `pnpm gate`, applied to a new port. It runs:

- in CI against a fixture copy of `tasks.db`;
- nightly against the live mirror, mailing any drift.

It is the condition for entering phase 3, and it keeps running through phase 3
in the reverse direction.

## Non-goals

- **Trello API compatibility.** The names are Trello's; the REST shapes and
  power-ups are not.
- **Multi-tenant auth.** Boards inherits trailmap's loopback/session model.
- **Rich content.** No card covers, image attachments or ActionText. An
  `Attachment` is a PR ref or a path.
- **Rewriting ranking.** `move-ranking-onto-story-scopes` (RFC 0136) does that.
  Boards ports whatever is current and gates against it.

## Alternatives considered

- **Hard cutover.** Rejected by the operator on 2026-11-11: we operate both
  systems and cut over only after the new one has proven itself.
- **One board per repo, with an RFC as a label.** Loses the RFC's own status,
  priority and owner. An RFC is a body of work with a lifecycle, which is a
  board.
- **Engine as a package in the trails monorepo.** Rejected for now. The
  operator placed it in trailmap. It can be extracted once it has been mounted
  and run.
- **Engine tables in `tasks.db`.** This would make two writers per file during
  phases 1–2 and couple the experiment's resets to the live database.

## Rollout

1. Engine: `boards-engine-skeleton`, `boards-schema-and-models`
2. Mirror: `boards-mirror-full-reconcile`, `boards-mirror-incremental-from-events`, `boards-equivalence-gate`
3. Read-only UI: `boards-workspace-and-board-pages`, `boards-card-page`
4. New verbs: `boards-card-api-routes`, `boards-card-verbs-in-the-cli`, `boards-adopt-card-terms-in-agent-docs`
5. Flip: `boards-authority-switch`, `boards-reverse-mirror`, `boards-ui-writes`, `boards-flip-and-rollback-drill`
6. Retire: `boards-markdown-snapshot-export`, `boards-retire-the-story-system`

## Verification

- **Phases 1–2:** the equivalence gate reports 0 differing rows in the ready
  queue, `next-bundle`, `list` and `show` on 14 consecutive nightly runs.
- **Phase 3:** the rollback drill flips `authority` to `boards` and back, and
  then forward again, with 0 differing rows after each flip.
- **Phase 4:** 0 calls to an old verb and 0 reads of `index.json` /
  `events.json` for 14 days, then the `stories` / `rfcs` tables are dropped.

## Open questions

1. **Ordering semantics.** Does `Card.position` stay per list, as in Trello,
   with a global ready order derived from (board position, card position)? Or
   does a separate global `queuePosition` live on the card? Recommendation:
   derive the order. Map today's priorities into positions, and let the gate
   decide whether a separate field is needed.
2. **Which story statuses get lists.** Is `draft` a list, or a board-level
   staging area? Recommendation: a list with role `draft`, which keeps the
   mapping one-to-one.
3. **Checklists from acceptance criteria.** Should the mirror parse
   `## Acceptance criteria` checkboxes into a `Checklist`, or leave them in
   `desc` until phase 3? Recommendation: parse them in the mirror, read-only.
   That is the cheapest test that the field earns its place.
4. **CLI transport.** RFC 0136 makes the CLI an HTTP client of trailmap
   (`move-mutation-verbs-onto-the-models`). This RFC assumes that has landed
   before phase 2, and `boards-card-api-routes` depends on it.
5. **Engine extraction.** Should the engine move to a trails package after
   phase 4, so `trails new` apps can mount it? This is deferred to a follow-up
   RFC.

## Changelog

- 2026-11-11: initial RFC
