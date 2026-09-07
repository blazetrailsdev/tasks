---
rfc: "0136-trailmap"
title: "trailmap: one application owns the task domain"
status: active
created: 2026-09-02
updated: 2026-09-04
owner: "@deanmarano"
packages:
  - actionpack
  - actionview
  - trailties
  - activerecord
clusters: []
priority: 1
---

# RFC 0136 — trailmap: one application owns the task domain

## Summary

The RFC/story domain — models, ready-queue ranking, mutation verbs, ingest —
is implemented three times today, in three processes, in two languages. This
RFC gives it one home: **trailmap**, a trails application that owns `tasks.db`
and serves both the dashboard HTML and a JSON API over HTTP. The `tasks` CLI
moves into trailmap and becomes a thin HTTP client — trailmap's `bin/rails` —
leaving `blazetrailsdev/tasks` as pure content. ringo's Go process drops its
hand-written read model and becomes a client too. `index.json` and
`events.json`, which exist only because the Go side cannot call the CLI, are
deleted.

The name is the job: a trail map shows the whole route — where it goes, what is
behind you, and which way to head next. That is what the fleet asks this
application every time it spawns an agent.

trailmap has a second purpose, equal to the first: it is **the proving ground
for trails**. It is a real application with real users and a real deployment,
built on the port, and every gap it hits becomes a story against the framework.
Expect this RFC to generate more trails work than trailmap work.

## Motivation

### The domain is already ActiveRecord, it just has no application

`blazetrailsdev/tasks/src/models/` is real trails code: `Story extends Base`
with `rfc_id`, `status`, associations to deps, packages and events, against a
vendored `@blazetrails/activerecord` at a pinned commit. Beside it:

| File               | Lines | What it is                                        |
| ------------------ | ----- | ------------------------------------------------- |
| `src/ranking.ts`   | 431   | Ready-queue ordering and bundle packing           |
| `src/ingest.ts`    | 397   | Markdown frontmatter to DB                        |
| `src/verbs.ts`     | 290   | `claim`, `release`, `block`, `close`, `statusSet` |
| `src/authoring.ts` | 178   | `tasks new` — write file, commit, ingest          |
| `src/readmodel.ts` | 165   | DB to the published JSON                          |

That is a Rails app's `app/models` and `app/services` living in a CLI's `src/`,
with domain logic in free functions beside the models instead of on them.
`ranking.ts` documents the resulting awkwardness itself: it must call the ready
queue `claimable()`, because `Story.ready()` is taken by the `enum` and means
something weaker — "conflating them would hand agents unclaimable stories".

### The read model is copied twice more

`src/db.ts` states the mechanism plainly:

> btwhooks' Go side reads these files off disk (`spawnloop.go:1042`,
> `rfccharts.go:244`) rather than talking to this CLI, so they are the
> published interface and must be refreshed synchronously — a mutation that
> doesn't republish is invisible to the spawn loop until the next one does.

Every mutation therefore republishes `index.json` + `events.json` into the main
worktree. Two classes of bug from that are documented in the source: mutations
republishing into a worktree copy and leaving the canonical file stale, and
readers observing a half-written file (fixed with temp-file + rename).

It failed often enough that ringo abandoned the JSON and now reads SQLite
directly — `btwebooks/webhook/tasksdb.go`, whose header says:

> So the DB is the source of truth here too. [...] which also keeps the shapes
> below honest: they must reproduce `readmodel.ts` exactly, because the same
> structs are filled either way.

Roughly 400 lines of Go hand-reproducing a TypeScript read model, by
convention, with nothing enforcing it.

**This RFC's own drafting hit the failure it describes.** Prioritising RFC 0104
began by reading `rfcs/0104-*/stories/*.md`, which reported 37 stories, all
`draft`, under a `draft` RFC. The database said 40 `ready` under an `active`
RFC, with the story named as the hard blocker already merged. Every fact from
the markdown was wrong, because `status` is DB-owned and the files are stale.

### The cost

- **Three readers/writers on one SQLite file**: the CLI from every agent
  worktree, the CLI inside the btwhooks container, and the Go process.
- **Domain rules with no single home.** "A dep is satisfied when it is `done`
  OR `closed`" lives in `models/story.ts`; the ready queue that depends on it
  lives in `ranking.ts`; the Go spawn loop re-derives adjacent conclusions.
- **A published-JSON interface** that is a permanent source of staleness bugs,
  maintained solely because there is no way to ask a running process a
  question.

