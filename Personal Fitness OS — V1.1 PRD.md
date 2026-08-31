# Personal Fitness OS — V1.1 PRD

## 1. Product Objective

Build a local-first personal fitness planning, logging, nutrition planning, grocery planning, and review web application for a single user.

The system should minimize the cognitive and operational cost of maintaining a sustainable fitness routine.

Long-term objectives:

- Height baseline: 188 cm
- Current weight baseline: approximately 76 kg
- Current body fat estimate: approximately 18–19%
- Long-term body weight target: approximately 80 kg
- Long-term body fat target: approximately 14%
- Physique priority: wider shoulders, thicker chest/back, visible abs, athletic appearance
- Primary sports: swimming and tennis
- Secondary conditioning: boxing
- Strength training: minimum effective dose for physique, health, injury resilience, and sports performance
- Strong functional core
- Sustainable long-term adherence
- Low-friction nutrition and grocery management

The application is not intended to automate training or nutrition decisions.

It should:

1. Store the current plan.
2. Make daily logging fast.
3. Perform deterministic calculations.
4. Visualize meaningful trends.
5. Generate weekly summaries.
6. Generate standardized AI Review packages.
7. Convert nutrition targets into simple meal templates.
8. Convert meal templates and weekly plans into actionable grocery lists.

---

# 2. Core Product Philosophy

The product should behave as a personal fitness control system:

Plan  
→ Execute  
→ Log  
→ Measure  
→ Review  
→ Adjust

High-frequency data collection should not imply high-frequency decision-making.

Daily data is collected.

Weekly data is summarized.

Material changes to training or nutrition should normally be considered during biweekly reviews.

---

# 3. Training Phases

The application must support configurable training phases.

## Phase 0 — Reconditioning

Default duration: 6 weeks.

Objectives:

- Re-establish regular strength training
- Restore swimming capacity
- Learn freestyle technique
- Restore tennis frequency
- Establish nutrition and tracking habits
- Establish baseline energy requirements
- Avoid injury and excessive fatigue

During this phase, nutrition is partly a calibration exercise.

Do not aggressively optimize weight loss during the first weeks.

## Phase 1 — Recomposition / Cut

Objectives:

- Reduce body fat from approximately 18–19% toward 14–15%
- Maintain or increase lean mass
- Continue strength progression
- Maintain swimming and tennis performance

Target weight-loss rate should generally be modest.

Weight stability is acceptable when:

- waist circumference is decreasing
- physique is improving
- strength/performance is improving

## Phase 2 — Lean Gain

Objectives:

- Gradually increase lean mass
- Progress toward approximately 80 kg
- Maintain reasonable body-fat control
- Continue sports performance development

The user must manually approve phase changes.

---

# 4. Default Weekly Training Architecture

Default Phase 0:

### Monday
- Strength A
- Optional easy swim / freestyle technique

### Tuesday
- Tennis

### Wednesday
- Swimming
- Optional core

### Thursday
- Strength B
- Optional easy swim

### Friday
- Tennis

### Saturday
- Strength C
- Optional boxing or swimming

### Sunday
- Recovery swim, mobility, or complete rest

General rule:

Normally schedule only one primary high-stress session per day.

Multiple sessions are allowed, but secondary sessions should normally be easy or technical.

---

# 5. Strength Program

Strength philosophy:

Use minimum effective training volume.

Strength training exists to support:

- physique
- muscle retention/growth
- general health
- sports performance
- tissue resilience

The goal is not powerlifting performance.

## Strength A

- Back Squat or Hack Squat — 3 × 5–8
- Bench Press or Machine Chest Press — 3 × 6–10
- Lat Pulldown or Pull-up — 3 × 6–10
- Lateral Raise — 3 × 10–15
- Cable Crunch — 3 × 8–15

## Strength B

- Romanian Deadlift — 2–3 × 6–10
- Incline Dumbbell Press — 3 × 6–10
- Chest-Supported Row — 3 × 8–12
- Bulgarian Split Squat — 2–3 × 8–12 per side
- Rear Delt Fly or Face Pull — 3 × 10–15
- Pallof Press — 3 × 8–12 per side

## Strength C

