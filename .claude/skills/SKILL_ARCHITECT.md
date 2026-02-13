# Skill: Architecte (Architect)

## Purpose
Architectural design knowledge for spatial planning, room layout, circulation flow, building regulations, and floor plan composition. Focused on residential architecture (apartments and houses).

## Spatial Planning Principles

### Zoning
Divide a dwelling into three functional zones:

1. **Zone jour** (Day zone) — public, social
   - Salon, salle à manger, cuisine, entrée
   - Should face south/west for natural light
   - Open plan or visual connection between these spaces

2. **Zone nuit** (Night zone) — private, quiet
   - Chambres, dressing, SdB privative
   - Should face east (morning light) or north (quiet)
   - Separated from day zone by corridor or buffer

3. **Zone service** (Utility zone) — functional
   - WC, buanderie, rangements, garage
   - Can be interior (no natural light needed for WC, buanderie)
   - Buffer between day and night zones

### Circulation
- **Entrée** acts as distribution hub — connects to all zones
- **Couloir** should not exceed 1/6 of total surface (wasted space)
- Avoid crossing one room to reach another (traversée)
- Each bedroom must be accessible without crossing another bedroom
- Minimum corridor width: 0.90m (1.20m recommended)

### Orientation & Natural Light
| Orientation | Quality | Best for |
|-------------|---------|----------|
| Sud (South) | Max light, warm | Séjour, terrasse |
| Est (East) | Morning light | Chambres |
| Ouest (West) | Afternoon light | Cuisine, bureau |
| Nord (North) | Stable, cool | SdB, WC, garage, buanderie |

- Every habitable room needs at least **one window** (surface vitrée ≥ 1/6 of floor area)
- Bathrooms and WC can be interior (mechanical ventilation — VMC)

## Room Layout Standards

### Recommended room dimensions (residential)

| Room | Min Area | Comfortable | Typical Shape |
|------|----------|-------------|---------------|
| Salon | 16 m² | 20–30 m² | Rectangle 4×5 to 5×6 |
| Chambre parentale | 12 m² | 14–16 m² | Rectangle 3.5×4 |
| Chambre enfant | 9 m² | 10–12 m² | Rectangle 3×3.5 |
| Cuisine fermée | 6 m² | 8–12 m² | Rectangle 2.5×3 |
| Cuisine ouverte | integrated | 10–15 m² (with salon) | L-shape or linear |
| SdB | 4 m² | 5–8 m² | Rectangle 2×2.5 |
| WC | 1.2 m² | 1.5–2 m² | Rectangle 0.9×1.5 |
| Entrée | 2 m² | 3–5 m² | Square or corridor |
| Bureau | 6 m² | 8–10 m² | Rectangle 2.5×3 |
| Buanderie | 2 m² | 3–4 m² | Rectangle 1.5×2 |
| Dressing | 3 m² | 4–6 m² | Walk-in or linear |
| Couloir | — | 1.20m wide | Linear |

### Apartment typologies (French standard)

| Type | Definition | Typical Area | Rooms |
|------|------------|-------------|-------|
| Studio | 1 pièce + cuisine + SdB | 18–30 m² | Séjour/chambre combiné |
| T1 | 1 pièce principale | 25–35 m² | Séjour + cuisine |
| T2 | 2 pièces | 35–50 m² | Séjour + 1 chambre |
| T3 | 3 pièces | 55–75 m² | Séjour + 2 chambres |
| T4 | 4 pièces | 75–100 m² | Séjour + 3 chambres |
| T5 | 5 pièces | 90–120 m² | Séjour + 4 chambres |

## Door Placement Rules

### Swing direction
- Doors swing **into the room** they open to (convention)
- Exception: WC and SdB doors can swing outward (safety — person collapsed inside)
- Exception: Entrance door (porte palière) swings **inward** into apartment
- `swingOut = true` for exterior-swing doors

### Door positioning
- Place door near a corner, not center of wall — leaves usable wall space
- Leave **minimum 10cm** between door frame and perpendicular wall
- Door must not block another door when open
- In corridors: stagger doors on opposite walls to avoid collision

