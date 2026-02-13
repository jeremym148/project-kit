import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

// ─── Data Model ───
let idCounter = 0;
const uid = (prefix) => `${prefix}-${++idCounter}-${Math.random().toString(36).substr(2, 4)}`;
const createWall = (x1, y1, x2, y2, label) => ({ id: uid("w"), type: "wall", x1, y1, x2, y2, thickness: 0.15, height: 2.8, color: "#e8e0d4", label });
const createDoor = (wallId, position = 0.5, width = 0.9) => ({ id: uid("d"), type: "door", wallId, position, width, height: 2.1 });
const createWindow = (wallId, position = 0.5, width = 1.2) => ({ id: uid("win"), type: "window", wallId, position, width, height: 1.2, sillHeight: 0.9 });

const GRID_SIZE = 0.5;
const SCALE = 50;
const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;
const toScreen = (v) => v * SCALE;
const toWorld = (v) => v / SCALE;

// ─── Israeli Apartment Plan (manually traced) ───
const israeliApartment = () => {
  const w = [];
  // EXTERIOR - Balcony (18m²)
  w.push(createWall(1.5, 0, 8, 0, "balc-top"));
  w.push(createWall(8, 0, 8, 2.5, "balc-right"));
  w.push(createWall(1.5, 0, 1.5, 2.5, "balc-left"));
  // EXTERIOR - Main building
  w.push(createWall(0, 2.5, 14, 2.5, "main-top"));
  w.push(createWall(14, 2.5, 14, 10.5, "right"));
  w.push(createWall(14, 10.5, 10, 10.5, "bottom-right"));
  w.push(createWall(10, 10.5, 10, 13.5, "addition-right"));
  w.push(createWall(10, 13.5, 0, 13.5, "bottom"));
  w.push(createWall(0, 13.5, 0, 2.5, "left"));
  // INTERIOR - Main vertical dividers
  w.push(createWall(7, 2.5, 7, 5.5, "div-v1-top"));
  w.push(createWall(7, 5.5, 7, 10.5, "div-v1-bot"));
  w.push(createWall(10.5, 2.5, 10.5, 5.5, "div-v2-top"));
  w.push(createWall(10.5, 5.5, 10.5, 10.5, "div-v2-right"));
  // INTERIOR - Horizontal dividers
  w.push(createWall(7, 5.5, 10.5, 5.5, "div-h1"));
  w.push(createWall(10.5, 5.5, 14, 5.5, "div-h1-right"));
  w.push(createWall(0, 8, 7, 8, "div-h-living"));
  w.push(createWall(7, 9, 10.5, 9, "div-h-bath-bot"));
  w.push(createWall(10.5, 9, 14, 9, "div-h-right-bot"));
  // INTERIOR - Bathrooms
  w.push(createWall(8, 5.5, 8, 9, "bath-left"));
  w.push(createWall(9.5, 5.5, 9.5, 9, "bath-right"));
  w.push(createWall(8, 7, 9.5, 7, "bath-divider"));
  // INTERIOR - Entry / Kitchen area
  w.push(createWall(1.5, 8, 1.5, 9.5, "entry-right"));
  w.push(createWall(0, 9.5, 3.5, 9.5, "kitchen-bot"));
  w.push(createWall(3.5, 8, 3.5, 10.5, "kitchen-right"));
  // INTERIOR - Bottom dividers
  w.push(createWall(0, 10.5, 10, 10.5, "div-h-bottom"));
  w.push(createWall(4.5, 10.5, 4.5, 13.5, "safe-room-div"));
  // INTERIOR - Small room (2.38m²)
  w.push(createWall(7, 9, 7, 10.5, "small-left"));
  w.push(createWall(9, 9, 9, 10.5, "small-right"));

  // DOORS
  const doors = [];
  doors.push(createDoor(w[0].id, 0.5, 1.2));     // balcony entrance
  doors.push(createDoor(w[3].id, 0.12, 0.9));     // main entrance (left side)
  doors.push(createDoor(w[9].id, 0.6, 0.9));      // living to room 10.23
  doors.push(createDoor(w[11].id, 0.6, 0.9));     // room 10.23 to 11.37 corridor
  doors.push(createDoor(w[14].id, 0.3, 0.8));     // to bathrooms
  doors.push(createDoor(w[21].id, 0.4, 0.8));     // bathroom door top
  doors.push(createDoor(w[21].id, 0.8, 0.8));     // bathroom door bottom
  doors.push(createDoor(w[10].id, 0.25, 0.9));    // living to center room
  doors.push(createDoor(w[12].id, 0.3, 0.9));     // corridor to right room 11.9
  doors.push(createDoor(w[18].id, 0.5, 0.9));     // to right bottom room 6.65
  doors.push(createDoor(w[16].id, 0.3, 0.8));     // entry area
  doors.push(createDoor(w[25].id, 0.5, 0.9));     // to safe room
  doors.push(createDoor(w[26].id, 0.5, 0.9));     // safe room to addition

  // WINDOWS
  const windows = [];
  windows.push(createWindow(w[0].id, 0.2, 1.5));  // balcony window 1
  windows.push(createWindow(w[0].id, 0.8, 1.5));  // balcony window 2
  windows.push(createWindow(w[1].id, 0.5, 1.0));  // balcony right window
  windows.push(createWindow(w[2].id, 0.5, 1.0));  // balcony left window
  windows.push(createWindow(w[3].id, 0.6, 1.2));  // top wall window (room 10.23)
  windows.push(createWindow(w[3].id, 0.85, 1.2)); // top wall window (room 11.37)
  windows.push(createWindow(w[4].id, 0.25, 1.2)); // right wall window (11.37)
  windows.push(createWindow(w[4].id, 0.65, 1.2)); // right wall window (11.9)
  windows.push(createWindow(w[4].id, 0.9, 1.0));  // right wall window (6.65)
  windows.push(createWindow(w[8].id, 0.3, 1.0));  // left wall window
  windows.push(createWindow(w[7].id, 0.7, 1.2));  // bottom window (addition)
  windows.push(createWindow(w[5].id, 0.5, 1.0));  // bottom right window

  return { walls: w, openings: [...doors, ...windows] };
};