- Leg Press or Front Squat — 3 × 8–12
- Pull-up or Lat Pulldown — 3 × 6–10
- Machine or Dumbbell Chest Press — 3 × 8–12
- Lateral Raise — 3 × 10–15
- Calf Raise — 3 × 8–15
- Hanging Knee Raise or Leg Raise — 3 × 8–15

Exercises and alternatives must be editable.

For every strength set record:

- exercise
- weight
- repetitions
- RIR
- optional notes

Support double progression.

Phase 0 initial intensity:

Weeks 1–2:
- approximately 3–4 RIR

Weeks 3–6:
- approximately 2–3 RIR

Do not encourage routine training to failure.

---

# 6. Core Training

Core training should distinguish:

- flexion
- anti-extension
- anti-rotation
- rotation / rotational power

Core work should normally occur approximately three times per week rather than requiring daily abdominal workouts.

Support progressive overload for core exercises.

Example movements:

- Cable Crunch
- Hanging Leg Raise
- Ab Wheel
- Pallof Press
- Cable Chop
- Medicine Ball Rotation

---

# 7. Sports Logging

## Swimming

Record:

- date
- total distance
- duration
- stroke composition
- freestyle distance
- longest continuous freestyle distance
- session RPE
- session type
- notes

Session types:

- Easy aerobic
- Technique
- Interval
- Recovery

Initial objective:

Restore comfortable 1–2 km swimming capacity.

Freestyle milestone:

Comfortable continuous 1 km freestyle.

During freestyle learning, technique takes priority over distance or pace.

## Tennis

Record:

- duration
- session RPE
- session type
- notes

Types:

- Rally
- Coaching
- Serve Practice
- Match
- Mixed

Initial minimum:

2 sessions/week.

Third session is optional.

## Boxing

Record:

- duration
- session RPE
- Coaching / Bag / Other
- notes

Boxing is optional conditioning.

It should not count toward minimum weekly adherence.

No separate mandatory HIIT program is required while overall sports load is sufficient.

---

# 8. Body Metrics

Support:

- body weight
- waist circumference
- body-fat estimate
- optional progress photo reference

Weight should support:

- daily measurement
- 7-day moving average
- 14-day change
- 28-day trend

Preferred weigh-in protocol:

Morning, after bathroom, before food/drink, same scale.

Body-fat percentage should always be presented as an estimate.

Do not overreact to individual measurements.

---

# 9. Nutrition System

Nutrition should be designed around low-friction consistency rather than meal-plan complexity.

Core architecture:

Nutrition Targets  
→ Meal Templates  
→ Weekly Meal Plan  
→ Grocery List  
→ Actual Intake  
→ Biweekly Calibration

---

# 10. Initial Nutrition Targets

Initial protein target:

140–150 g/day.

Initial fat guideline:

approximately 60–70 g/day.

Carbohydrates should remain flexible and should support training performance.

Do not implement a low-carbohydrate default.

Support configurable daily targets for:

- calories
- protein
- carbohydrates
- fat
- fruit servings
- vegetable servings

Calories and carbohydrate targets must remain editable because Phase 0 is used to calibrate actual energy requirements.

---

# 11. Standard Home Diet

Create a default "Standard Home Diet" template.

Current baseline foods:

- Chicken breast: approximately 300–350 g raw weight/day
- Eggs: approximately 3/day
- Milk: approximately 500 ml/day
- Whey protein: approximately 1 scoop/day
- Rice: configurable based on carbohydrate requirement
- Vegetables: mixed
- Fruit: approximately 2 servings/day

Food quantities must be editable.

Food weights should preferably use raw weight where practical.

Do not hard-code rice intake based on an unspecified rice-cooker cup.

The user should be prompted once to weigh the actual amount of uncooked rice contained in the commonly used rice-cooker cup.

Store that value as:

`rice_cup_grams`

This allows future logging to support either:

- grams
- rice-cooker cups

while internally calculating nutrition using grams.

---

# 12. Protein Diversification

The Standard Home Diet may remain intentionally repetitive to minimize preparation cost.

However, support configurable substitution rules.

Default guideline:

Replace chicken with fatty fish approximately twice per week.

Examples:

- salmon
- mackerel
- sardines

The purpose is dietary diversity and omega-3 intake.

Do not require a complex rotating recipe system.

---

# 13. Fruit and Vegetable Rules