### Door types by room
| Room | Door Type | Width |
|------|-----------|-------|
| Entrée | Standard or blindé | 0.90m |
| Chambre | Standard | 0.83m |
| SdB | Standard | 0.73m |
| WC | Standard | 0.63–0.73m |
| Cuisine | Standard or sliding | 0.83m |
| Salon (vers terrasse) | French / sliding-glass | 1.40–2.00m |
| Dressing | Sliding | 0.83–1.20m |
| Placard | Sliding | variable |

## Window Placement Rules

### Sizing
- Window area ≥ **1/6 of room floor area** (regulatory minimum)
- Sill height: **0.90m** standard (garde-corps obligatoire en dessous)
- Baie vitrée: sill at 0m, full height 2.15m — use safety glass

### Positioning
- Center windows on room width when possible (symmetry)
- In bedrooms: place window opposite the door for cross-ventilation
- Avoid windows directly facing neighbors at < 1.90m distance (vue droite)

## Stairs (for houses / duplex)

### Standard dimensions
- Width: min **0.80m** (0.90m standard, 1.00m comfortable)
- Riser height (contremarche): 16–18cm optimal (max 21cm)
- Tread depth (giron): 24–28cm optimal (min 21cm)
- Blondel formula: **2h + g = 60–64cm** (h = riser, g = tread)
- Headroom: min **1.90m** at all points

### Types
| Type | Footprint | Best for |
|------|-----------|----------|
| Droit (straight) | 1.00 × 4.50m | Large spaces |
| 1/4 tournant | 2.00 × 2.50m | Standard houses |
| 2/4 tournant (U) | 2.00 × 4.00m | Compact |
| Hélicoïdal (spiral) | Ø 1.50–2.00m | Very compact |

## Outdoor Spaces

### Balcony
- Min depth: **1.20m** (usable) — 0.80m is too narrow for a table
- Railing height: min **1.00m** (1.10m above 3rd floor)
- Preferred off séjour or chambre parentale

### Terrasse
- Typically ground floor or rooftop
- Area: 10–20 m² for apartment, 20–50 m² for house
- Floor material: `pelouse` (garden) or `carrelage` (paved)

### Garage
- Single car: **2.50 × 5.00m** minimum (3.00 × 6.00m comfortable)
- Double: **5.00 × 5.50m** minimum
- Door: **2.40m** wide standard, **2.00m** height

## Implementation Notes for the App

### When placing rooms (labels)
- Validate room dimensions against standards
- Suggest room names based on area and position:
  - < 2 m² near SdB → "WC"
  - 9–12 m² with window → "Chambre"
  - > 15 m² south-facing → "Salon"
- Auto-suggest floor material based on room type:
  - Chambres, salon, couloir → `parquet`
  - Cuisine, SdB, WC, entrée → `carrelage`
  - Terrasse, balcon → `pelouse` or `carrelage`

### Layout validation
1. Every chambre accessible without crossing another chambre
2. WC not directly opening into cuisine or salon
3. At least 1 window per habitable room
4. Corridor surface < 1/6 of total surface
5. Entrée distributes to all zones
6. No room with ratio > 1:3 (too narrow)

### Common layout patterns

#### T2 (35–50 m²)
```
┌──────────────────────────┐
│  Chambre    │   SdB/WC   │
│  10-12m²    │   4-5m²    │
├─────────────┤            │
│  Couloir    ├────────────┤
├─────────────┤  Cuisine   │
│  Séjour     │   6-8m²    │
│  16-20m²    │            │
│             │  Entrée    │
└──────────────────────────┘
```

#### T3 (55–75 m²)
```
┌────────────────────────────────┐
│ Ch.1  │  SdB  │  Ch.2         │
│ 10m²  │  5m²  │  12m²         │
├───────┤       ├───────────────┤
│ Couloir       │  WC │ Cuisine │
├───────────────┤     │  8m²    │
│ Séjour        │     ├─────────┤
│ 22-25m²       │     │ Entrée  │
└────────────────────────────────┘
```

## PLU & Regulatory Constraints

### COS (Coefficient d'Occupation des Sols) — now replaced by CES
- Defines max building footprint relative to plot area
- Typical residential: 0.3–0.5

### Distance rules
- From property line: min **3m** (or H/2 if building height H)
- Between buildings on same plot: min **4m**
- Vue droite (direct view) to neighbor: min **1.90m**
- Vue oblique (angled view): min **0.60m**

### Height limits
- Varies by PLU zone — typically 7–12m for residential
- R+1 (ground + 1 floor) or R+2 typical in suburban areas