One fix addresses all three: one process owns the database and answers
questions about it.

## Design

### trailmap: a trails application

`blazetrailsdev/trailmap` exists and boots. It is `trails new` output laid out
the way Rails lays out an app:

```text
app/models/          Rfc, Story, Event, StoryDep, StoryPackage (+ domain logic)
app/controllers/     HTML pages and the JSON API
app/views/           .tse templates
config/application.ts, config/routes.ts, config/database.ts
db/migrate/          moved from tasks/db/migrate
```

**Model logic lives on the models.** `ranking.ts` becomes scopes and class
methods on `Story` (`Story.claimable()`, bundle packing); `verbs.ts` becomes
instance methods and transactions (`story.claim(assignee)`); `readmodel.ts`
disappears, because serializing is what a controller does. `ingest.ts` and
`authoring.ts` become service objects, since they touch the git checkout.

trailmap is the **sole writer** of `tasks.db` and owns the migrations.

### trailmap is the proving ground for trails

Parity percentages measure whether a method exists. They do not measure whether
the pieces are connected, and that is the gap trails keeps falling into. RFC
0104 named it exactly: its failures "were almost entirely **integration**
failures, not porting failures. Individually-correct modules had never been
connected." Nothing finds that except an application that has to actually run.

trailmap is that application, and it is a better proving ground than an example
app for three reasons:

- **It cannot be abandoned when it gets hard.** The fleet depends on it, so a
  gap must be fixed rather than worked around.
- **It exercises the unglamorous surface.** Not a tutorial's happy path but
  deployment, migrations against a live database, a CLI client, sixty routes,
  markdown rendering, and an app that has to survive a redeploy.
- **A regression is felt immediately.** trailmap dispatches the port's own
  work, so a broken framework stops the agents who would fix it. That is a
  sharp incentive and a real hazard — see the bootstrapping open question.

**This is already how it has gone.** A single boot probe against a generated
app — `trails new`, add a route, a controller and a `.tse` view, request `/` —
produced six framework stories in an afternoon:

| Story                                          | Outcome     |
| ---------------------------------------------- | ----------- |
| `generated-app-cannot-render-its-own-views`    | done, #7364 |
| `implicit-render-204s-instead-of-rendering`    | done, #7364 |
| `generated-vite-config-makes-root-unreachable` | done, #7371 |
| `generated-vite-outdir-nested-in-publicdir`    | done, #7374 |
| `undeclared-node-23-floor-breaks-lts`          | open        |
| `generated-app-dependencies-cannot-install`    | open        |

None was visible from parity counts. Each was found by running the thing.

#### The discipline this depends on

The proving ground only works if trailmap refuses to paper over what it finds:

- **A framework gap becomes a story, not a workaround.** File it against the
  RFC that owns the surface — 0104 while it is app-enablement, a new RFC
  otherwise — with the reproduction that found it.
- **Bespoke replacements for framework surface are the failure mode.** A
  hand-rolled resolver or dispatcher inside trailmap hides exactly the gap this
  is meant to expose. Where trailmap must carry a workaround to keep running,
  it is commented with the story that will remove it.
- **Vendoring is what makes that safe.** trailmap pins a trails commit, so a
  gap is diagnosed against a known tree and a fix is adopted deliberately
  rather than arriving mid-incident.

The two workarounds trailmap carries today are both of that shape: vendored
tarballs standing in for unpublished packages, and a pinned Node 24, each
tracked by an open story above.

### The repo split

- **`trailmap`** — all the code: models, migrations, controllers, views,
  services, **and the `tasks` CLI**.
- **`blazetrailsdev/tasks`** — content only: `rfcs/**/*.md` plus a thin
  syntactic-validation `scripts/`. No `src/`, `bin/`, `db/` or `vendor/`.
- **`btwebooks`** — unchanged in shape, reduced in scope.

The CLI belongs with the application it drives, not with the prose it edits:
`bin/tasks` in trailmap is `bin/rails` in a Rails app, sharing request and
response types with the controllers that serve it.

### Consuming trails

`@blazetrails/*` is unpublished, so trailmap vendors immutable tarballs packed
from a pinned trails commit — `vendor/*.tgz`, `vendor/TRAILS_PIN`, and
`scripts/vendor-trails.sh` adapted from the tasks repo. A framework bump is one
script run plus a commit, so a regression cannot land in trailmap unnoticed.

