# Project TODO

## Phase 1: Foundation
- [x] Create shared seed data: workout templates from trainingData.ts
- [x] Create shared seed data: meal templates from menuData.ts
- [x] Define database schema (workout_logs, diet_logs tables)
- [x] Run migration SQL

## Phase 2: Backend
- [x] Implement db.ts helpers for workout/diet CRUD
- [x] Implement tRPC routers: workout.claim, workout.list, workout.update, workout.delete
- [x] Implement tRPC routers: diet.claim, diet.list, diet.update, diet.delete
- [x] Implement tRPC routers: data.export (JSON export)

## Phase 3: Frontend Layout
- [x] Create mobile-first layout with bottom navigation bar
- [x] Set up premium dark theme with elegant typography
- [x] Create routing structure (Dashboard, Workout, Diet, History)

## Phase 4: Dashboard
- [x] Build Dashboard home page with today's summary
- [x] Show claimed workout + meal at a glance
- [x] Quick-action prompts to log/edit
- [x] Streak and history overview

## Phase 5: Workout Module
- [x] Build workout template gallery (7 templates)
- [x] Build claim flow (select template → assign to date)
- [x] Build workout log editor (editable sets, weight, reps)
- [x] Support adding custom exercises

## Phase 6: Diet Module
- [x] Build diet template gallery (7 meal templates)
- [x] Build claim flow (select template → assign to date)
- [x] Build diet log editor (inline editable ingredients)
- [x] Save/persist edited diet items

## Phase 7: Data & Polish
- [x] Implement JSON export feature
- [x] Build history page with past records
- [x] Polish transitions and micro-interactions
- [x] Write vitest tests
- [x] Final testing and delivery

## Phase 8: Multiple workouts per day + weight units
- [x] Change workout claim to allow multiple templates per day (strength + cardio)
- [x] Update DB schema: workout_logs allows multiple rows per date
- [x] Update tRPC routers: workout.getByDate returns array, claim doesn't block if already claimed
- [x] Update Workout.tsx: show multiple claimed sessions, allow claiming additional templates
- [x] Update Home.tsx: show multiple workouts for today
- [x] Support weight unit (kg/lb/custom) per set
- [x] Update DB schema: add unit field to workout data JSON
- [x] Update Workout.tsx: add unit selector per set, display correct unit
- [x] Update tests for multiple workouts and weight units

## Phase 9: Inline completion toggle
- [x] Allow tapping set done checkbox in non-edit mode (auto-save per set)
- [x] Add visual feedback for completed sets/exercises

## Phase 11: Modify back workout template
- [x] Remove 弹力带面拉 from back template
- [x] Split 高位下拉 into 3 variations (wide/medium/narrow grip), 3 sets each
- [x] Remove 俯身哑铃后飞 from back template

## Phase 12: Auto-import last weight/reps
- [x] Add backend query to find last weight/reps per exercise name from history
- [x] On claim, auto-populate sets with last-used weight/reps (shown in gray)
- [x] Display imported values with gray styling to distinguish from new entries

## Phase 13: Collapsible workout sections
- [x] Add collapse/expand toggle per workout log on the Workout page

## Phase 14: UI improvements and exercise picker
- [x] Weight input step = 2.5 (up/down arrows)
- [x] Add duplicate/copy button per set row
- [x] Add 站姿二头哑铃弯举 to back_biceps template
- [x] Exercise picker: two-level list (type > exercise) + manual text input

## Phase 15: Complete-all button and history page improvements
- [x] Click "完成" button auto-marks all sets as done
- [x] History page: click a record to edit it
- [x] History page: group by date, show workout types under each date
