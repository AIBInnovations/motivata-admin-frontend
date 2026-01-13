# UI Components Guide

This guide documents the reusable UI components following modern design principles and best practices.

## Design Principles

This redesign follows the **CRAP Framework**:
- **Contrast**: Clear visual hierarchy with gradients, shadows, and color differentiation
- **Repetition**: Consistent spacing, rounded corners (xl), and transition effects
- **Alignment**: Everything properly aligned using Flexbox/Grid
- **Proximity**: Related elements grouped together with appropriate spacing

## Core Components

### 1. Button Component
Location: `src/components/ui/Button.jsx`

A versatile button component with multiple variants and sizes.

```jsx
import Button from '../components/ui/Button';
import { Plus, Download } from 'lucide-react';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>

// With icons
<Button icon={Plus} iconPosition="left">Add Item</Button>
<Button icon={Download} iconPosition="right">Download</Button>

// With sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Loading state
<Button loading>Loading...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'link'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `icon`: Lucide icon component
- `iconPosition`: 'left' | 'right'
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean

---

### 2. Badge Component
Location: `src/components/ui/Badge.jsx`

Display status indicators, counts, and labels.

```jsx
import Badge from '../components/ui/Badge';
import { Check } from 'lucide-react';

// Basic usage
<Badge>Default</Badge>

// With variants
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Inactive</Badge>

// With icon
<Badge variant="success" icon={Check}>Verified</Badge>

// Rounded pill style
<Badge rounded>10</Badge>

// With sizes
<Badge size="xs">XS</Badge>
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

**Props:**
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'solid' | 'outline'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `icon`: Lucide icon component
- `rounded`: boolean (pill style)

---

### 3. StatCard Component
Location: `src/components/ui/StatCard.jsx`

Display statistics with trends and visual hierarchy.

```jsx
import StatCard from '../components/ui/StatCard';
import { Users, DollarSign, Activity } from 'lucide-react';

// Basic usage
<StatCard
  title="Total Users"
  value="2,543"
  icon={Users}
  color="blue"
/>

// With trend
<StatCard
  title="Revenue"
  value="$45,231"
  subtitle="Last 30 days"
  icon={DollarSign}
  trend="+12.5%"
  trendDirection="up"
  color="green"
/>

// With click handler
<StatCard
  title="Active Sessions"
  value="127"
  icon={Activity}
  color="purple"
  onClick={() => navigate('/sessions')}
/>

// Loading state
<StatCard loading />
```

**Props:**
- `title`: string (label for the stat)
- `value`: string | number (main value)
- `subtitle`: string (optional description)
- `icon`: Lucide icon component
- `color`: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan'
- `trend`: string (e.g., "+12.5%")
- `trendDirection`: 'up' | 'down' | 'neutral'
- `loading`: boolean
- `onClick`: function (makes card clickable)

---

### 4. Card Component
Location: `src/components/ui/Card.jsx`

Enhanced wrapper component for consistent styling.

```jsx
import Card from '../components/ui/Card';

// Basic usage
<Card>
  <p>Card content</p>
</Card>

// With title
<Card title="User Statistics">
  <p>Content here</p>
</Card>

// With title and subtitle
<Card
  title="Analytics Dashboard"
  subtitle="Real-time insights"
>
  <p>Content here</p>
</Card>

// With header action
<Card
  title="Recent Activity"
  headerAction={
    <Button size="sm" variant="secondary">View All</Button>
  }
>
  <p>Content here</p>
</Card>

// With variants
<Card variant="default">Default Card</Card>
<Card variant="elevated">Elevated Card</Card>
<Card variant="bordered">Bordered Card</Card>
<Card variant="gradient">Gradient Card</Card>

// Hoverable
<Card hoverable onClick={() => console.log('clicked')}>
  Clickable card with hover effect
</Card>

// Loading state
<Card loading />

// No padding (useful for tables)
<Card noPadding>
  <table>...</table>
</Card>
```

**Props:**
- `title`: string
- `subtitle`: string
- `headerAction`: ReactNode
- `variant`: 'default' | 'elevated' | 'bordered' | 'gradient' | 'flat'
- `hoverable`: boolean
- `loading`: boolean
- `onClick`: function
- `noPadding`: boolean

---

### 5. Table Component
Location: `src/components/ui/Table.jsx`

Responsive table with mobile card fallback.

```jsx
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';

const columns = [
  {
    header: 'Name',
    accessor: 'name',
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (row) => (
      <Badge variant={row.status === 'active' ? 'success' : 'danger'}>
        {row.status}
      </Badge>
    ),
  },
  {
    header: 'Email',
    accessor: 'email',
    className: 'hidden lg:table-cell', // Hide on mobile
  },
];

const data = [
  { name: 'John Doe', status: 'active', email: 'john@example.com' },
  { name: 'Jane Smith', status: 'inactive', email: 'jane@example.com' },
];

// Basic usage
<Table columns={columns} data={data} />

// With row click handler
<Table
  columns={columns}
  data={data}
  onRowClick={(row) => console.log('Clicked:', row)}
/>

// Loading state
<Table columns={columns} data={[]} loading />

// Custom empty message
<Table
  columns={columns}
  data={[]}
  emptyMessage="No users found"
/>
```

