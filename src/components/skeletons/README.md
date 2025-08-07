# Skeleton Loading System

A clean, minimal skeleton loading system with smooth shimmer animations designed for the Oldschool Log application.

## Features

- ✨ **Smooth shimmer animations** - Gentle 2-second loops with stone-based colors
- 🎨 **Dark theme optimized** - Uses stone-800 and stone-600 for subtle contrast
- 📱 **Fully responsive** - Adapts to all screen sizes
- ♿ **Accessible** - Respects motion preferences and maintains contrast
- 🧩 **Modular components** - Base components + page-specific layouts
- 🔧 **TypeScript support** - Fully typed with IntelliSense

## Colors & Animation

- **Light mode**: #E0E0E0 → #C0C0C0 → #E0E0E0
- **Dark mode**: stone-800 → stone-600 → stone-800
- **Duration**: 2 seconds ease-in-out infinite
- **Border radius**: 6-8px for consistency

## Quick Start

```tsx
import { Skeleton, TemplateListSkeleton } from '@/components/skeletons'

// Basic usage
<Skeleton variant="text" lines={3} />
<Skeleton variant="avatar" />
<Skeleton variant="button" width="120px" />

// Page-specific skeletons
function TemplatesPage() {
  if (loading) return <TemplateListSkeleton />
  return <div>Your content</div>
}
```

## Available Components

### Base Components
- `Skeleton` - Base component with variants (text, avatar, button, card, image)
- `SkeletonCard` - Card layout with avatar, text, and buttons
- `SkeletonList` - List of items with configurable count
- `SkeletonTable` - Table layout with headers and rows
- `SkeletonForm` - Form layout with fields and buttons

### Page-Specific Skeletons
- `TemplateListSkeleton` - For templates list page
- `TreinoPageSkeleton` - For workout selection page
- `TemplateEditorSkeleton` - For template editor with exercises
- `SessionSkeleton` - For workout session page
- `ExercisePickerSkeleton` - For exercise selection modal

## Integration Pattern

```tsx
function MyPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [])

  if (loading) return <MyPageSkeleton />
  return <div>{/* Your content */}</div>
}
```

## Design System Integration

The skeleton system integrates seamlessly with the existing design tokens:

- Uses `border-stone-800` for consistent borders
- Matches `rounded-xl` and `rounded-lg` border radius
- Respects `bg-card/50` opacity patterns
- Follows spacing conventions (p-4, p-6, gap-3, etc.)

## Performance

- CSS-only animations (no JavaScript)
- GPU-accelerated transforms
- Minimal DOM impact
- Respects `prefers-reduced-motion`

## Browser Support

- All modern browsers supporting CSS gradients and animations
- Graceful degradation for older browsers
- Hardware acceleration where available
