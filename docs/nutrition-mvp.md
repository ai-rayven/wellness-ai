# Nutrition Logging MVP

Scope: sign in, search foods by name, log what you ate, see daily totals vs targets.
Out of scope for MVP: barcode scanning, nutrition-label photos, coach, onboarding.

**Stack (simplest plug-and-play):**
- **Mobile app:** Expo (React Native).
- **Auth + DB:** Supabase. Google and Apple sign-in come built in, and Postgres row-level security keeps each user's logs private.
- **Food data:** USDA FoodData Central (free API key). It's called through one Supabase Edge Function so the key never ships in the app.
- **Fallback:** if a food isn't found, the user types the label values into a custom food.

## Overview

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
flowchart LR
    user(("User"))
    app(("Mobile App"))
    social(("Google / Apple"))
    fn(("Food Search<br/>Edge Function"))
    usda(("USDA<br/>FoodData Central"))

    subgraph supa["Supabase"]
        auth(("Auth"))
        subgraph db["Postgres"]
            profiles[("profiles")]
            foods[("foods")]
            logs[("log_entries")]
        end
    end

    user -->|"Sign in / log"| app
    app -->|"OAuth"| auth
    auth <-.->|"Verify"| social
    app -->|"Search name"| fn
    fn -->|"Query"| usda
    fn -->|"Cache result"| foods
    app -->|"Read / write"| logs
    app -->|"Targets"| profiles

    classDef service fill:#e8efff,stroke:#5474b4,stroke-width:2px
    classDef table fill:#f0e8fa,stroke:#8b6aad,stroke-width:2px
    classDef external fill:#fff6dd,stroke:#bfa15b
    class app,fn,auth service
    class profiles,foods,logs table
    class social,usda external
```

Search results are saved in `foods` so a logged entry always points to a stable row.

## Data Model

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
erDiagram
    AUTH_USERS ||--|| PROFILES : "has"
    PROFILES ||--o{ LOG_ENTRIES : "logs"
    FOODS ||--o{ LOG_ENTRIES : "used in"
    PROFILES |o--o{ FOODS : "creates custom"

    AUTH_USERS {
        uuid id PK "managed by Supabase"
        text email
    }
    PROFILES {
        uuid id PK, FK "= auth.users.id"
        text display_name
        int kcal_target
        int protein_target_g
        int carbs_target_g
        int fat_target_g
        timestamptz created_at
    }
    FOODS {
        uuid id PK
        text source "usda | custom"
        text source_id "USDA fdcId, null if custom"
        text name
        text brand
        numeric serving_size
        text serving_unit "g, ml, piece"
        numeric kcal "per serving"
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        uuid created_by FK "null for usda"
    }
    LOG_ENTRIES {
        uuid id PK
        uuid user_id FK
        uuid food_id FK
        date eaten_on
        text meal "breakfast | lunch | dinner | snack"
        numeric servings
        numeric kcal "snapshot = food x servings"
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        timestamptz created_at
    }
```

- `foods` has a unique `(source, source_id)`, so each USDA food is cached once.
- `log_entries` stores a copy of the nutrient values taken when the entry is logged. History stays the same if a food is edited later, and daily totals come from a plain `SUM` with no joins.
- Row-level security: users read and write only rows where `user_id = auth.uid()`. USDA foods can be read by everyone. Custom foods can be read only by `created_by`.

## Class Diagram (app)

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
classDiagram
    direction LR

    class AuthService {
        +signInWithGoogle()
        +signInWithApple()
        +signOut()
        +currentUser() User
    }
    class FoodService {
        +search(query) Food[]
        +createCustom(food) Food
    }
    class LogService {
        +add(foodId, meal, servings, date) LogEntry
        +update(entry) LogEntry
        +remove(entryId)
        +entriesFor(date) LogEntry[]
        +summaryFor(date) DailySummary
    }

    class User {
        +id
        +email
        +displayName
        +targets Nutrients
    }
    class Food {
        +id
        +source FoodSource
        +name
        +brand
        +servingSize
        +servingUnit
        +perServing Nutrients
    }
    class LogEntry {
        +id
        +foodId
        +date
        +meal MealType
        +servings
        +nutrients Nutrients
    }
    class DailySummary {
        +date
        +totals Nutrients
        +targets Nutrients
        +byMeal Map~MealType, LogEntry[]~
    }
    class Nutrients {
        +kcal
        +proteinG
        +carbsG
        +fatG
        +times(servings) Nutrients
    }
    class MealType {
        <<enumeration>>
        breakfast
        lunch
        dinner
        snack
    }
    class FoodSource {
        <<enumeration>>
        usda
        custom
    }

    AuthService --> User : provides
    FoodService --> Food : returns
    LogService --> LogEntry : manages
    LogService --> DailySummary : builds
    LogEntry --> Food : refers to
    User *-- Nutrients
    Food *-- Nutrients
    LogEntry *-- Nutrients
    DailySummary *-- Nutrients
    LogEntry --> MealType
    Food --> FoodSource
```

The three services are thin wrappers around the Supabase client (`FoodService.search` calls the edge function). The models match the tables one-to-one. `Nutrients` is the only shared value type.

## Later (not MVP)

- **Barcode scan:** add Open Food Facts (free, no key) as a third `FoodSource`.
- **Label photo:** on-device OCR fills in the custom-food form.
