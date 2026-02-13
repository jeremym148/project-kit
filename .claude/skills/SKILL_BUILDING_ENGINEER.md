# Skill: Ingénieur en Bâtiment (Building Engineer)

## Purpose
Structural engineering knowledge for floor plan design: load-bearing walls, structural calculations, building codes (French/Israeli norms), material properties, and construction feasibility.

## Wall Types & Structural Roles

### Classification in the app
| wallStyle | Role | Typical Thickness | Load-Bearing |
|-----------|------|-------------------|-------------|
| `exterieur` | Exterior envelope | 0.20–0.30m | Yes (always) |
| `porteur` | Interior load-bearing | 0.18–0.25m | Yes |
| `cloison` | Partition | 0.07–0.10m | No |
| `standard` | Generic / unspecified | 0.15–0.20m | Depends |

### Identifying load-bearing walls
- **Exterior walls** are always load-bearing
- **Walls aligned with the building's longitudinal axis** are typically load-bearing
- **Walls that continue across multiple floors** are load-bearing
- **Walls thicker than 15cm** are likely load-bearing
- **Cloisons** (partitions) can be moved/removed freely — they carry no vertical load

### Rules for modifications
- Never remove a `porteur` or `exterieur` wall without structural reinforcement (IPN beam, lintel)
- Openings in load-bearing walls require a lintel — max opening width depends on wall material:
  - Concrete: up to 4m with proper IPN
  - Stone/brick: up to 2.5m with reinforced lintel
  - Block (parpaing): up to 3m with prefab lintel
- Partition walls (`cloison`) can be added/removed/moved freely

## Standard Structural Dimensions

### Wall heights
- Standard residential: **2.50m** (floor to ceiling)
- With false ceiling: 2.40m visible, 2.60m structural
- Ground floor commercial: 3.00–3.50m
- Minimum habitable: 2.20m (code minimum, under slope)

### Wall thicknesses
| Type | Min | Standard | Max |
|------|-----|----------|-----|
| Exterior (concrete) | 0.18m | 0.20m | 0.30m |
| Exterior (stone) | 0.40m | 0.50m | 0.80m |
| Load-bearing interior | 0.15m | 0.20m | 0.25m |
| Partition (placo BA13) | 0.07m | 0.07m | 0.10m |
| Partition (brick) | 0.05m | 0.07m | 0.10m |
| Partition (béton cellulaire) | 0.07m | 0.10m | 0.15m |

### Floor loads (charges)
- Residential floor: 150 kg/m² (exploitation) + 250 kg/m² (permanent)
- Balcony: 350 kg/m² (exploitation)
- Garage: 250 kg/m² (exploitation)
- Terrace: 150 kg/m² + weather loads

## French Building Codes (DTU / NF)

### Minimum room dimensions (code habitation)
| Room | Min Surface | Min Width | Min Height |
|------|-------------|-----------|------------|
| Séjour | 9 m² | 2.70m | 2.20m |
| Chambre | 9 m² | 2.10m | 2.20m |
| Cuisine | 3 m² | — | 2.20m |
| SdB | 2.5 m² | — | 2.20m |
| WC | 1 m² | 0.80m | 2.20m |
| Couloir | — | 0.80m | 2.20m |
| Logement T1 | 14 m² total | — | — |

### Accessibility (PMR — Personnes à Mobilité Réduite)
- Couloir: min **0.90m** width (1.20m recommended)
- Porte: min **0.83m** clear passage (0.90m door leaf)
- WC PMR: min **1.50m × 2.10m** (rotation diameter 1.50m)
- SdB PMR: min **2.20m × 2.20m**
- No steps at thresholds

### Thermal insulation (RT2012 / RE2020)
- Exterior walls need insulation: minimum R = 3.7 m².K/W
- This adds ~12–18cm to exterior wall thickness (insulation + placo)
- Consider thermal bridges at corners and openings

