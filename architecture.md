# Architecture.md — Current System Architecture

## Current Implementation (v1.0)

The application currently uses a **direct component-to-database** architecture that prioritizes simplicity and functionality.

### 🏗️ **CURRENT ARCHITECTURE**

#### **Data Flow Pattern**
```
User Action → Component → Hook → Supabase → UI Update
```

#### **Component Structure**
```
Dashboard Page (Client Component)
├── useMountainCompletions (Custom Hook)
│   ├── Direct Supabase queries
│   ├── toggleMountain() - marks mountain as completed/uncompleted
│   ├── setCompletionDate() - sets optional hiking date
│   └── getCompletionData() - retrieves completion details
├── ProgressCounter - displays X/100 progress
├── DifficultyBreakdown - shows progress by difficulty level
├── BadgeDisplay - achievement system
├── MountainDateDisplay - optional date picker
└── Mountain Cards - grouped by region, clickable
```

### 🗄️ **DATABASE SCHEMA**

#### **Core Tables**
```sql
-- User profiles
users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  username TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Mountain data
mountains (
  id TEXT PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  region TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  elevation_m INTEGER NOT NULL,
  difficulty TEXT, -- ★ to ★★★★
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- User completions
user_mountains (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mountain_id TEXT REFERENCES mountains(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hiked_on DATE NULL, -- Optional hiking date
  source TEXT DEFAULT 'manual',
  PRIMARY KEY (user_id, mountain_id)
)
```

#### **Security & Performance**
- **Row Level Security (RLS)** enabled on all tables
- **Indexes** on frequently queried columns
- **Foreign key constraints** for data integrity
- **Auth policies** ensure users only access their own data

### 🔧 **CURRENT DATA MANAGEMENT**

#### **Custom Hooks**
```typescript
// useMountainCompletions.ts
- Manages mountain completion state
- Handles toggle operations (complete/uncomplete)
- Manages optional hiking dates
- Provides completion data to components

// useAuth.ts  
- Manages authentication state
- Handles sign in/out operations
- Provides user context

// useToast.tsx
- Toast notification system
- Success/error feedback
- Auto-dismiss functionality
```

#### **Data Fetching Pattern**
```typescript
// Direct Supabase queries in hooks
const { data, error } = await supabase
  .from('user_mountains')
  .select('mountain_id, completed_at, hiked_on')
  .eq('user_id', user.id);

// Optimistic updates for better UX
setCompletedIds(prev => [...prev, mountainId]);
// Then sync with server
```

### 🌐 **INTERNATIONALIZATION (i18n)**

#### **Language Support**
- **English** (en) - Default
- **Japanese** (ja) - 日本語  
- **Chinese** (zh) - 中文

#### **Translation Structure**
```json
// src/lib/i18n/messages/[locale].json
{
  "title": "Japan's 100 Famous Mountains Tracker",
  "progressByDifficulty": "Progress by Difficulty",
  "achievements": "Achievements",
  "regions": {
    "北海道": "Hokkaido",
    "関東": "Kanto",
    // ... all regions
  },
  "badges": {
    "firstStep": { "title": "First Step", "description": "..." }
  }
}
```

#### **Component Integration**
```typescript
// All components use useTranslations()
const t = useTranslations();
return <h1>{t('title')}</h1>;
```

### 🎨 **USER INTERFACE ARCHITECTURE**

#### **Component Hierarchy**
```
Dashboard Page
├── Header (Title + Language Switcher + Auth)
├── Progress Section
│   ├── ProgressCounter (X/100)
│   ├── DifficultyBreakdown (★ bars)
│   └── BadgeDisplay (Achievements)
├── Mountains Section
│   └── Region Groups
│       └── Mountain Cards
│           ├── MountainName
│           └── MountainDateDisplay (if completed)
└── Footer (Instructions)
```

#### **Styling System**
- **Tailwind CSS** for utility-first styling
- **Responsive design** with mobile-first approach
- **Custom CSS** for mountain card animations
- **Color system** for completion states

### 🔄 **STATE MANAGEMENT**

#### **Current Approach**
- **React Hooks** for local state
- **Custom hooks** for shared logic
- **Context** for global state (auth, toasts)
- **Direct Supabase** for data persistence

#### **State Flow**
```
User Action → Hook → Supabase Query → State Update → UI Re-render
```

### 🚀 **DEPLOYMENT & PERFORMANCE**

#### **Build System**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **ESLint** for code quality
- **Tailwind CSS** for styling

#### **Performance Optimizations**
- **Database indexes** on frequently queried columns
- **Optimistic updates** for better UX
- **Client-side caching** via React state
- **Lazy loading** for non-critical components

### 🔮 **FUTURE ARCHITECTURE CONSIDERATIONS**

#### **Potential Improvements**
1. **Snapshot Pattern**: Centralized data fetching via RPCs
2. **Server Components**: Move data fetching to server-side
3. **Caching Layer**: Redis for frequently accessed data
4. **Real-time Updates**: WebSocket connections for live updates

#### **Scalability Considerations**
- **Database partitioning** by user_id for large datasets
- **CDN integration** for static assets
- **Edge functions** for global performance
- **Database connection pooling** for high concurrency

### 📊 **MONITORING & DEBUGGING**

#### **Current Debugging**
- **Console logging** in development
- **Supabase dashboard** for query monitoring
- **Browser dev tools** for performance analysis
- **Error boundaries** for graceful error handling

#### **Production Monitoring**
- **Vercel Analytics** for performance metrics
- **Supabase logs** for database performance
- **Error tracking** via toast notifications
- **User feedback** through completion tracking