const defaultApartment = () => {
  const walls = [
    createWall(0, 0, 8, 0), createWall(8, 0, 8, 6),
    createWall(8, 6, 0, 6), createWall(0, 6, 0, 0),
    createWall(4, 0, 4, 4), createWall(4, 4, 8, 4),
  ];
  return {
    walls,
    openings: [
      createDoor(walls[0].id, 0.25), createWindow(walls[1].id, 0.3),
      createWindow(walls[2].id, 0.5), createDoor(walls[4].id, 0.7),
      createWindow(walls[1].id, 0.75),
    ],
  };
};

// ─── Room Labels ───
function getRoomLabels(data) {
  // Simple room detection for labeling
  const rooms = [
    { name: "סלון\n34.54m²", cx: 3.5, cy: 5.2 },
    { name: "חדר\n10.23m²", cx: 8.75, cy: 4 },
    { name: "חדר\n11.37m²", cx: 12.25, cy: 4 },
    { name: "מרפסת\n18m²", cx: 4.75, cy: 1.25 },
    { name: "אמבטיה\n2.96m²", cx: 8.75, cy: 6.25 },
    { name: "שרותים\n2.76m²", cx: 8.75, cy: 8 },
    { name: "חדר\n11.9m²", cx: 12.25, cy: 7.25 },
    { name: "כניסה\n1.55m²", cx: 0.75, cy: 8.75 },
    { name: "מטבח\n4m²", cx: 1.75, cy: 9.5 },
    { name: "חדר\n13.98m²", cx: 5.25, cy: 9.25 },
    { name: "2.38m²", cx: 8, cy: 9.75 },
    { name: "חדר\n6.65m²", cx: 12.25, cy: 9.75 },
    { name: "ממ\"ד\n10.65m²", cx: 2.25, cy: 12 },
    { name: "תוספת חדר\n9m²", cx: 7.25, cy: 12 },
  ];
  return rooms;
}