## Openings in Structural Walls

### Lintel requirements
```
Opening width → Lintel type
< 1.00m      → Prefab concrete lintel or steel flat bar
1.00–2.00m   → IPN 120 or prefab reinforced lintel
2.00–3.00m   → IPN 160–200 or reinforced concrete beam
3.00–4.00m   → IPN 200–240 (engineer calculation required)
> 4.00m      → Custom reinforced concrete beam (mandatory engineer calc)
```

### Distance rules
- Minimum **0.50m** between two openings in a load-bearing wall
- Minimum **0.40m** from opening edge to wall corner
- Window sill height: min **0.90m** (garde-corps) or safety glass below

### Door dimensions (standard French)
| Type | Width | Height |
|------|-------|--------|
| Interior standard | 0.73m, 0.83m, 0.93m | 2.04m |
| Interior PMR | 0.93m | 2.04m |
| Entrance (porte palière) | 0.90m | 2.15m |
| French door (porte-fenêtre) | 1.20–1.80m | 2.15m |
| Sliding glass (baie vitrée) | 1.80–3.00m | 2.15m |
| Garage | 2.40–3.00m | 2.00–2.40m |

### Window dimensions (standard French)
| Type | Width | Height | Sill |
|------|-------|--------|------|
| Standard | 1.00–1.20m | 1.15–1.35m | 0.90m |
| Baie vitrée | 1.80–3.00m | 2.15m | 0.00m |
| Fenêtre haute (WC/SdB) | 0.60–0.80m | 0.60m | 1.60m |
| Velux (roof) | 0.55–1.14m | 0.70–1.40m | — |

## Foundations & Soil

### Foundation types by context
- **Semelles filantes**: standard residential on stable soil
- **Radier**: unstable soil or high water table
- **Pieux**: very soft soil or heavy structures
- Minimum foundation depth: **0.60m** (frost line in mainland France)

### Soil bearing capacity (portance)
- Rock: > 5 MPa
- Gravel: 0.3–0.5 MPa
- Compact sand: 0.2–0.4 MPa
- Clay: 0.1–0.2 MPa (risk of swelling — retrait-gonflement)
- Silt: 0.05–0.1 MPa

## Implementation Notes for the App

### When creating/modifying walls
- If `wallStyle === 'porteur'` or `'exterieur'`, warn before deletion
- Suggest minimum thickness based on wallStyle:
  - `exterieur`: min 0.18m, default 0.20m
  - `porteur`: min 0.15m, default 0.20m
  - `cloison`: min 0.05m, default 0.07m
- Validate that rooms meet minimum area requirements

### When placing openings
- Check that opening width doesn't exceed 80% of wall length
- Ensure minimum 0.40m from opening edge to wall endpoint
- Validate sill height for safety (≥ 0.90m or use `garde-corps` flag)

### Structural validation checklist
1. All exterior walls marked as `exterieur` or `porteur`
2. No rooms below minimum area (9m² for habitable)
3. Corridors minimum 0.80m wide
4. Doors minimum 0.73m wide (0.83m for PMR)
5. Load-bearing walls not removed without lintel notation
6. Total building footprint within plot boundaries (if terrain defined)

## Israeli Building Codes (Teken)

### Safe room (ממ"ד — Mamad)
- **Mandatory** in all new residential construction since 1992
- Minimum area: **9 m²** (internal)
- Wall thickness: **0.20m reinforced concrete** minimum
- Door: blast-resistant steel door, opens outward
- Window: blast-resistant window with steel shutter
- Location: must be accessible from all rooms without going outside
- Typically placed as bedroom that doubles as safe room

### Standard Israeli apartment dimensions
- Typical floor height: 2.70–2.80m (with slab: 3.00m)
- Exterior walls: 0.20–0.25m (concrete + insulation)
- Interior load-bearing: 0.15–0.20m
- Balconies: min railing height 1.05m
