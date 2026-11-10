import * as activerecord from "@blazetrails/activerecord";
import * as activesupport from "@blazetrails/activesupport";
import { Rfc } from "./rfc.js";
import { Story } from "./story.js";
import { StoryDep, StoryPackage, StoryPath, StoryRfcDep } from "./joins.js";
import { Event } from "./event.js";
import { Meta } from "./meta.js";
import { registerRfcAutoClose } from "../rfc-close.js";

// Association targets are named by STRING (`belongsTo("rfc")`,
// `hasMany("deps", { through: "storyDeps", source: "dependsOn" })`). Rails
// resolves those through constant autoloading; there is no autoloader here, so
// every model must be seated on `TopLevel` or resolution throws "uninitialized constant".
// Importing this barrel is what makes associations work — import it, not the
// individual model files, anywhere associations are traversed.
const models = { Rfc, Story, StoryDep, StoryRfcDep, StoryPath, StoryPackage, Event, Meta };

// The pin seats models with `registerModel([...])`; current trails deleted it
// (trails#9656) and resolves names through `TopLevel`, which the pin does not
// export. Both are honoured so `track-trails.sh` can smoke a candidate from
// this checkout, as src/migration-base.ts does for `Migration.get(8)`. The
// first real bump replaces this with `Object.assign(TopLevel, models)`.
const seating = { ...activerecord, ...activesupport } as unknown as {
  registerModel?: (models: unknown[]) => void;
  TopLevel?: object;
};
if (seating.TopLevel) Object.assign(seating.TopLevel, models);
else seating.registerModel?.(Object.values(models));

// Arms the RFC auto-close (see ../rfc-close.ts). Registered here rather than
// in story.ts so the rule can import the models it queries without an import
// cycle back through this barrel.
registerRfcAutoClose();

export { Rfc, RFC_STATUSES, type RfcStatus } from "./rfc.js";
export { Story, STORY_STATUSES, RESOLVED_DEP_STATUSES, type StoryStatus } from "./story.js";
export { StoryDep, StoryRfcDep, StoryPath, StoryPackage } from "./joins.js";
export { Event } from "./event.js";
export { Meta } from "./meta.js";