Default fruit target:

2 servings/day.

Fruit type does not need to be fixed.

Examples:

- banana
- apple
- orange
- kiwi
- peach
- watermelon
- dragon fruit
- berries

Default vegetable guideline:

multiple servings daily with regular variety.

Encourage diversity across the week, including:

- leafy greens
- cruciferous vegetables
- carrots/root vegetables
- mushrooms
- peppers
- eggplant and other vegetables

The system should prioritize adherence and variety rather than precise micronutrient optimization.

---

# 14. Training-Day Nutrition Classification

Support:

- Low Carb Day
- Medium Carb Day
- High Carb Day

The classifications should be configurable.

Suggested conceptual mapping:

Low:
- rest
- recovery activity
- very easy swimming

Medium:
- strength training
- moderate swimming

High:
- long tennis
- hard swimming
- boxing
- multiple meaningful training sessions

The actual carbohydrate quantities should be configurable and calibrated from real-world results.

Do not automatically reduce protein on low-training days.

---

# 15. Social Meals

Support explicit logging of:

`Social Meal`

Social meals should not be treated as failures or cheat meals.

Record optionally:

- meal type
- approximate size
- high-fat flag
- alcohol
- optional notes

Default behavior should not require detailed calorie counting for every restaurant meal.

The system should instead help identify frequency and patterns.

The user currently reports little/no alcohol, snacks, or strong preference for sugary foods.

The primary dietary overconsumption risk is high-fat food.

---

# 16. Meal Templates

Create a Meal Templates feature.

A template should contain:

- name
- ingredients
- ingredient quantities
- nutrition estimate
- preparation notes
- meal count / portions

Initial template:

`Standard Rice Cooker Meal`

Concept:

Rice + chicken breast + vegetables cooked together, with eggs prepared separately.

The user should be able to modify ingredients without creating a new template from scratch.

Meal templates should support scaling.

Example:

1 portion  
2 portions  
3 days of meal prep

Scaling must automatically update ingredient quantities and grocery requirements.

---

# 17. Weekly Meal Planning

Implement a lightweight weekly nutrition planner.

The user should not be required to specify every dish for every meal.

Primary inputs:

- planning period, default 7 days
- expected home meals
- expected social meals
- training schedule
- Low / Medium / High Carb days
- meal templates

The planner should calculate approximate food requirements.

The system should allow quick overrides.

Example:

Expected social meals this week: 3

The grocery calculation should reduce home-meal requirements accordingly.

---

# 18. Grocery Generator

Implement a first-class Grocery feature.

Primary action:

`Generate Grocery List`

Inputs:

- date range
- expected home meals
- expected social meals
- current nutrition targets
- current training plan
- carb-day classifications
- meal templates
- substitution rules
- optional current inventory

Output should group items into practical shopping categories.

Example:

## Protein

- Chicken breast
- Salmon
- Eggs
- Milk
- Whey

## Carbohydrates

- Rice
- Bananas
- Other fruit

## Vegetables

- Leafy vegetables
- Broccoli
- Carrots
- Eggplant
- Mushrooms

## Other

Configurable additional items.

---

# 19. Nutrition Units vs Shopping Units

The system must distinguish:

`nutrition_unit`

from:

`shopping_unit`

Example:

Chicken breast:

Nutrition:
- grams

Shopping:
- 1 kg pack

Milk:

Nutrition:
- ml

Shopping:
- 1 L carton

Eggs:

Nutrition:
- individual egg

Shopping:
- 12-egg pack

Example generated output:

Chicken breast  
Required: 1,850 g  
Suggested purchase: 2 × 1 kg packs

Milk  
Required: 3,500 ml  
Suggested purchase: 4 × 1 L cartons

Eggs  
Required: 21  
Suggested purchase: 2 × 12 packs

Round shopping quantities upward where appropriate.

Shopping-unit definitions must be editable.

---

# 20. Inventory

Inventory tracking is optional in V1 but the data model should support it.

Possible fields:

- food
- quantity available
- unit
- expiry date
- frozen / refrigerated / pantry

If inventory is entered, Grocery Generator may calculate:

Required quantity  
− Current inventory  
= Purchase quantity

Do not make inventory maintenance mandatory.

The application must remain useful if inventory is completely unused.

