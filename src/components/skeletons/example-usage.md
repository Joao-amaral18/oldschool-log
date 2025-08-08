# Skeleton Loading Components Usage

## Basic Components

### Skeleton (Base Component)
```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Different variants
<Skeleton variant="text" />          // Default text line
<Skeleton variant="avatar" />        // Circle/square avatar
<Skeleton variant="button" />        // Button shape
<Skeleton variant="card" />          // Card container
<Skeleton variant="image" />         // Image placeholder

// Custom dimensions
<Skeleton width="200px" height="40px" />
<Skeleton variant="text" lines={3} />  // Multiple text lines
```

### Pre-built Page Skeletons
```tsx
import { 
  TemplateListSkeleton,
  TreinoPageSkeleton,
  TemplateEditorSkeleton,
  SessionSkeleton,
  ExercisePickerSkeleton
} from '@/components/skeletons/PageSkeletons'

// Use directly in pages
function TemplatesPage() {
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState([])

  if (loading) {
    return <TemplateListSkeleton />
  }

  return (
    // Your actual content
  )
}
```

## Integration Examples

### Templates List Page
```tsx
// src/pages/templates/list.tsx
import { TemplateListSkeleton } from '@/components/skeletons/PageSkeletons'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true) // Start with loading true

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.fetchWorkoutTemplates()
      setTemplates(data)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar templates')
    } finally {
      setLoading(false) // Set loading false when done
    }
  }

  useEffect(() => {
    if (!session) {
      navigate('/login')
      return
    }
    load()
  }, [session])

  // Show skeleton while loading
  if (loading) {
    return <TemplateListSkeleton />
  }

  return (
    // Your existing JSX
  )
}
```

### Template Editor Page
```tsx
// src/pages/templates/editor.tsx
import { TemplateEditorSkeleton } from '@/components/skeletons/PageSkeletons'

export default function TemplateEditorPage() {
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  // Show skeleton until template is loaded
  if (loading || !template) {
    return <TemplateEditorSkeleton />
  }

  return (
    // Your existing editor JSX
  )
}
```

### Exercise Picker Modal
```tsx
// In modal context or component
import { ExercisePickerSkeleton } from '@/components/skeletons/PageSkeletons'

function ExercisePickerModal({ exercises, loading }) {
  return (
    <Dialog>
      <DialogContent>
        {loading ? (
          <ExercisePickerSkeleton />
        ) : (
          // Your exercise list
        )}
      </DialogContent>
    </Dialog>
  )
}
```

## Custom Skeletons

### Form Skeleton
```tsx
import { SkeletonForm } from '@/components/ui/skeleton'

function MyFormPage() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <SkeletonForm />
  }

  return (
    // Your form
  )
}
```

### List Skeleton
```tsx
import { SkeletonList } from '@/components/ui/skeleton'

function MyListComponent() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <SkeletonList items={5} /> // Show 5 skeleton items
  }

  return (
    // Your list
  )
}
```

### Table Skeleton
```tsx
import { SkeletonTable } from '@/components/ui/skeleton'

function MyTableComponent() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <SkeletonTable rows={8} cols={4} />
  }

  return (
    // Your table
  )
}
```

## Best Practices

1. **Always start with loading=true** for initial page loads
2. **Match skeleton structure** to your actual content layout
3. **Use consistent spacing** - skeletons should align with real content
4. **Show skeletons for minimum 300ms** to avoid flashing
5. **Combine with error states** - don't just show skeleton on error

### Loading States Pattern
```tsx
function MyComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (loading) return <MySkeleton />
  if (error) return <ErrorMessage />
  if (!data) return <EmptyState />
  
  return <MyContent data={data} />
}
```

## Accessibility

The skeleton components include:
- Proper contrast ratios for visibility
- Smooth animations that respect prefers-reduced-motion
- Semantic structure matching real content
- ARIA labels where appropriate

## Responsive Design

All skeleton components are fully responsive and will:
- Adapt to container width
- Stack properly on mobile
- Maintain proportions across screen sizes
- Use appropriate spacing for each breakpoint