// ─── AI Import Modal ───
function AIImportModal({ onClose, onImport, onBgImage }) {
  const [imageData, setImageData] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setImageData(e.target.result.split(",")[1]);
      setImageFile(file);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeWithAI = async () => {
    if (!imageData) return;
    setStatus("analyzing");
    setProgress("Envoi du plan à Claude Vision...");
    setError(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: imageFile?.type || "image/png", data: imageData } },
              { type: "text", text: `You are an expert architectural floor plan analyzer. Analyze this 2D floor plan image and extract ALL walls, doors, and windows with precise coordinates.

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
- Be thorough - miss nothing. An apartment typically has 15-30+ wall segments.` }
            ]
          }]
        })
      });

      setProgress("Analyse de la structure...");
      const result = await response.json();
      if (!result.content?.[0]) throw new Error("Réponse AI vide");

      const text = result.content.map(c => c.text || "").join("");
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      setProgress("Construction du plan digital...");

      let parsed;
      try { parsed = JSON.parse(clean); }
      catch { const m = clean.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); else throw new Error("JSON invalide"); }

      if (!parsed.walls?.length) throw new Error("Aucun mur détecté");

      const walls = parsed.walls.map(w => createWall(snap(w.x1), snap(w.y1), snap(w.x2), snap(w.y2), w.label));
      const openings = [];
      parsed.doors?.forEach(d => {
        if (d.wallIndex >= 0 && d.wallIndex < walls.length)
          openings.push(createDoor(walls[d.wallIndex].id, Math.max(0.05, Math.min(0.95, d.position || 0.5)), d.width || 0.9));
      });
      parsed.windows?.forEach(w => {
        if (w.wallIndex >= 0 && w.wallIndex < walls.length)
          openings.push(createWindow(walls[w.wallIndex].id, Math.max(0.05, Math.min(0.95, w.position || 0.5)), w.width || 1.2));
      });

      setStatus("done");
      setProgress(`✓ ${walls.length} murs, ${parsed.doors?.length || 0} portes, ${parsed.windows?.length || 0} fenêtres`);
      onBgImage(imageSrc);
      setTimeout(() => onImport({ walls, openings }), 800);
    } catch (err) {
      setError(err.message || "Échec de l'analyse");
      setStatus("idle");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxHeight: "85vh", background: "#1a1a1f", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e0d4" }}>⚡ AI Floor Plan Import</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Upload screenshot → Claude Vision → Plan digital</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: "none", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: 24, flex: 1, overflow: "auto" }}>
          <div onDragOver={e => { e.preventDefault(); }} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handleFile(f); }} onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${imageSrc ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.12)"}`, borderRadius: 12, padding: imageSrc ? 0 : 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: imageSrc ? "transparent" : "rgba(255,255,255,0.02)", overflow: "hidden", minHeight: imageSrc ? 200 : 160 }}>
            {imageSrc ? <img src={imageSrc} alt="Plan" style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 10 }} /> : (
              <><div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📐</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Glissez votre plan ici</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>ou cliquez · PNG, JPG, WEBP</div></>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
          {status === "analyzing" && <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 18, height: 18, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{progress}</span><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
          {status === "done" && <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}><span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>{progress}</span></div>}
          {error && <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}><span style={{ fontSize: 12, color: "#ef4444" }}>⚠ {error}</span></div>}
          <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>💡 Conseils :</div>
            • Plan 2D vu de dessus avec bon contraste<br/>• Les annotations de surface (m²) améliorent la précision<br/>• Plans architecturaux israéliens supportés (hébreu)<br/>• L'image reste en transparence comme référence
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>Annuler</button>
          <button onClick={analyzeWithAI} disabled={!imageData || status !== "idle"} style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: imageData && status === "idle" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.06)", color: imageData && status === "idle" ? "#111" : "rgba(255,255,255,0.2)", cursor: imageData && status === "idle" ? "pointer" : "default", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>{status === "analyzing" ? "Analyse..." : status === "done" ? "Terminé ✓" : "⚡ Analyser avec l'IA"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Canvas Editor ───