Two constraints found while standing this up, both now encoded in the repo:

- **pnpm 11 ignores `pnpm.overrides` in `package.json`.** The overrides must
  live in `pnpm-workspace.yaml`; the `package.json` form 404s against the
  registry on a cold install. The tasks repo appears to work only because its
  lockfile is current and pnpm skips resolution entirely — deleting its
  lockfile would reproduce the failure.
- **Node 24+ is required.** `@blazetrails/rack` uses ES2025 duplicate named
  capture groups, which throw a `SyntaxError` at import on Node 20 and 22.

### The database moves

`tasks.db` currently lives in the tasks repo's git common dir so every worktree
resolves the same file (`db-path.ts:71`) — a workaround for many processes
needing to agree on a path, unnecessary with a single writer. It moves to
trailmap's own persistent storage.

Two mechanisms dissolve with it: `db-path.ts`'s `gitCommonDir` /
`resolveTasksDir` / `mainWorktree` resolution, and its hand-written mirror in
`webhook/tasksdb.go`. "Which checkout am I in" stops being a question the task
system has to answer.

### One HTTP listener

Plain HTTP on `:8080`, serving both audiences from the same routes and
controllers, `Accept`-negotiated between HTML and JSON:

- **The dashboard** — routed by dokku on the public hostname, behind SSO.
- **The JSON API** — for the CLI and ringo's Go process, on loopback,
  bypassing the SSO that fronts the public hostname.

HTTP rather than a unix socket because the Go process already speaks it, `curl`
debugs it without special flags, and a new consumer needs no bind mount.
Binding the API to **loopback only** keeps the exposure cost near zero while
everything is on one box. If it ever needs to be reachable off-box, that is the
moment to add a token.

The CLI takes its base URL from `TRAILMAP_URL`, defaulting to loopback.

### The CLI moves into trailmap and becomes a client

`bin/tasks` keeps its argument parsing, usage text and output formatting —
everything a person sees. It loses `db.ts`, `models/`, `verbs.ts`,
`ranking.ts`, `readmodel.ts`, `db-path.ts` and the vendored ActiveRecord. Each
verb becomes one HTTP request.

**This is what makes the move possible.** Today the CLI must live beside the
database because it _is_ the data access layer: it needs a checkout with
`node_modules`, a vendored `tsx`, and cwd-based resolution of which working
tree it acts on. As an HTTP client it needs only a URL.

Four call sites change:

| Caller               | Today                                                                           | After                                                 |
| -------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| trails' `pnpm tasks` | `scripts/tasks/tasks.sh` probes four locations for a checkout with `bin/tasks`  | Execs the installed binary; the probe list is deleted |
| `tasks` on `PATH`    | Installed by `start-worktree.sh` into a tasks checkout                          | Installed from trailmap; location-independent         |
| ringo's Go process   | Resolves `tasksCLIRel` + a vendored `tsx`, then shells out (`mergesweep.go:85`) | An HTTP request; no `tsx` spawning in the container   |
| trails' `CLAUDE.md`  | "The `tasks` CLI itself lives in the tasks repo"                                | Points at trailmap                                    |

**No offline fallback.** If trailmap is down the CLI is down and the fleet
stops. This is a real regression — today any worktree can mutate the DB
unilaterally — accepted because both already run on one box and share a failure
domain, and because a read-only fallback would resurrect the second read model
this RFC exists to delete. The mitigation is a restart policy and a health
check, not a second code path.

### Authoring and ingest move into the app

trailmap owns the tasks checkout and both verbs. `tasks new` becomes a POST:
trailmap writes the story markdown, commits it and ingests it in one operation
— which is what `authoring.ts:83-177` already does in-process, including the
deliberate `git add <file>` rather than `git add -A`. One writer for both files
and database means they cannot diverge. This requires the checkout to be
writable with a git identity, the same arrangement the btwhooks container
already has.

### Splitting validation along the same line

`scripts/validate-lib.mjs` holds both markdown-shape rules and domain rules —
and `src/readmodel.ts:16` already imports `effectiveStoryStatus` from it, so
the application reaches into the content repo's lint scripts for a rule about
what a story's status _means_.