---

# 21. Grocery Checklist

Generated grocery lists should function as mobile-friendly shopping checklists.

Support:

- check/uncheck item
- required quantity
- suggested purchase quantity
- category
- optional notes

Provide:

`Mark Shopping Complete`

Shopping history may be retained locally.

The interface should be optimized for quick use on a phone.

---

# 22. Nutrition Calibration

The first weeks of Phase 0 should explicitly be treated as a calibration period.

Track:

- actual food intake
- estimated calories
- protein
- carbohydrates
- fat
- body weight
- waist
- hunger
- training performance
- training volume
- recovery

Do not assume a formula-derived TDEE is exact.

Use real-world longitudinal data.

Potential interpretations:

Weight approximately stable  
+ Waist decreasing  
+ Strength improving

→ likely successful recomposition; do not automatically reduce calories.

Weight dropping rapidly  
+ Strength/recovery deteriorating

→ likely excessive energy deficit.

Weight and waist increasing persistently

→ likely energy intake exceeds current objective.

Material calorie changes should normally be considered during review rather than automatically implemented.

---

# 23. Recovery / WHOOP

Support manual or imported daily data for:

- HRV
- resting heart rate
- sleep duration
- sleep consistency
- WHOOP Recovery
- WHOOP Strain
- VO2max estimate

WHOOP metrics should be treated primarily as longitudinal indicators.

Do not generate strong recommendations from a single daily reading.

Emphasize:

- rolling averages
- baseline deviation
- multi-day trends

---

# 24. Subjective Recovery

Optional daily fields:

- fatigue: 1–5
- soreness: 1–5
- motivation: 1–5
- hunger: 1–5
- perceived sleep quality: 1–5
- notes

These should be extremely fast to enter.

---

# 25. Dashboard

The dashboard must emphasize information hierarchy.

Top:

Current Phase

Example:

Phase 0 — Reconditioning  
Week 2 / 6

## Body

- current weight
- 7-day average weight
- waist
- body-fat estimate
- trends

## Training

Current week:

- strength completed / planned
- swimming sessions
- swimming distance
- tennis sessions
- tennis hours
- boxing
- total training duration

## Performance

Configurable benchmark metrics:

- squat
- bench
- pulling movement
- longest continuous freestyle distance

## Nutrition

Display only high-value metrics:

- protein adherence
- calorie trend
- current carb-day classification
- fruit/vegetable adherence

## Recovery

- sleep trend
- HRV trend
- resting HR trend
- WHOOP Recovery trend

Avoid displaying every available metric on the main dashboard.

---

# 26. Daily Log

Daily logging should be optimized for minimum friction.

One daily view should allow entry of:

## Body
- morning weight

## Training
- session(s)
- duration
- RPE
- strength details where applicable

## Nutrition
- Standard Home Diet used?
- modifications
- Social Meal?
- estimated macros if available
- fruit
- vegetables

## Recovery
- WHOOP data
- subjective recovery

Use sensible defaults and previously used values.

---

# 27. Weekly Summary

Generate a deterministic weekly summary containing:

- training adherence
- body-weight trend
- waist trend
- strength progression
- swimming volume
- freestyle progress
- tennis volume
- boxing volume
- total training time
- nutrition adherence
- social meal count
- recovery trends

No LLM is required.

---

# 28. Biweekly AI Review Export

Primary action:

`Export AI Review`

Generate Markdown and JSON if practical.

Review package:

## Period

Start and end date.

## Current Phase

Phase and week.

## Body Composition

- average weight
- weight trend
- waist trend
- body-fat estimate trend

## Training

- strength adherence
- major exercise progression
- swimming volume
- freestyle progression
- tennis volume
- boxing
- total training load

## Recovery

- average sleep
- HRV trend
- resting HR trend
- WHOOP Recovery
- WHOOP Strain
- subjective fatigue

## Nutrition

- estimated calorie intake
- protein adherence
- carbohydrate-day distribution
- fruit/vegetable adherence
- social meals
- hunger trend

## Calibration

Where sufficient data exists:

- observed body-weight rate of change
- waist change
- relationship between intake and weight trend
- possible energy-balance interpretation

## User Notes

Free-form observations.

Append this review request:

