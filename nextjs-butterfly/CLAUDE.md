# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run lint         # Run ESLint
npm run storybook    # Start Storybook on port 6006
npm run build-storybook  # Build static Storybook
```

## Architecture

This is a Next.js 15 browser game built with PixiJS 8 for rendering. A cat rescues butterflies trapped in bubbles while avoiding bees.

### Entity-Component System (ECS)

The game uses a lightweight ECS pattern in `app/game/`:

- **EManager** (`entities/EManager.ts`): Central registry that creates entities with unique IDs (format: `EntityType_N`) and manages their components
- **CTypes** (`components/CTypes.ts`): Component types including `Movement`, `Graphics`, `Prison`, `Animation`
- **Entity types**: `Bee`, `Butterfly`, `Cat`, `Bubble`, `Cloud`, `Bush` (flowers), `World`, `Hud`

### Game Loop & Systems

- **Level** (`worlds/Level.ts`): Creates entities, sets up the world, runs the game loop via `gameState.levelGameLoop`
- **movementSystem** (`systems/movementSystem.ts`): Main update loop - handles input, entity movement, collision detection, bubble popping
- **gameState** (`systems/gameState.ts`): Global mutable state object for score, lives, pause state, dialog state, speed factor

### Input Handling

- **KeyboardListener** (`systems/KeyboardListener.ts`): Populates `keyMap` object with arrow keys and space
- **TouchListener** (`systems/TouchListener.ts`): Mobile touch controls

### Rendering

- Each entity has a `Graphics` component implementing `EGraphics.render(movement)`
- **World** (`entities/World.ts`): Background, grass animation, contains all game entities
- Assets loaded in `app/page.tsx`: SVGs for bees/clouds/flowers, spritesheets for butterflies/cats/bubbles

### Level Configuration

`worlds/LevelSettings.ts` defines:
- `levelConfigList`: Array of level configs (bees, flowers, butterflies count, bee speed)
- `allButterflyData`: Butterfly species with Finnish names, prevalence weights, unlock levels

### React Layer

- `app/page.tsx`: Main entry, initializes PixiJS, loads assets, starts levels
- `app/dialogs/`: React dialog components for start, pause, level complete, game over
- `app/components/`: UI components like ActionButton, TouchControls

## Code Style

- ESLint with `unused-imports` plugin enabled (warns on unused imports/vars)
- `@typescript-eslint/no-explicit-any` is disabled
- Prefix unused variables with `_` to suppress warnings
