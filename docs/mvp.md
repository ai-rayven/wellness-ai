# Sano MVP: Nutrition + Weight Logging

## MVP scope

**Sign in**
- Google and Apple sign-in through Firebase Auth. Apple sign-in is required on iOS whenever Google is offered.
- Daily calorie and macro targets are entered by hand in the profile.

**Nutrition logging**
1. Search for a food by name. Results come from the Edamam Food Database API (Basic plan, $14/month after a 30-day trial).
2. Choose a result, a meal (breakfast, lunch, dinner or snack) and an amount (e.g. 2 slices or 150 g), then log it.
3. Logged foods are saved to the user's recent foods so they can be logged again without searching.
4. The Today view shows entries grouped by meal and totals against targets. Earlier days can be browsed.
5. Entries can be edited or deleted.

**Weight logging**
1. Log a weight (lb or kg) for a day, at most one per day. Logging again replaces that day's value.
2. See a list of entries and a simple trend chart (30 and 90 days).
3. Entries can be edited or deleted.

**Not in MVP:** custom foods, barcode scanning, label photos, AI coach, recipes, pantry, onboarding quiz, reminders.

## Firebase components

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
flowchart LR
    user(("User"))
    social(("Google / Apple"))
    edamam(("Edamam<br/>Food Database"))

    subgraph fb["Firebase project"]
        hosting["Hosting<br/>PWA files"]
        app(("Sano App"))
        auth(("Auth"))
        fn(("Cloud Function<br/>searchFoods"))
        secret["Secret Manager<br/>Edamam app ID + key"]
        subgraph fs["Cloud Firestore"]
            users[("users")]
            logs[("logEntries")]
            weights[("weights")]
            foods[("foods")]
        end
    end

    user -->|"Open"| hosting
    hosting -->|"Load"| app
    app -->|"Sign in"| auth
    auth -.->|"OAuth"| social
    app -->|"Read / write<br/>via Security Rules"| fs
    app -->|"Search name"| fn
    secret -.->|"Key"| fn
    fn -->|"Query"| edamam

    classDef service fill:#e8efff,stroke:#5474b4,stroke-width:2px
    classDef store fill:#f0e8fa,stroke:#8b6aad,stroke-width:2px
    classDef artifact fill:#fff6dd,stroke:#bfa15b
    classDef external fill:#f3f3f3,stroke:#888
    class app,auth,fn service
    class users,foods,logs,weights store
    class hosting,secret artifact
    class social,edamam external
```

- The app reads and writes Firestore directly through the Firebase SDK. Security Rules make sure each user can only access their own data.
- Only the `searchFoods` function talks to Edamam, so the API credentials never ship in the app. It only searches and never writes to Firestore. Switching food APIs later means changing only this function.
- Cloud Functions and Secret Manager require the **Blaze** (pay-as-you-go) plan. At MVP traffic, usage stays within the free allowance. Edamam Basic is the only fixed cost ($14/month after the trial).

## Data model (Firestore)

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
erDiagram
    users ||--o{ foods : "contains"
    users ||--o{ logEntries : "contains"
    users ||--o{ weights : "contains"
    foods ||--o{ logEntries : "foodId"

    users {
        string id PK "Auth uid"
        string displayName
        string email
        map targets "kcal, proteinG, carbsG, fatG"
        string weightUnit "lb | kg"
        timestamp createdAt
    }
    foods {
        string id PK "source_lookupId"
        string name
        string brand
        map nutrientsPer100g "kcal, proteinG, carbsG, fatG"
        array measures "label + grams"
        map metadata "source, lookupId, other provider ids"
        timestamp lastUsedAt
    }
    logEntries {
        string id PK "auto id"
        string date "YYYY-MM-DD"
        string meal "breakfast | lunch | dinner | snack"
        string foodId FK
        string foodName "copy for display"
        string measure "e.g. 1 slice"
        number quantity
        number grams
        map nutrients "computed totals"
        timestamp createdAt
    }
    weights {
        string id PK "YYYY-MM-DD"
        number weightKg
        timestamp createdAt
    }
```

| Path | Who can access |
| --- | --- |
| `users/{uid}` | Owner only |
| `users/{uid}/foods/{id}` | Owner only |
| `users/{uid}/logEntries/{id}` | Owner only |
| `users/{uid}/weights/{date}` | Owner only |

- Everything lives under the user, so one Security Rule (owner only) covers all of it.
- When a food is first logged, the app saves its full details to `foods`. The food's `metadata` holds where it came from (e.g. `{ source: "edamam", lookupId: "food_abc123" }`), and the document id is built from those two values, so the same food is saved only once per user.
- Edamam gives nutrients per 100 g plus measures (1 slice = 30 g). A log entry stores the chosen measure, quantity and grams, plus the computed nutrient totals. A day's view then takes a single query by `date`.
- A weight's document id is its date, which enforces one entry per day. Weights are stored in kg and converted for display using `weightUnit`.
- **Open item:** Edamam's terms limit storing its data. For the MVP we store food details anyway, so past logs stay correct if Edamam changes a food. Confirm the terms (or switch providers) before a wider launch.

## App entities

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
classDiagram
    direction LR

    class User {
        +id
        +displayName
        +email
        +targets Nutrients
        +weightUnit WeightUnit
    }
    class Food {
        +id
        +name
        +brand
        +nutrientsPer100g Nutrients
        +measures Measure[]
        +metadata FoodMetadata
        +lastUsedAt
    }
    class Measure {
        +label
        +grams
    }
    class FoodMetadata {
        +source
        +lookupId
    }
    class LogEntry {
        +id
        +date
        +meal MealType
        +foodId
        +foodName
        +measure
        +quantity
        +grams
        +nutrients Nutrients
    }
    class WeightEntry {
        +date
        +weightKg
        +display(unit) number
    }
    class DailySummary {
        +date
        +entries LogEntry[]
        +totals Nutrients
        +remaining(targets) Nutrients
    }
    class Nutrients {
        +kcal
        +proteinG
        +carbsG
        +fatG
        +scale(factor) Nutrients
        +plus(other) Nutrients
    }
    class MealType {
        <<enumeration>>
        breakfast
        lunch
        dinner
        snack
    }
    class WeightUnit {
        <<enumeration>>
        lb
        kg
    }

    User *-- Nutrients : targets
    Food *-- Nutrients
    LogEntry *-- Nutrients
    LogEntry --> Food : foodId
    LogEntry --> MealType
    Food *-- Measure
    Food *-- FoodMetadata
    User --> WeightUnit
    DailySummary o-- LogEntry
```

## App services

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
        +onUserChanged(cb)
    }
    class ProfileService {
        +get() User
        +updateTargets(Nutrients)
        +setWeightUnit(WeightUnit)
    }
    class FoodService {
        +search(name) Food[]
        +recent() Food[]
    }
    class LogService {
        +add(food, meal, measure, quantity, date) LogEntry
        +update(LogEntry)
        +remove(id)
        +day(date) DailySummary
    }
    class WeightService {
        +set(date, value, unit) WeightEntry
        +remove(date)
        +range(from, to) WeightEntry[]
    }

    AuthService ..> User : signs in
    ProfileService ..> User
    FoodService ..> Food : via searchFoods
    LogService ..> LogEntry
    LogService ..> DailySummary
    WeightService ..> WeightEntry
```

Each service is a thin wrapper around the Firebase SDK. `FoodService.search` is the only one that goes through Cloud Functions. `LogService.add` saves the food to the user's `foods` (if it isn't there yet) and writes the entry.
