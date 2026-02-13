# 🏗️ FloorPlan Studio — Claude Code Starter Kit

## What's in this kit

```
project-kit/
├── README.md                ← You are here
├── INIT_PROMPT.md           ← Main prompt to paste into Claude Code
├── CLAUDE.md                ← Project instructions (goes in repo root)
├── prototype.jsx            ← Working prototype (900+ lines, all features)
└── skills/
    ├── SKILL_THREEJS_ARCHITECTURE.md  ← 3D rendering patterns
    ├── SKILL_CANVAS2D_EDITOR.md       ← 2D canvas editor patterns  
    ├── SKILL_AI_FLOORPLAN.md          ← AI floor plan analysis
    └── SKILL_ZUSTAND_FLOORPLAN.md     ← State management patterns
```

## How to use

### Step 1: Setup Claude Code project
```bash
mkdir floorplan-studio && cd floorplan-studio
```

### Step 2: Copy skills into the project
```bash
mkdir -p .claude/skills
cp skills/*.md .claude/skills/
cp CLAUDE.md .
```

### Step 3: Open Claude Code
```bash
claude
```

### Step 4: Paste the init prompt
Copy the content from `INIT_PROMPT.md` and paste it. Claude Code will scaffold the entire project structure.

### Step 5: Paste the prototype
When Claude Code asks for the prototype, paste the content of `prototype.jsx`.

### Step 6: Iterate with follow-up prompts
The `INIT_PROMPT.md` file contains pre-written follow-up prompts for:
- Undo/redo
- Wall snapping (magnetic corners)
- Furniture placement
- Improved 3D realism
- Export features

## Skills explained

The skills in `skills/` are reference docs that Claude Code can read to produce better code. They contain:

**SKILL_THREEJS_ARCHITECTURE.md** — How to set up Three.js for architectural rendering: lighting, materials, wall building with opening cutouts, scene diffing for performance, camera controls.

**SKILL_CANVAS2D_EDITOR.md** — How to build the 2D canvas editor: coordinate systems, renderers as pure functions, hit testing, drawing architectural elements (walls, doors, windows), pan/zoom, interaction state machine.

**SKILL_AI_FLOORPLAN.md** — How to use Claude Vision API for floor plan analysis: prompt engineering, response parsing, Hebrew support, error recovery, iteration tips.

**SKILL_ZUSTAND_FLOORPLAN.md** — State management patterns: two-store architecture, undo/redo with zundo, cascade delete, selector patterns for performance, cross-store actions.