**Props:**
- `columns`: Array of column definitions
  - `header`: string (column label)
  - `accessor`: string (data key) or custom render
  - `render`: function (custom cell renderer)
  - `className`: string (column styles)
  - `cellClassName`: string (cell styles)
- `data`: Array of row objects
- `onRowClick`: function
- `emptyMessage`: string
- `loading`: boolean

---

## Layout Components

### Header Component
Location: `src/components/Header.jsx`

**Features:**
- Clean, minimal design with hamburger menu
- Search bar (expandable on mobile)
- Notification bell with badge count
- Date display on desktop
- Profile removed (now in sidebar)

### Sidebar Component
Location: `src/components/Sidebar.jsx`

**Features:**
- Responsive (overlay on mobile, static on desktop)
- Collapsible on desktop (icon-only mode)
- Profile section with avatar (initials), name, email, and role badge
- Profile positioned ABOVE logout button
- Online status indicator
- Smooth animations and hover effects
- Custom scrollbar
- Active menu item highlighting

---

## Responsive Design

### Breakpoints
- Mobile: < 640px (sm)
- Tablet: 640px - 1023px (md-lg)
- Desktop: ≥ 1024px (lg+)

### Best Practices
1. **Mobile First**: Design for mobile, enhance for desktop
2. **Touch Targets**: Minimum 44x44px for touch elements
3. **Readable Text**: Minimum 16px font size on mobile
4. **Spacing**: Use Tailwind's spacing scale (4, 6, 8, 12, 16, 24)
5. **Grid Layouts**: Use responsive grid classes
   ```jsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
   ```

---

## Color Palette

### Primary Colors
- Blue: Brand color, primary actions
- Gray: Text, backgrounds, borders

### Semantic Colors
- Green: Success, positive trends
- Red: Danger, errors, negative trends
- Yellow/Orange: Warning, pending states
- Cyan: Info, neutral highlights
- Purple: Special features, premium

### Usage
```jsx
// Backgrounds
bg-blue-600, bg-green-500, bg-red-600

// Text
text-blue-600, text-green-700, text-red-600

// Borders
border-blue-200, border-green-300

// Gradients
bg-gradient-to-r from-blue-600 to-blue-700
```

---

## Animations & Transitions

### Standard Transitions
```jsx
transition-all duration-200 ease-in-out
```

### Hover Effects
```jsx
hover:scale-105 active:scale-95
hover:shadow-lg
hover:translate-x-1
```

### Loading States
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded" />
</div>
```

---

## Accessibility

1. **Semantic HTML**: Use proper HTML elements
2. **ARIA Labels**: Add `aria-label` to icon-only buttons
3. **Focus States**: Visible focus rings (ring-2 ring-blue-500)
4. **Keyboard Navigation**: All interactive elements keyboard accessible
5. **Color Contrast**: WCAG AA compliant (4.5:1 minimum)

---

## Examples

### Dashboard Stats Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
  <StatCard
    title="Total Users"
    value="2,543"
    icon={Users}
    trend="+12%"
    trendDirection="up"
    color="blue"
  />
  <StatCard
    title="Revenue"
    value="$45,231"
    icon={DollarSign}
    trend="+8.2%"
    trendDirection="up"
    color="green"
  />
  <StatCard
    title="Active Sessions"
    value="127"
    icon={Activity}
    trend="-3%"
    trendDirection="down"
    color="orange"
  />
  <StatCard
    title="Conversion Rate"
    value="3.24%"
    icon={TrendingUp}
    trend="+0.4%"
    trendDirection="up"
    color="purple"
  />
</div>
```

### User Management Table
```jsx
<Card title="User Management" subtitle="Manage all users">
  <Table
    columns={[
      { header: 'Name', accessor: 'name' },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => (
          <Badge variant={row.active ? 'success' : 'danger'}>
            {row.active ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      { header: 'Email', accessor: 'email' },
      {
        header: 'Actions',
        render: (row) => (
          <div className="flex gap-2">
            <Button size="xs" variant="ghost">Edit</Button>
            <Button size="xs" variant="danger">Delete</Button>
          </div>
        )
      }
    ]}
    data={users}
    onRowClick={(user) => navigate(`/users/${user.id}`)}
  />
</Card>
```

---

## Tips

1. **Consistency**: Use the same spacing, colors, and components throughout
2. **Performance**: Use loading states for async operations
3. **Feedback**: Provide visual feedback for user actions (hover, active states)
4. **Whitespace**: Don't be afraid of empty space - it improves readability
5. **Mobile Testing**: Always test on actual mobile devices or browser dev tools

---

## Future Enhancements

- [ ] Add Toast notification system
- [ ] Create Modal/Dialog component
- [ ] Add Dropdown/Select component
- [ ] Create Tabs component
- [ ] Add Tooltip component
- [ ] Create DatePicker component
- [ ] Add Chart components (using recharts or chart.js)

---

For questions or suggestions, please create an issue in the repository.