1. Assess body-composition progress.
2. Assess training progression and balance.
3. Assess accumulated fatigue and recovery.
4. Assess nutrition adequacy.
5. Assess whether calorie/carbohydrate targets require adjustment.
6. Identify meaningful risks or anomalies.
7. Recommend adjustments only where supported by trends.
8. Define the most important priorities for the next two weeks.

AI recommendations must not automatically modify the plan.

---

# 29. Data Storage

V1 must be local-first.

No backend required.

Use an appropriate structured browser-side data store.

Critical:

`Export All Data`

`Import All Data`

JSON should be the canonical backup format.

The export must include:

- settings
- phases
- training plans
- training history
- body measurements
- nutrition
- meal templates
- grocery configuration
- grocery history
- WHOOP/recovery data
- subjective data

---

# 30. Architecture

V1:

Static frontend  
→ Local data store  
→ Deterministic calculation engine  
→ Nutrition/meal planning engine  
→ Grocery generator  
→ Dashboard/charts  
→ JSON import/export  
→ AI Review export

No LLM API integration in V1.

Potential V2:

Frontend  
→ Serverless backend  
→ LLM API

Never expose an LLM API key in client-side code.

---

# 31. Navigation

Recommended primary navigation:

Dashboard  
Plan  
Log  
Nutrition  
History  
Review  
Settings

## Dashboard

Current state and trends.

## Plan

- current phase
- weekly schedule
- strength programs
- nutrition targets

## Log

Fast daily logging.

## Nutrition

Sub-navigation:

- Today
- Meal Templates
- Weekly Plan
- Grocery

## History

Historical charts and sessions.

## Review

- Weekly Summary
- Biweekly AI Review
- Export AI Review

## Settings

- goals
- exercises
- foods
- nutrition targets
- shopping units
- metrics
- import/export

---

# 32. UX Requirements

The application should work well on both desktop and mobile.

Daily logging and Grocery Checklist are particularly important on mobile.

Prioritize:

- low number of taps
- useful defaults
- fast repeated entry
- clear visual hierarchy
- trend visualization
- editable configuration

Avoid unnecessary gamification.

The user should not feel required to "maintain the system."

The system exists to reduce fitness-management overhead.

---

# 33. Product Principles

## Low Friction

Daily tracking should require minimal time.

## Standardize Repetitive Decisions

Repeated meals, grocery requirements, and routine training should be templated.

## Preserve Flexibility

Social meals, recreational sports, and schedule changes should not be treated as failures.

## Trend Over Noise

Use rolling averages and longitudinal patterns.

## Minimum Necessary Metrics

Do not collect data merely because it exists.

## Minimum Effective Training

Do not maximize gym volume.

## Performance and Physique Coexist

Body composition, strength, swimming, tennis, recovery, and nutrition belong to one integrated system.

## Human in the Loop

Software calculates.

AI analyzes.

The user decides.

## Local Ownership

All historical data must remain exportable in a human-readable structured format.

---

# 34. V1 Non-Goals

Do not implement:

- user accounts
- social features
- public profiles
- coaching marketplace
- automatic AI plan modification
- complex recipe recommendation
- automatic restaurant calorie estimation
- large external food database integration
- real-time wearable synchronization
- detailed inventory management requirements
- gamification
- achievements
- leaderboards

WHOOP API integration and embedded AI should remain future extensions.

---

# 35. Implementation Priority

Codex should implement V1 in this order:

### P0 — Foundation
- application shell
- local data model
- settings
- import/export

### P1 — Training
- Plan
- strength programs
- sports logging
- daily log

### P2 — Body & Recovery
- body metrics
- WHOOP fields
- subjective recovery
- trend calculations

### P3 — Nutrition
- nutrition targets
- foods
- Standard Home Diet
- meal templates
- carb-day classifications

### P4 — Grocery
- weekly meal planning
- grocery calculation
- shopping-unit conversion
- mobile checklist

### P5 — Dashboard
- high-value metrics
- charts
- current-phase status

### P6 — Review
- weekly deterministic summary
- biweekly AI Review package
- Markdown/JSON export

### P7 — Polish
- mobile UX
- fast entry
- sensible defaults
- validation
- empty states
- backup/restore UX

Do not spend substantial effort on visual polish before P0–P6 workflows function end-to-end.