function Editor2D({ data, setData, tool, selectedId, setSelectedId, bgImage, showLabels }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const bgImgRef = useRef(null);

  useEffect(() => {
    if (bgImage) { const img = new Image(); img.onload = () => { bgImgRef.current = img; }; img.src = bgImage; } else bgImgRef.current = null;
  }, [bgImage]);

  const getPos = useCallback((e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: snap(toWorld(e.clientX - r.left - pan.x)), y: snap(toWorld(e.clientY - r.top - pan.y)) };
  }, [pan]);

  const findWallAt = useCallback((mx, my) => {
    for (const w of data.walls) {
      const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const t = Math.max(0, Math.min(1, ((mx - w.x1) * dx + (my - w.y1) * dy) / (len * len)));
      const dist = Math.sqrt((mx - (w.x1 + t * dx)) ** 2 + (my - (w.y1 + t * dy)) ** 2);
      if (dist < 0.4) return { wall: w, t };
    }
    return null;
  }, [data.walls]);

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return; }
    const pos = getPos(e);
    if (tool === "wall") setDrawing({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    else if (tool === "select") {
      const hit = findWallAt(pos.x, pos.y);
      if (hit) { setSelectedId(hit.wall.id); setDragging({ wallId: hit.wall.id, startX: pos.x, startY: pos.y, origWall: { ...hit.wall } }); }
      else {
        const oh = data.openings.find(o => { const w = data.walls.find(ww => ww.id === o.wallId); if (!w) return false; return Math.sqrt((pos.x - (w.x1 + (w.x2 - w.x1) * o.position)) ** 2 + (pos.y - (w.y1 + (w.y2 - w.y1) * o.position)) ** 2) < 0.6; });
        setSelectedId(oh ? oh.id : null);
      }
    } else if (tool === "door" || tool === "window") {
      const hit = findWallAt(pos.x, pos.y);
      if (hit) { const o = tool === "door" ? createDoor(hit.wall.id, hit.t) : createWindow(hit.wall.id, hit.t); setData(d => ({ ...d, openings: [...d.openings, o] })); setSelectedId(o.id); }
    }
  };
  const handleMouseMove = (e) => {
    if (isPanning && panStart) { setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    const pos = getPos(e);
    if (drawing) setDrawing(d => ({ ...d, x2: pos.x, y2: pos.y }));
    if (dragging) { const dx = pos.x - dragging.startX, dy = pos.y - dragging.startY; setData(d => ({ ...d, walls: d.walls.map(w => w.id === dragging.wallId ? { ...w, x1: snap(dragging.origWall.x1 + dx), y1: snap(dragging.origWall.y1 + dy), x2: snap(dragging.origWall.x2 + dx), y2: snap(dragging.origWall.y2 + dy) } : w) })); }
  };
  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); setPanStart(null); return; }
    if (drawing) { const dx = drawing.x2 - drawing.x1, dy = drawing.y2 - drawing.y1; if (Math.sqrt(dx * dx + dy * dy) > 0.3) { const w = createWall(drawing.x1, drawing.y1, drawing.x2, drawing.y2); setData(d => ({ ...d, walls: [...d.walls, w] })); setSelectedId(w.id); } setDrawing(null); }
    setDragging(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.parentElement.clientWidth;
    const H = canvas.height = canvas.parentElement.clientHeight;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#1a1a1f"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(pan.x, pan.y);

    if (bgImgRef.current) {
      ctx.globalAlpha = 0.2;
      const img = bgImgRef.current, s = toScreen(14) / Math.max(img.width, img.height);
      ctx.drawImage(img, 0, 0, img.width * s, img.height * s);
      ctx.globalAlpha = 1;
    }

    // Grid
    const gp = toScreen(GRID_SIZE); ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 1;
    for (let x = -pan.x - gp; x < W; x += gp) { const sx = Math.round(x / gp) * gp; ctx.beginPath(); ctx.moveTo(sx, -pan.y); ctx.lineTo(sx, H - pan.y); ctx.stroke(); }
    for (let y = -pan.y - gp; y < H; y += gp) { const sy = Math.round(y / gp) * gp; ctx.beginPath(); ctx.moveTo(-pan.x, sy); ctx.lineTo(W - pan.x, sy); ctx.stroke(); }
    const mp = toScreen(1); ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let x = -pan.x - mp; x < W; x += mp) { const sx = Math.round(x / mp) * mp; ctx.beginPath(); ctx.moveTo(sx, -pan.y); ctx.lineTo(sx, H - pan.y); ctx.stroke(); }
    for (let y = -pan.y - mp; y < H; y += mp) { const sy = Math.round(y / mp) * mp; ctx.beginPath(); ctx.moveTo(-pan.x, sy); ctx.lineTo(W - pan.x, sy); ctx.stroke(); }

    // Walls
    data.walls.forEach(w => {
      const isSel = w.id === selectedId;
      ctx.strokeStyle = isSel ? "#f59e0b" : "#c8bea8"; ctx.lineWidth = isSel ? 8 : 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(toScreen(w.x1), toScreen(w.y1)); ctx.lineTo(toScreen(w.x2), toScreen(w.y2)); ctx.stroke();
      const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len = Math.sqrt(dx * dx + dy * dy);
      const mx = toScreen((w.x1 + w.x2) / 2), my = toScreen((w.y1 + w.y2) / 2), angle = Math.atan2(dy, dx);
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "10px monospace"; ctx.textAlign = "center";
      ctx.fillText(`${len.toFixed(1)}m`, mx - Math.sin(angle) * 14, my + Math.cos(angle) * 14);
      ctx.fillStyle = isSel ? "#f59e0b" : "rgba(255,255,255,0.25)";
      [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }].forEach(p => { ctx.beginPath(); ctx.arc(toScreen(p.x), toScreen(p.y), 3, 0, Math.PI * 2); ctx.fill(); });
    });

    // Openings
    data.openings.forEach(o => {
      const w = data.walls.find(ww => ww.id === o.wallId); if (!w) return;
      const ox = toScreen(w.x1 + (w.x2 - w.x1) * o.position), oy = toScreen(w.y1 + (w.y2 - w.y1) * o.position);
      const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1), isSel = o.id === selectedId;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(angle);
      if (o.type === "door") {
        const dw = toScreen(o.width);
        ctx.strokeStyle = "#1a1a1f"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-dw / 2, 0); ctx.lineTo(dw / 2, 0); ctx.stroke();
        ctx.strokeStyle = isSel ? "#f59e0b" : "#60a5fa"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-dw / 2, 0, dw, 0, -Math.PI / 2, true); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-dw / 2, 0); ctx.lineTo(-dw / 2, -dw); ctx.stroke();
        ctx.fillStyle = isSel ? "#f59e0b" : "#60a5fa"; ctx.fillRect(-dw / 2 - 3, -3, 6, 6); ctx.fillRect(dw / 2 - 3, -3, 6, 6);
      } else {
        const ww = toScreen(o.width);
        ctx.strokeStyle = "#1a1a1f"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-ww / 2, 0); ctx.lineTo(ww / 2, 0); ctx.stroke();
        ctx.strokeStyle = isSel ? "#f59e0b" : "#34d399"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-ww / 2, -4); ctx.lineTo(ww / 2, -4); ctx.moveTo(-ww / 2, 4); ctx.lineTo(ww / 2, 4); ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.stroke();
        ctx.strokeRect(-ww / 2, -5, ww, 10);
      }
      ctx.restore();
    });

    // Room labels
    if (showLabels) {
      const labels = getRoomLabels(data);
      labels.forEach(r => {
        const x = toScreen(r.cx), y = toScreen(r.cy);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        const lines = r.name.split("\n");
        const boxW = Math.max(...lines.map(l => l.length)) * 7 + 16;
        const boxH = lines.length * 14 + 10;
        ctx.fillRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        lines.forEach((line, i) => {
          ctx.fillStyle = i === 0 ? "rgba(255,255,255,0.6)" : "rgba(245,158,11,0.7)";
          ctx.font = i === 0 ? "bold 11px monospace" : "10px monospace";
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * 14);
        });
      });
    }

    if (drawing) {
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 6; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(toScreen(drawing.x1), toScreen(drawing.y1)); ctx.lineTo(toScreen(drawing.x2), toScreen(drawing.y2)); ctx.stroke(); ctx.setLineDash([]);
      const dx = drawing.x2 - drawing.x1, dy = drawing.y2 - drawing.y1;
      ctx.fillStyle = "#f59e0b"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
      ctx.fillText(`${Math.sqrt(dx * dx + dy * dy).toFixed(1)}m`, toScreen((drawing.x1 + drawing.x2) / 2), toScreen((drawing.y1 + drawing.y2) / 2) - 16);
    }
    ctx.restore();
  }, [data, drawing, selectedId, pan, bgImage, showLabels]);

  useEffect(() => {
    const h = () => { const c = canvasRef.current; if (c) { c.width = c.parentElement.clientWidth; c.height = c.parentElement.clientHeight; } };
    window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", cursor: tool === "wall" ? "crosshair" : tool === "select" ? "default" : "pointer" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />;
}

// ─── 3D Viewer ───
function Viewer3D({ data, showCeiling }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const ctrlRef = useRef({ isDragging: false, lastX: 0, lastY: 0, theta: Math.PI / 5, phi: Math.PI / 5, distance: 22, target: new THREE.Vector3(7, 0, 6.5) });

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const W = mount.clientWidth, H = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#1a1a1f");
    scene.fog = new THREE.Fog("#1a1a1f", 30, 60);
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    sceneRef.current = scene; rendererRef.current = renderer; cameraRef.current = camera;

    scene.add(new THREE.AmbientLight("#b8c4d8", 0.6));
    const sun = new THREE.DirectionalLight("#ffe4c4", 1.4);
    sun.position.set(10, 15, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20; sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.001; scene.add(sun);
    const fill = new THREE.DirectionalLight("#8090c0", 0.4); fill.position.set(-8, 10, -5); scene.add(fill);
    scene.add(new THREE.HemisphereLight("#87ceeb", "#3a2a1a", 0.3));

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: "#2a2a2f", roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = true; scene.add(ground);

    const ctrl = ctrlRef.current;
    const updateCam = () => {
      camera.position.set(ctrl.target.x + ctrl.distance * Math.sin(ctrl.phi) * Math.cos(ctrl.theta), ctrl.target.y + ctrl.distance * Math.cos(ctrl.phi), ctrl.target.z + ctrl.distance * Math.sin(ctrl.phi) * Math.sin(ctrl.theta));
      camera.lookAt(ctrl.target);
    };
    updateCam();

    const onDown = e => { ctrl.isDragging = true; ctrl.lastX = e.clientX; ctrl.lastY = e.clientY; };
    const onMove = e => {
      if (!ctrl.isDragging) return;
      const dx = e.clientX - ctrl.lastX, dy = e.clientY - ctrl.lastY;
      if (e.shiftKey) {
        const right = new THREE.Vector3(), up = new THREE.Vector3();
        camera.getWorldDirection(up); right.crossVectors(up, camera.up).normalize(); up.copy(camera.up).normalize();
        ctrl.target.add(right.multiplyScalar(-dx * 0.02)); ctrl.target.add(up.multiplyScalar(dy * 0.02));
      } else { ctrl.theta -= dx * 0.005; ctrl.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, ctrl.phi + dy * 0.005)); }
      ctrl.lastX = e.clientX; ctrl.lastY = e.clientY; updateCam();
    };
    const onUp = () => { ctrl.isDragging = false; };
    const onWheel = e => { ctrl.distance = Math.max(3, Math.min(45, ctrl.distance + e.deltaY * 0.01)); updateCam(); };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel);
    const animate = () => { frameRef.current = requestAnimationFrame(animate); renderer.render(scene, camera); }; animate();
    const handleResize = () => { const w = mount.clientWidth, h = mount.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement); renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const toRemove = []; scene.traverse(c => { if (c.userData.building) toRemove.push(c); });
    toRemove.forEach(c => { scene.remove(c); if (c.geometry) c.geometry.dispose(); });

    const wallMat = new THREE.MeshStandardMaterial({ color: "#e8e0d4", roughness: 0.7, metalness: 0.05 });
    const floorMat = new THREE.MeshStandardMaterial({ color: "#c4a882", roughness: 0.6 });
    const doorMat = new THREE.MeshStandardMaterial({ color: "#6b4423", roughness: 0.5, metalness: 0.1 });
    const frameMat = new THREE.MeshStandardMaterial({ color: "#4a3520", roughness: 0.4, metalness: 0.15 });
    const glassMat = new THREE.MeshStandardMaterial({ color: "#a8d4e6", roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.4 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: "#f8f4f0", roughness: 0.9, side: THREE.DoubleSide });

    if (data.walls.length >= 2) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      data.walls.forEach(w => { minX = Math.min(minX, w.x1, w.x2); maxX = Math.max(maxX, w.x1, w.x2); minY = Math.min(minY, w.y1, w.y2); maxY = Math.max(maxY, w.y1, w.y2); });
      const fw = maxX - minX, fh = maxY - minY;
      if (fw > 0 && fh > 0) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw + 0.5, fh + 0.5), floorMat);
        floor.rotation.x = -Math.PI / 2; floor.position.set(minX + fw / 2, 0.01, minY + fh / 2);
        floor.receiveShadow = true; floor.userData.building = true; scene.add(floor);
        if (showCeiling) {
          const c = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), ceilingMat);
          c.rotation.x = Math.PI / 2; c.position.set(minX + fw / 2, 2.8, minY + fh / 2);
          c.userData.building = true; scene.add(c);
        }
      }
    }

    data.walls.forEach(w => {
      const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.01) return;
      const angle = Math.atan2(dy, dx), height = w.height || 2.8, thickness = w.thickness || 0.15;
      const wallOpenings = data.openings.filter(o => o.wallId === w.id);

      if (wallOpenings.length === 0) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, height, thickness), wallMat);
        mesh.position.set(w.x1 + dx / 2, height / 2, w.y1 + dy / 2);
        mesh.rotation.y = -angle; mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.building = true; scene.add(mesh);
      } else {
        const sorted = wallOpenings.map(o => ({ ...o, posAlongWall: o.position * len, halfWidth: o.width / 2 })).sort((a, b) => a.posAlongWall - b.posAlongWall);
        const segments = []; let lastEnd = 0;
        sorted.forEach(o => {
          const openStart = Math.max(0, o.posAlongWall - o.halfWidth);
          const openEnd = Math.min(len, o.posAlongWall + o.halfWidth);
          if (openStart > lastEnd + 0.05) segments.push({ start: lastEnd, end: openStart, type: "wall", height });
          const oH = o.type === "door" ? (o.height || 2.1) : ((o.sillHeight || 0.9) + (o.height || 1.2));
          if (oH < height) segments.push({ start: openStart, end: openEnd, type: "above", bottomY: oH, topY: height });
          if (o.type === "window" && (o.sillHeight || 0.9) > 0) segments.push({ start: openStart, end: openEnd, type: "below", topY: o.sillHeight || 0.9 });
          const cx = w.x1 + (dx / len) * o.posAlongWall, cy = w.y1 + (dy / len) * o.posAlongWall;
          if (o.type === "door") {
            const door = new THREE.Mesh(new THREE.BoxGeometry(o.width * 0.95, o.height || 2.1, 0.05), doorMat);
            door.position.set(cx, (o.height || 2.1) / 2, cy); door.rotation.y = -angle; door.castShadow = true; door.userData.building = true; scene.add(door);
            const fh = new THREE.Mesh(new THREE.BoxGeometry(o.width + 0.06, 0.06, thickness + 0.02), frameMat);
            fh.position.set(cx, o.height || 2.1, cy); fh.rotation.y = -angle; fh.userData.building = true; scene.add(fh);
          } else {
            const sY = o.sillHeight || 0.9;
            const glass = new THREE.Mesh(new THREE.BoxGeometry(o.width * 0.95, o.height || 1.2, 0.03), glassMat);
            glass.position.set(cx, sY + (o.height || 1.2) / 2, cy); glass.rotation.y = -angle; glass.userData.building = true; scene.add(glass);
            const ft = new THREE.Mesh(new THREE.BoxGeometry(o.width + 0.04, 0.04, thickness + 0.02), frameMat);
            ft.position.set(cx, sY + (o.height || 1.2), cy); ft.rotation.y = -angle; ft.userData.building = true; scene.add(ft);
            const fb = new THREE.Mesh(new THREE.BoxGeometry(o.width + 0.04, 0.06, thickness + 0.06), frameMat);
            fb.position.set(cx, sY, cy); fb.rotation.y = -angle; fb.userData.building = true; scene.add(fb);
            const fc = new THREE.Mesh(new THREE.BoxGeometry(0.03, o.height || 1.2, 0.04), frameMat);
            fc.position.set(cx, sY + (o.height || 1.2) / 2, cy); fc.rotation.y = -angle; fc.userData.building = true; scene.add(fc);
          }
          lastEnd = openEnd;
        });
        if (lastEnd < len - 0.05) segments.push({ start: lastEnd, end: len, type: "wall", height });
        segments.forEach(seg => {
          const segLen = seg.end - seg.start; if (segLen < 0.05) return;
          const sc = (seg.start + seg.end) / 2, cx = w.x1 + (dx / len) * sc, cy = w.y1 + (dy / len) * sc;
          let h, yPos;
          if (seg.type === "wall") { h = height; yPos = h / 2; }
          else if (seg.type === "above") { h = seg.topY - seg.bottomY; yPos = seg.bottomY + h / 2; }
          else if (seg.type === "below") { h = seg.topY; yPos = h / 2; }
          else return;
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(segLen, h, thickness), wallMat);
          mesh.position.set(cx, yPos, cy); mesh.rotation.y = -angle;
          mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.building = true; scene.add(mesh);
        });
      }
    });
  }, [data, showCeiling]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