| Stays in `tasks`                                                                                 | Moves to trailmap                                                                                                          |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Syntactic validation: frontmatter parses, required keys, enum values, markdownlint. No database. | Semantic validation: `effectiveStoryStatus`, cross-story dep resolution, RFC-lifecycle rules — these are model validations |
| `finalize-rfc.mjs`, `lib.mjs`, `sync-rfcs.sh`                                                    | `build-index.mjs`, `import.ts`, `migrate.ts`, `reconcile.mjs`, `equivalence*.ts`, `vendor-trails.sh`, `install-bin.sh`     |

The split is forced: trailmap binds to loopback, so GitHub Actions cannot reach
it. Content CI must be self-contained, so it can only check what a single file
proves about itself. Everything relational is enforced at ingest.

**This split is interim** — it exists because GitHub is the gate. If trailmap
goes on to host the content repo, the gate becomes a receive hook that has the
database, and the two halves collapse into one implementation. Build the
syntactic half to be deleted, not to be lived with.

### ringo's Go process

Keeps `/webhooks/github`, the two SSE streams, the tmux socket work, the spawn
loop and the `:8081` internal mux. Deletes `webhook/tasksdb.go` and asks the
API instead. Dashboard pages migrate one at a time; nothing migrated can break
anything not yet migrated.

## Non-goals

- **Mounting the Go app as a rack app.** The original framing. It needs a
  proxying rack app and puts the fleet's webhook ingest behind new trails code
  on day one. Two apps side by side is the same strangler with the risk
  inverted.
- **Porting `/webhooks/github` or the SSE streams.** They stay on Go: the
  ingest is the critical path with tmux and git side effects.
- **`stats.db`.** Sessions, costs, grades, parity and velocity stay Go-owned.
- **Hosting the content repo.** Designed for, but a follow-on RFC — a git
  backend plus a review flow is its own project, and the domain consolidation
  should not wait behind it.
- **Publishing `@blazetrails/*` to npm.** Vendoring works now.
- **Retiring the Go process.** Not in scope.

## Alternatives considered

- **A unix socket for the CLI.** Unreachable by construction, and the
  established idiom here — it is how ringo reaches tmux. Rejected because every
  consumer is already an HTTP client and loopback closes most of the gap.
- **Keep the CLI as the writer, add a read-only API.** Halves the change but
  keeps two writers on one SQLite file, and the write path is where the
  staleness bugs come from.
- **Make the tasks repo itself the application.** The models, migrations and
  pin already live there. Rejected to keep a content repo humans and agents
  edit as prose separate from a deployed application.
- **Single hostname via a mounted rack app.** If one hostname is wanted later,
  path-based routing in the Go app's `nginx.conf.d/` achieves it with a
  location block per migrated page and no trails-side proxy.

## Rollout

