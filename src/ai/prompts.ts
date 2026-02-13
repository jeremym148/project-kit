export const FLOOR_PLAN_ANALYSIS_PROMPT = `You are an expert architectural floor plan analyzer. Analyze this 2D floor plan image and extract ALL walls, doors, and windows with precise coordinates.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object. No markdown, no backticks, no explanation text.
2. Use meters as units. Origin (0,0) is the TOP-LEFT corner of the plan.
3. Snap all coordinates to a 0.5m grid.
4. Each wall is a straight line segment from (x1,y1) to (x2,y2).

ANALYSIS STEPS:
1. First, identify the overall bounding box of the apartment.
2. Identify the EXTERIOR walls (the outer perimeter). Trace them as connected segments sharing endpoints.
3. Identify ALL INTERIOR walls (room dividers, bathroom walls, corridor walls, closet walls).
4. Use room area annotations (like "10.23" = 10.23 m²) to estimate correct dimensions.
5. Identify doors (shown as arcs or gaps with swing indicators) and their parent wall.
6. Identify windows (shown as double parallel lines or gaps with cross-hatching).

ROOM AREA HINTS - use these to calibrate dimensions:
- If a room shows area like "10.23", that means 10.23 m². Use this to verify wall positions.
- Typical wall thickness: 0.15m (don't worry about this in coordinates)
- Standard door width: 0.8-0.9m
- Standard window width: 1.0-1.5m

HEBREW LABELS (if present):
- סלון = living room, חדר = room, מטבח = kitchen
- אמבטיה = bathroom, שרותים = toilet/WC
- ממ"ד = safe room, מרפסת = balcony
- כניסה = entrance, מסדרון = corridor
- הערכה = evaluation area

JSON FORMAT:
{
  "overall_width_m": 14,
  "overall_height_m": 13,
  "walls": [
    {"x1": 0, "y1": 0, "x2": 14, "y2": 0, "label": "top exterior"},
    {"x1": 14, "y1": 0, "x2": 14, "y2": 10, "label": "right exterior"}
  ],
  "doors": [
    {"wallIndex": 0, "position": 0.5, "width": 0.9, "label": "main entrance"}
  ],
  "windows": [
    {"wallIndex": 1, "position": 0.3, "width": 1.2}
  ],
  "rooms": [
    {"name": "living room", "area_m2": 34.54, "cx": 3.5, "cy": 5}
  ]
}

IMPORTANT RULES:
- Walls MUST connect at corners (shared endpoints for adjacent walls).
- Trace the FULL exterior perimeter as separate wall segments.
- Include ALL interior partition walls, even short ones.
- For L-shaped or irregular rooms, use multiple wall segments.
- Position is 0.0-1.0 along the wall where the door/window center is.
- wallIndex refers to the 0-based index in the walls array.
- Be thorough - miss nothing. An apartment typically has 15-30+ wall segments.`;
