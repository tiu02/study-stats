## Transcript Highlights

### 1. Color preset fixes (Session 5, mid)
Claude suggested color presets for the assignments and session cards, which I overturned since they were not distinctive enough from each other (indigo, blue, purple too close in values), as well as removing its suggestion of using red, green, and yellow for color presets. While testing it visually on browser, RGY was too visually overwhelming, especially considering the confusion with it closely overlapping with the urgency and status color indicators (complete green, caution amber, error red).

### 2. Revising Pomodoro to be integrated (Session 4, early)
Originally, pomodoro timer was a stub, standalone page. I changed this so there would be better user flow with timer being integrated into assignments.

### 3. Intuitive search/sort/filter (Phase 9, late)
Claude first tried making the search, filter and sort all into one section dropdown. I overturned and explained the layout I wanted, how it was supposed to behave, as well as instruct for custom components and data selectors for the dropdowns and calendar, which required alot of iterative prompting.

### 4. Debugging sort via Firestore composite indexes (6, mid)
During debugging an issue of multiple sessions the same day defaulting to midnight, interrupting sort by time behavior. Asking Claude, it quickly identified and fixed an error swallowing catch that caused loss in debugging visibility, which then allowed me to access the error message with Firestore link for pre-filled composite indexes.

### 5. Highlight (Session, stage)