**Framework prerequisites and the skeleton are done.** RFC 0104 delivered the
Node HTTP handler (#7244, which streams rather than buffering), the
application-boot chain, view resolution and implicit render (#7364), and the
generated asset config (#7371, #7374, #7378). A boot probe against a generated
app confirmed the full chain — routing, controller, implicit render, `.tse`,
layout — returns rendered HTML. `blazetrailsdev/trailmap` is scaffolded on
vendored packages, serves the show and list pages against the live database,
and its ready queue is gated byte-for-byte against the CLI's.

### Build out before cutting over

The original order was domain move, then CLI cutover, then Go retirement, then
pages — deletions second and pages last. **That is inverted.** Pages and the
proving-ground work come first; every irreversible step is gated behind a soak.

The reason is the one this RFC already states and then underweights: the
cutover has **no offline fallback by design**. If trailmap is down the CLI is
down and the fleet stops. That trade is acceptable only once trailmap has
already been the thing everyone opens for long enough that its failure modes
are known ones. Cutting over to prove it works gets the order backwards, and
the blast radius is the fleet that would have to fix it.

The build-out is also where the RFC's second purpose actually pays. A phase
that deletes Go code yields no framework stories; a phase that makes trails
hold a response open and stream a live tmux pane yields many. Deleting
`tasksdb.go` is the reward, not the work.

| Phase | What | Exit criterion |
| ----- | ---- | -------------- |
| **A. Freeze** | No move, no delete. Go keeps serving everything; trailmap runs beside it. | The six cutover stories stay `blocked`. |
| **B. Read-only parity** | Every task-domain page ringo serves is served by trailmap and gated against ringo's output over the whole database. | Each page's gate green in CI. |
| **C. Tmux reading** | The pane and session surface: archive index, transcripts, the terminal replay, live streaming. | Rendered pane matches Go's over a corpus of real logs. |
| **D. Beyond parity** | Surface ringo never had — search, dependency graphs. Purpose is framework yield, not features. | Trails stories filed per surface. |
| **E. Soak** | trailmap **is** the dashboard on the public hostname; Go still serves loopback, webhooks and SSE. | Two weeks, no unfixed incident, explicit owner sign-off. |
| **F. Cutover** | Domain move completion, CLI as HTTP client, authoring and ingest, export, the database move, stripping the tasks repo, deleting the published JSON and the Go read model. | — |

**No story in phases A–E deletes or moves anything.** Every one of them is
additive and runs beside ringo, so any of them can be abandoned mid-flight
without the fleet noticing. The six phase F stories are `blocked` with a reason
naming `soak-trailmap-as-the-fleet-dashboard`, and that story's sign-off is the
only thing that unblocks them — explicitly, by the RFC owner, not automatically
on the calendar.

**Phase F's internal order is unchanged** from the original rollout: the domain
move, then the API and CLI cutover with all four call sites updated in one
change so `tasks` never resolves to two implementations, then the Go
read-model retirement. What changed is when it starts, not what it does.

Then, as its own RFC: trailmap hosts the content repo, the receive hook becomes
the gate, and the interim validation split collapses.

### What is deliberately out of the build-out

`/graphs/parity`, `/graphs/cost` and `/grades` read `stats.db`, which this
RFC's non-goals leave Go-owned. They are not part of phase B parity, and
"trailmap serves every ringo page" is not the goal — trailmap serving every
**task-domain** page is. `/audits` is the one file-backed exception, included
because serving a directory of agent-supplied files is exactly the unglamorous
surface the proving ground is for.

## Verification

- **Phase B, per page.** A gate diffs trailmap's output against ringo's over
  the live database, for every task-domain page and every `/spawnloop/*` read
  endpoint in scope. This is the same shape as the ready-queue equivalence gate
  that already made the domain move safe (`scripts/equivalence.ts`) — that gate
  is the precedent, and every page repeats it.
- **Phase C.** The pane renderer agrees with `webhook/paneterm.go` byte for
  byte over a committed corpus of **real** captured logs, including at least
  one full-length agent session. Unit tests prove the cases ringo's tests name;
  only the corpus proves the 4 MB inline-repaint input the fleet actually
  produces. A tolerated difference needs a named reason in the gate's source,
  never a silenced assertion.
- **Phase D.** Framework stories filed, with the reproduction that found them.
  This is the deliverable, not a side effect: a phase D story that files
  nothing has been built around the framework rather than on it, and should say
  in its PR why not.
- **Phase E.** Two weeks serving the public hostname, every phase B and C gate
  green throughout, incidents recorded with the story that fixed each. Nothing
  is deleted during the soak. An unfixed incident fails it.
- **Phase F.** As originally stated: every `tasks` verb leaves identical DB
  state and prints identical stdout through the API; `blazetrailsdev/tasks`
  contains only `rfcs/**/*.md`, a syntactic `scripts/` and repo metadata, with
  content CI still failing a malformed frontmatter block **with no network
  access**; and `webhook/tasksdb.go`, `readmodel.ts`, `db-path.ts`,
  `scripts/tasks/tasks.sh`'s probe list, `index.json` and `events.json` all
  deleted — the metric is those line counts reaching zero.
- **Framework yield.** Trails stories filed because trailmap hit them, and how
  many close, reported per phase.

## Open questions

- **`/graphs/velocity` reads the tasks repo's git log as an event stream**
  (btwebooks README: "Every tasks-CLI mutation is one commit whose subject is
  the verb it ran"). But only `tasks new` still commits (`authoring.ts:170`);
  the status verbs are DB-only since the SQLite cutover, and `verbs.ts:5-6`
  describes commit-per-mutation in the past tense. Either that doc is stale or
  something else is committing. Resolve before deleting anything: the `events`
  table is the intended replacement.
- **Does anything besides ringo and the CLI read `index.json`?** It is a
  published file in a git repo; assume nothing, check before deleting.
- **Markdown rendering.** `webhook/markdown.go` has no trails counterpart. An
  ordinary npm library in the app is fine — trails' fidelity rules govern the
  framework, not its consumers — but worth stating rather than assuming.
- **Bootstrapping.** trailmap serves the story pages that spawn-loop agents use
  to work on trailmap. The apps are independently deployable and Go keeps
  serving each page until its replacement is verified — is that enough, or
  should trailmap be off-limits to the spawn loop?
