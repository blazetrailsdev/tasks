---
title: "trailmap: every autoloaded app/ file defines its constant"
status: in-progress
updated: 2026-11-03
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps:
  - zeitwerk-seats-a-second-module-instance-under-vitest
deps-rfc: []
est-loc: 300
priority: null
pr: trailmap#112
claim: "2026-11-03T20:59:19Z"
assignee: "trailmap-app-files-define-their-constants"
blocked-by: null
closed-reason: null
---

## Context

Trails since 945a06ff5b raises Zeitwerk::NameError when an autoloaded file defines no constant matching its name, as Rails does. These 21 trailmap files under app/ export only functions or values, so an eagerLoad=true boot (production) fails on them:

- app/jobs/index.ts -> Index
- app/models/compare-stats.ts -> CompareStats
- app/models/deploy-log.ts -> DeployLog
- app/models/joins.ts -> Joins
- app/models/parity-refresh.ts -> ParityRefresh
- app/models/rfc-close.ts -> RfcClose
- app/models/rfc-status.ts -> RfcStatus
- app/models/index.ts -> Index
- app/serializers/parity-json.ts -> ParityJson
- app/controllers/concerns/api-params.ts -> ApiParams
- app/controllers/concerns/viewer.ts -> Viewer
- app/models/concerns/backlog.ts -> Backlog
- app/models/concerns/effective-status.ts -> EffectiveStatus
- app/models/concerns/elapsed.ts -> Elapsed
- app/models/concerns/ranking.ts -> Ranking
- app/models/concerns/repo-scope.ts -> RepoScope
- app/models/concerns/rfc-marks.ts -> RfcMarks
- app/models/concerns/rfc-progress.ts -> RfcProgress
- app/models/concerns/search.ts -> Search
- app/models/concerns/semantic-validation.ts -> SemanticValidation
- app/models/stats-sync/index.ts -> Index

## Acceptance

- Each file defines its constant, moves out of the autoload paths, or is ignored as Rails would (autoloaders.main.ignore).
- zeitwerk:check passes, and the next trails bump boots.