// ─── Main App ───
export default function App() {
  const [data, setData] = useState(israeliApartment);
  const [view, setView] = useState("split");
  const [tool, setTool] = useState("select");
  const [selectedId, setSelectedId] = useState(null);
  const [showCeiling, setShowCeiling] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setData(d => {
      const wIdx = d.walls.findIndex(w => w.id === selectedId);
      if (wIdx >= 0) return { walls: d.walls.filter(w => w.id !== selectedId), openings: d.openings.filter(o => o.wallId !== d.walls[wIdx].id) };
      return { ...d, openings: d.openings.filter(o => o.id !== selectedId) };
    });
    setSelectedId(null);
  }, [selectedId]);

  useEffect(() => {
    const handler = e => { if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement?.tagName !== "INPUT") deleteSelected(); };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected]);

  const selectedItem = data.walls.find(w => w.id === selectedId) || data.openings.find(o => o.id === selectedId);
  const tools = [{ id: "select", label: "Select", icon: "⊹" }, { id: "wall", label: "Mur", icon: "▬" }, { id: "door", label: "Porte", icon: "▯" }, { id: "window", label: "Fenêtre", icon: "⊞" }];

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#111114", fontFamily: "'JetBrains Mono','SF Mono',monospace", color: "#e8e0d4", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(20,20,24,0.95)", zIndex: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold", color: "#111" }}>⌂</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>FLOOR PLAN STUDIO</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>2D / 3D EDITOR</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowImport(true)} style={{ padding: "6px 14px", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 7, background: "rgba(245,158,11,0.1)", color: "#f59e0b", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>⚡ AI Import</button>
          <button onClick={() => setShowLabels(l => !l)} style={{ padding: "6px 12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, background: showLabels ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", color: showLabels ? "#34d399" : "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600 }}>{showLabels ? "◉ Labels" : "○ Labels"}</button>
          <button onClick={() => setShowCeiling(c => !c)} style={{ padding: "6px 12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, background: showCeiling ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.04)", color: showCeiling ? "#60a5fa" : "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600 }}>{showCeiling ? "⊟ Toit" : "⊞ Toit"}</button>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            {["2d", "3d", "split"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 16px", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 1, fontFamily: "inherit", background: view === v ? "rgba(245,158,11,0.2)" : "transparent", color: view === v ? "#f59e0b" : "rgba(255,255,255,0.4)" }}>{v.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 10, color: "rgba(255,255,255,0.3)", padding: "0 8px" }}>
            <span>{data.walls.length} murs</span>
            <span>{data.openings.filter(o => o.type === "door").length} portes</span>
            <span>{data.openings.filter(o => o.type === "window").length} fenêtres</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {(view === "2d" || view === "split") && (
          <div style={{ width: 56, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 3, borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(18,18,22,0.95)" }}>
            {tools.map(t => (
              <button key={t.id} onClick={() => setTool(t.id)} style={{ width: 44, height: 44, border: "none", borderRadius: 9, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, fontFamily: "inherit", background: tool === t.id ? "rgba(245,158,11,0.15)" : "transparent", color: tool === t.id ? "#f59e0b" : "rgba(255,255,255,0.4)" }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span style={{ fontSize: 7, letterSpacing: 1 }}>{t.label.toUpperCase()}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={deleteSelected} disabled={!selectedId} style={{ width: 44, height: 44, border: "none", borderRadius: 9, cursor: selectedId ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, fontFamily: "inherit", background: selectedId ? "rgba(239,68,68,0.15)" : "transparent", color: selectedId ? "#ef4444" : "rgba(255,255,255,0.15)", opacity: selectedId ? 1 : 0.5 }}>
              <span style={{ fontSize: 14 }}>✕</span><span style={{ fontSize: 7 }}>SUPPR</span>
            </button>
            <button onClick={() => { setData(israeliApartment()); setSelectedId(null); setBgImage(null); }} style={{ width: 44, height: 44, border: "none", borderRadius: 9, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, fontFamily: "inherit", background: "transparent", color: "rgba(255,255,255,0.3)" }}>
              <span style={{ fontSize: 13 }}>↺</span><span style={{ fontSize: 7 }}>RESET</span>
            </button>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", position: "relative" }}>
          {(view === "2d" || view === "split") && (
            <div style={{ flex: 1, position: "relative", borderRight: view === "split" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <Editor2D data={data} setData={setData} tool={tool} selectedId={selectedId} setSelectedId={setSelectedId} bgImage={bgImage} showLabels={showLabels} />
              <div style={{ position: "absolute", bottom: 10, left: 10, padding: "5px 10px", background: "rgba(0,0,0,0.6)", borderRadius: 6, fontSize: 9, color: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)" }}>
                {tool === "wall" ? "Cliquer + glisser → mur" : tool === "door" ? "Cliquer un mur → porte" : tool === "window" ? "Cliquer un mur → fenêtre" : "Sélection · Glisser · Suppr"} · Alt+drag pan
              </div>
              {bgImage && <button onClick={() => setBgImage(null)} style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", background: "rgba(0,0,0,0.7)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "inherit", fontSize: 9 }}>✕ Masquer référence</button>}
            </div>
          )}
          {(view === "3d" || view === "split") && (
            <div style={{ flex: 1, position: "relative" }}>
              <Viewer3D data={data} showCeiling={showCeiling} />
              <div style={{ position: "absolute", bottom: 10, left: 10, padding: "5px 10px", background: "rgba(0,0,0,0.6)", borderRadius: 6, fontSize: 9, color: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)" }}>Drag orbiter · Shift+drag pan · Scroll zoom</div>
            </div>
          )}
        </div>

        {selectedItem && (view === "2d" || view === "split") && (
          <div style={{ width: 200, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(18,18,22,0.95)", padding: 14, fontSize: 11, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.35)" }}>PROPRIÉTÉS</div>
            <div style={{ padding: "6px 8px", borderRadius: 6, background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: 10, fontWeight: 600 }}>
              {selectedItem.type === "wall" ? "MUR" : selectedItem.type === "door" ? "PORTE" : "FENÊTRE"}
            </div>
            {selectedItem.type === "wall" && (
              <>
                <div style={{ color: "rgba(255,255,255,0.5)" }}>Long: {Math.sqrt((selectedItem.x2 - selectedItem.x1) ** 2 + (selectedItem.y2 - selectedItem.y1) ** 2).toFixed(2)}m</div>
                <div style={{ color: "rgba(255,255,255,0.5)" }}>Haut: {selectedItem.height}m</div>
                <label style={{ color: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", gap: 3 }}>Hauteur
                  <input type="range" min="2" max="4" step="0.1" value={selectedItem.height} onChange={e => setData(d => ({ ...d, walls: d.walls.map(w => w.id === selectedId ? { ...w, height: parseFloat(e.target.value) } : w) }))} style={{ accentColor: "#f59e0b" }} />
                </label>
              </>
            )}
            {(selectedItem.type === "door" || selectedItem.type === "window") && (
              <>
                <label style={{ color: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", gap: 3 }}>Largeur: {selectedItem.width.toFixed(2)}m
                  <input type="range" min="0.5" max="2.5" step="0.1" value={selectedItem.width} onChange={e => setData(d => ({ ...d, openings: d.openings.map(o => o.id === selectedId ? { ...o, width: parseFloat(e.target.value) } : o) }))} style={{ accentColor: "#f59e0b" }} />
                </label>
                <label style={{ color: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", gap: 3 }}>Position
                  <input type="range" min="0.05" max="0.95" step="0.05" value={selectedItem.position} onChange={e => setData(d => ({ ...d, openings: d.openings.map(o => o.id === selectedId ? { ...o, position: parseFloat(e.target.value) } : o) }))} style={{ accentColor: "#f59e0b" }} />
                </label>
              </>
            )}
            <button onClick={deleteSelected} style={{ marginTop: "auto", padding: "8px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600 }}>SUPPRIMER</button>
          </div>
        )}
      </div>

      {showImport && <AIImportModal onClose={() => setShowImport(false)} onBgImage={setBgImage} onImport={(newData) => { setData(newData); setSelectedId(null); setShowImport(false); }} />}
    </div>
  );
}
