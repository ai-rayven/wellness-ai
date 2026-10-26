# Sano MVP: Nutrition + Weight Logging

## MVP scope

**Sign in**
- Google and Apple sign-in through Firebase Auth. Apple sign-in is required on iOS whenever Google is offered.
- Daily calorie and macro targets are entered by hand in the profile.

**Nutrition logging**
1. Search for a food by name. Results come from USDA FoodData Central (a free third-party API).
2. Choose a result, a meal (breakfast, lunch, dinner or snack) and the number of servings, then log it.
3. If a food isn't found, create a custom food by typing in the label values.
4. The Today view shows entries grouped by meal and totals against targets. Earlier days can be browsed.
5. Entries can be edited or deleted.

**Weight logging**
1. Log a weight (lb or kg) for a day, at most one per day. Logging again replaces that day's value.
2. See a list of entries and a simple trend chart (30 and 90 days).
3. Entries can be edited or deleted.

**Not in MVP:** barcode scanning, label photos, AI coach, recipes, pantry, onboarding quiz, reminders.

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
    usda(("USDA<br/>FoodData Central"))

    subgraph fb["Firebase project"]
        hosting["Hosting<br/>PWA files"]
        app(("Sano App"))
        auth(("Auth"))
        fn(("Cloud Function<br/>searchFoods"))
        secret["Secret Manager<br/>USDA API key"]
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
    fn -->|"Query"| usda
    fn -->|"Cache results"| foods

    classDef service fill:#e8efff,stroke:#5474b4,stroke-width:2px
    classDef store fill:#f0e8fa,stroke:#8b6aad,stroke-width:2px
    classDef artifact fill:#fff6dd,stroke:#bfa15b
    classDef external fill:#f3f3f3,stroke:#888
    class app,auth,fn service
    class users,foods,logs,weights store
    class hosting,secret artifact
    class social,usda external
```

- The app reads and writes Firestore directly through the Firebase SDK. Security Rules make sure each user can only access their own data.
- Only the `searchFoods` function talks to USDA, so the API key never ships in the app. Switching food APIs later means changing only this function.
- Cloud Functions and Secret Manager require the **Blaze** (pay-as-you-go) plan. At MVP traffic, usage stays within the free allowance.

## Data model (Firestore)

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
erDiagram
    users ||--o{ logEntries : "subcollection"
    users ||--o{ weights : "subcollection"
    foods ||--o{ logEntries : "foodId"
    users |o--o{ foods : "createdBy (custom)"

    users {
        string id PK "Auth uid"
        string displayName
        string email
        map targets "kcal, proteinG, carbsG, fatG"
        string weightUnit "lb | kg"
        timestamp createdAt
    }
    foods {
        string id PK "usda_fdcId or auto id"
        string source "usda | custom"
        string sourceId "USDA fdcId"
        string name
        string brand
        number servingSize
        string servingUnit "g, ml, piece"
        map nutrients "per serving"
        string createdBy FK "uid, custom only"
    }
    logEntries {
        string id PK "auto id"
        string date "YYYY-MM-DD"
        string meal "breakfast | lunch | dinner | snack"
        string foodId FK
        string foodName "copy for display"
        number servings
        map nutrients "copy: food x servings"
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
| `users/{uid}/logEntries/{id}` | Owner only |
| `users/{uid}/weights/{date}` | Owner only |
| `foods/{id}` | USDA foods: anyone signed in can read, only the function writes. Custom foods: creator only |

- Each log entry stores copies of the food's name and nutrients. A day's view then takes a single query by `date`, and history doesn't change if a food is edited later.
- A weight's document id is its date, which enforces one entry per day. Weights are stored in kg and converted for display using `weightUnit`.

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
        +source FoodSource
        +name
        +brand
        +servingSize
        +servingUnit
        +nutrients Nutrients
    }
    class LogEntry {
        +id
        +date
        +meal MealType
        +foodId
        +foodName
        +servings
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
        +times(n) Nutrients
        +plus(other) Nutrients
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
    Food --> FoodSource
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
        +createCustom(Food) Food
    }
    class LogService {
        +add(food, meal, servings, date) LogEntry
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

Each service is a thin wrapper around the Firebase SDK. `FoodService.search` is the only one that goes through Cloud Functions.
