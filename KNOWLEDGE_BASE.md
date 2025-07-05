# Everafter - Knowledge Base Documentation

## Project Overview

**Everafter** is a premium visual storytelling brand offering photography and videography services tailored for families, businesses, and weddings. The platform combines emotional storytelling with cinematic visuals to turn moments into timeless memories.

### Key Features
- **Public Portfolio**: Showcasing curated galleries and services
- **Protected Packages**: Wedding packages accessible to authenticated users
- **Interactive Galleries**: Bento-style galleries with like functionality
- **Authentication System**: Email/password + Google OAuth integration
- **Responsive Design**: Mobile-first approach with premium aesthetics
- **Real-time Features**: WebSocket integration for enhanced user experience

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM v6
- **State Management**: React Context + hooks
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend & Infrastructure
- **Backend**: Supabase (PostgreSQL + Authentication + Storage)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with Google OAuth
- **File Storage**: Supabase Storage buckets
- **Real-time**: Supabase real-time subscriptions

### Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.49.8",
  "@tanstack/react-query": "^5.56.2",
  "framer-motion": "^12.23.0",
  "react-router-dom": "^6.26.2",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.462.0"
}
```

---

## Database Schema

### Core Tables

#### `profiles`
```sql
- id: uuid (Primary Key, references auth.users)
- name: text (nullable)
- avatar_url: text (nullable)
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

#### `appointments`
```sql
- id: uuid (Primary Key, auto-generated)
- user_id: uuid (nullable, references profiles)
- appointment_date: date
- appointment_time: text
- service_id: text
- address: text
- notes: text (nullable)
- status: text (default: 'pending')
- created_at: timestamp with time zone
```

#### `n8n_chat_histories`
```sql
- id: integer (Primary Key, auto-increment)
- session_id: varchar
- message: jsonb
```

### Row Level Security (RLS)
All tables implement RLS policies:
- **profiles**: Users can view/update their own profiles
- **appointments**: Users can view/create their own appointments
- **n8n_chat_histories**: No RLS (system table)

---

## Authentication System

### Implementation
- **Provider**: Supabase Auth
- **Methods**: Email/password + Google OAuth
- **Session Management**: Persistent sessions with auto-refresh
- **Protection**: Route-based authentication guards

### Auth Context Structure
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}
```

### Best Practices
- Clean up auth state before operations
- Use global sign-out for complete cleanup
- Force page refresh after auth operations
- Implement proper loading states

---

## Design System & UI Standards

### Color Palette
```css
/* Primary Brand Colors */
--rose-50: 255 241 242;
--rose-500: 244 63 94;
--rose-600: 225 29 72;
--pink-500: 236 72 153;
--pink-600: 219 39 119;

/* Gradients */
--gradient-primary: linear-gradient(135deg, hsl(var(--rose-500)), hsl(var(--pink-500)));
```

### Typography
- **Headings**: Bold with gradient text effects
- **Body**: Clean, readable fonts with proper contrast
- **Brand Voice**: Premium, warm, professional

### Component Patterns
- **Cards**: Hover effects with scale transforms and shadows
- **Buttons**: Gradient backgrounds with rounded corners
- **Loading States**: Heart icon with pulse animation
- **Modals**: Smooth animations with backdrop blur

---

## File Structure & Organization

```
src/
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── gallery/           # Gallery-specific components
│   │   └── ...
│   ├── auth/                  # Authentication components
│   ├── dashboard/             # Dashboard navigation
│   ├── quiz/                  # Quiz/consultation components
│   ├── wedding/               # Wedding-specific components
│   └── ...
├── contexts/                  # React contexts
├── data/                      # Static data and configurations
├── hooks/                     # Custom React hooks
├── integrations/              # Third-party integrations
│   └── supabase/
├── lib/                       # Utility functions
├── pages/                     # Route components
└── utils/                     # Helper functions
```

### Component Organization Principles
- **Feature-based**: Group related components together
- **Reusability**: Shared UI components in `/ui/`
- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Build complex UIs from simple components

---

## Development Patterns & Best Practices

### React Patterns
```typescript
// 1. Custom Hooks for Logic Separation
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // ... auth logic
  return { user, loading, signIn, signOut };
};

// 2. Component Composition
const PackageSection = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-16">
    {children}
  </div>
);

// 3. Proper TypeScript Interfaces
interface PackageCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}
```

### State Management
- **Local State**: useState for component-specific state
- **Global State**: React Context for shared state
- **Server State**: React Query for API data
- **Forms**: React Hook Form with Zod validation

### Error Handling
```typescript
// Graceful error boundaries
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="text-center p-8">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
  </div>
);

