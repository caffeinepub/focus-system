# Focus System

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Hero section with title, subtitle, and CTA button
- Weight input form (Section 1: Initialize System)
- Daily Quest section with task list (push-ups, squats, sit-ups, walking) and complete buttons
- Progress system showing level, XP bar, and streak
- System messages panel
- Difficulty scaling info section (weekly +5% task increases)
- Motivational quote section
- Footer

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend
- Store user profile: weight, level, XP, streak, current week
- Store daily quest state: tasks with completion status and scaled amounts based on week
- Methods: saveWeight, getDailyQuest, completeTask, getProgress, resetDailyQuest
- XP system: completing all tasks grants 100 XP; leveling up requires 100 XP per level
- Streak: increments when all tasks completed daily
- Difficulty scaling: task amounts increase 5% per week

### Frontend
- Single-page RPG-themed dark dashboard
- Hero banner at top
- Weight input form that generates quest
- Quest board with 4 task cards, each with complete button
- Progress panel with XP bar, level, streak
- System messages list
- Difficulty scaling info card
- Motivational quote
- Footer
