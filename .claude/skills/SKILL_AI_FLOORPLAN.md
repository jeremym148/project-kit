# Skill: AI Floor Plan Analysis with Claude Vision

## Purpose
Best practices for using Claude Vision API to analyze 2D floor plan images and extract structured architectural data (walls, doors, windows, rooms).

## API Call Pattern

```typescript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,  // floor plans need verbose output
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
        { type: "text", text: FLOOR_PLAN_PROMPT }
      ]
    }]
  })
});
```

## Prompt Engineering for Floor Plans

### Key principles:
1. **Demand JSON only** — explicitly say "no markdown, no backticks, no explanation"
2. **Give calibration hints** — if the image has area annotations (10.23 m²), tell the model to use them for dimension estimation
3. **Specify coordinate system** — origin, units, grid snap value
4. **Request labels** — for debugging and room identification
5. **Handle multi-language** — Israeli plans have Hebrew, French plans have French, etc.

### Effective prompt structure:
```
1. Role: "You are an expert architectural floor plan analyzer"
2. Task: "Extract ALL walls, doors, and windows"
3. Format: Exact JSON structure with examples
4. Calibration: "Use room area annotations to verify dimensions"
5. Vocabulary: Translate domain terms (ממ"ד = safe room, etc.)
6. Rules: Wall connectivity, coordinate constraints, completeness
7. Expected output size: "An apartment typically has 15-30+ wall segments"
```

### Common failure modes and fixes:

| Problem | Solution |
|---------|----------|
| Only detects exterior walls | Explicitly say "include ALL interior partition walls" |
| Wrong scale | Provide area annotations as calibration data |
| Missing small rooms (bathrooms) | Say "detect rooms as small as 2m²" |
| Walls don't connect | Say "walls MUST share endpoints at corners" |
| Returns markdown | Triple-emphasize "ONLY JSON, no markdown" |
| Misses doors/windows | Describe visual representations: "arcs = doors, parallel lines = windows" |
| Wrong coordinate origin | Specify "origin (0,0) at top-left of floor plan" |

## Response Parsing

### Robust JSON extraction:
```typescript
function parseAIResponse(text: string): FloorPlanData {
  // Step 1: Strip markdown fences
  let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  
  // Step 2: Try direct parse
  try { return JSON.parse(clean); } catch {}
  
  // Step 3: Extract JSON object from mixed content
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  
  // Step 4: Try fixing common JSON issues
  clean = clean
    .replace(/,\s*}/g, '}')      // trailing commas
    .replace(/,\s*]/g, ']')      // trailing commas in arrays
    .replace(/'/g, '"');           // single quotes
  
  try { return JSON.parse(clean); } catch {}
  
  throw new Error("Could not parse AI response as JSON");
}
```

### Data validation:
```typescript
function validateFloorPlan(data: any): data is RawFloorPlanData {
  if (!data.walls || !Array.isArray(data.walls) || data.walls.length === 0) return false;
  return data.walls.every(w => 
    typeof w.x1 === 'number' && typeof w.y1 === 'number' &&
    typeof w.x2 === 'number' && typeof w.y2 === 'number'
  );
}
```

### Converting AI output to app data model:
```typescript
function convertToFloorPlan(raw: RawFloorPlanData): FloorPlan {
  const walls = raw.walls.map(w => createWall(
    snap(w.x1), snap(w.y1), snap(w.x2), snap(w.y2), w.label
  ));
  
  const openings: Opening[] = [];
  
  raw.doors?.forEach(d => {
    if (d.wallIndex >= 0 && d.wallIndex < walls.length) {
      openings.push(createDoor(
        walls[d.wallIndex].id,
        clamp(d.position || 0.5, 0.05, 0.95),
        d.width || 0.9
      ));
    }
  });
  
  raw.windows?.forEach(w => {
    if (w.wallIndex >= 0 && w.wallIndex < walls.length) {
      openings.push(createWindow(
        walls[w.wallIndex].id,
        clamp(w.position || 0.5, 0.05, 0.95),
        w.width || 1.2
      ));
    }
  });
  
  return { walls, openings };
}
```

## Multi-language Support

### Hebrew architectural terms (Israeli plans):
```
סלון = living room       חדר שינה = bedroom
מטבח = kitchen           אמבטיה = bathroom
שירותים = toilet/WC       ממ"ד = safe room (mamad)
מרפסת = balcony          כניסה = entrance
מסדרון = corridor        מחסן = storage
הערכה = evaluation area   תוספת חדר = room addition
חדר כביסה = laundry       פינת אוכל = dining area
```

### Dimension annotations:
Israeli plans often show `1\n10.23` meaning "1 room, 10.23 m²". The AI should use these areas to calibrate wall positions.

## UX Best Practices

### Progress feedback:
Show 3 stages: "Sending to AI..." → "Analyzing structure..." → "Building digital plan..."

### Background image overlay:
After AI import, display the original image at 20% opacity behind the 2D plan so users can visually verify and correct the AI output.

### Error recovery:
If AI fails, show the error but keep the uploaded image. Let user retry or manually trace over the reference image.

## Iteration Tips

### Improving detection accuracy:
1. Keep prompts in a separate `prompts.ts` file for easy iteration
2. Log raw AI responses during development for debugging
3. Test with 5+ diverse floor plan types (simple, complex, Israeli, European)
4. A/B test prompt variations by measuring wall count accuracy
5. Consider a 2-pass approach: first detect rooms, then trace walls