// Async error handling
try {
  await supabase.auth.signIn({ email, password });
} catch (error) {
  toast.error(error.message);
}
```

---

## Performance Optimization

### Code Splitting
- **Route-based**: Lazy load page components
- **Component-based**: Dynamic imports for heavy components
- **Bundle Analysis**: Regular bundle size monitoring

### Image Optimization
- **Lazy Loading**: Intersection Observer for galleries
- **Responsive Images**: Multiple sizes for different viewports
- **WebP Format**: Modern image formats with fallbacks

### Database Optimization
- **Indexes**: Proper indexing on frequently queried columns
- **RLS Optimization**: Efficient RLS policies
- **Query Optimization**: Minimal data fetching

---

## Security Best Practices

### Authentication Security
- **JWT Validation**: Proper token validation
- **Session Management**: Secure session handling
- **Route Protection**: Authentication guards on protected routes

### Database Security
- **RLS Policies**: Comprehensive row-level security
- **Input Sanitization**: Proper data validation
- **SQL Injection Prevention**: Parameterized queries

### Frontend Security
- **XSS Prevention**: Proper output encoding
- **CSRF Protection**: Token-based protection
- **Content Security Policy**: Restrictive CSP headers

---

## Testing Strategy

### Unit Testing
```typescript
// Component testing with React Testing Library
import { render, screen } from '@testing-library/react';
import { PackageCard } from './PackageCard';

test('renders package card with correct information', () => {
  render(<PackageCard name="Premium Package" price="$1200" />);
  expect(screen.getByText('Premium Package')).toBeInTheDocument();
});
```

### Integration Testing
- **API Integration**: Test Supabase interactions
- **Authentication Flow**: Test complete auth workflows
- **Form Submissions**: Test form handling and validation

### E2E Testing
- **Critical Paths**: User registration, package selection
- **Cross-browser**: Test on multiple browsers
- **Mobile Testing**: Responsive design validation

---

## Deployment & DevOps

### Environment Configuration
```typescript
// Environment-specific settings
const config = {
  supabase: {
    url: 'https://hmdnronxajctsrlgrhey.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  app: {
    name: 'Everafter',
    domain: 'everafter.lovable.app',
  }
};
```

### Build Process
1. **Type Checking**: TypeScript compilation
2. **Linting**: ESLint code quality checks
3. **Testing**: Automated test suite
4. **Bundle Optimization**: Vite build optimization
5. **Deployment**: Automated deployment pipeline

### Monitoring & Analytics
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Core Web Vitals tracking
- **User Analytics**: Behavioral analytics integration

---

## API Integration Patterns

### Supabase Client Usage
```typescript
// Singleton pattern
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Query patterns
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', user.id);
```

### Webhook Integration
```typescript
// External API integration
const sendWebhookMessage = async (message: string, user: User) => {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      userId: user.id,
      timestamp: new Date().toISOString(),
    }),
  });
};
```

---

## Maintenance & Updates

### Regular Maintenance Tasks
1. **Dependency Updates**: Monthly dependency reviews
2. **Security Patches**: Immediate security updates
3. **Performance Audits**: Quarterly performance reviews
4. **Database Maintenance**: Regular DB optimization

### Code Quality Standards
- **ESLint Configuration**: Strict linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **TypeScript**: Strict type checking enabled

### Documentation Updates
- **API Documentation**: Keep API docs current
- **Component Documentation**: Document component props
- **README Updates**: Regular README maintenance
- **Changelog**: Detailed change tracking

---

## Troubleshooting Guide

### Common Issues
1. **Authentication Limbo**: Clear auth state and refresh
2. **RLS Policy Errors**: Check user_id mapping
3. **Type Errors**: Ensure proper TypeScript interfaces
4. **Build Failures**: Check import paths and dependencies

### Debug Tools
- **React Developer Tools**: Component inspection
- **Supabase Dashboard**: Database and auth monitoring
- **Network Tab**: API request debugging
- **Console Logs**: Strategic logging for debugging

---

## Contributing Guidelines

### Code Standards
- Follow existing patterns and conventions
- Write self-documenting code
- Add proper TypeScript types
- Include unit tests for new features

### Git Workflow
- Feature branches for new development
- Descriptive commit messages
- Pull request reviews required
- Squash commits before merging

### Review Process
- Code review checklist
- Performance impact assessment
- Security review for sensitive changes
- Documentation updates required

---

*This knowledge base serves as the definitive guide for the Everafter project. Keep it updated as the project evolves and new patterns emerge.*