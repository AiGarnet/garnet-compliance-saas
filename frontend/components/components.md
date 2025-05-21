# Garnet AI Component Library

This document catalogs all components used in the Garnet AI application, organized using the Atomic Design methodology. This component library helps unify our codebase for improved front-end cohesion and consistency while minimizing redundant code.

## Table of Contents

- [Atoms](#atoms)
- [Molecules](#molecules)
- [Organisms](#organisms)
- [Templates](#templates)
- [Pages](#pages)

## Atoms

Atoms are the basic building blocks of our UI that cannot be broken down further.

### UI Elements

- **Card**: Base container component with multiple variants
  - Location: `components/ui/card/index.tsx`
  - Variants: 
    - Card
    - CardHeader
    - CardTitle  
    - CardDescription
    - CardContent
    - CardFooter

- **Alert**: Feedback component for user notifications
  - Location: `components/ui/Alert.tsx`

- **Tooltip**: Contextual information displayed on hover
  - Location: `components/ui/Tooltip.tsx`

- **Button**: Various button styles for actions
  - Used throughout the application
  - Variants: Primary, Secondary, Disabled

- **Icons**: Visual elements from Lucide React
  - Examples: ClipboardList, Filter, Plus, Search, SlidersHorizontal, X, Upload

### Form Elements

- **Input Field**: Text input components
  - Used in forms and search features

- **Textarea**: Multi-line text input 
  - Used in the questionnaire form

## Molecules

Molecules are groups of atoms bonded together to form relatively simple UI components.

- **SearchBar**: Compound component for search functionality
  - Location: `components/ui/SearchBar.tsx`

- **FilterPills**: Selectable filtering options
  - Location: `components/ui/FilterPills.tsx`

- **Breadcrumbs**: Navigation aid showing path hierarchy
  - Location: `components/ui/Breadcrumbs.tsx`

- **Form Groups**: Combinations of labels, inputs, and validation
  - Used in various forms throughout the application

## Organisms

Organisms are complex UI components composed of groups of molecules and/or atoms.

- **MobileNavigation**: Responsive navigation for mobile devices
  - Location: `components/MobileNavigation.tsx`

- **QuestionnaireList**: Complex component displaying questionnaire items
  - Location: `components/dashboard/QuestionnaireList.tsx`
  - Properties:
    - questionnaires: Array of questionnaire items
    - isLoading: Loading state indicator
    - error: Error message display
    - onRetry: Function to retry loading

- **DashboardLayout**: Layout structure for dashboard pages
  - Location: `components/DashboardLayout.tsx`

- **Modal Dialog**: Popup component used for the questionnaire input
  - Implemented in the questionnaires page

## Templates

Templates are page-level objects that place components into a layout and articulate the design's underlying content structure.

- **Dashboard Template**: Structure for dashboard views
  - Used in the dashboard pages

- **Questionnaire Input Template**: Layout for the questionnaire input functionality
  - Implemented in the questionnaires page

## Pages

Complete interfaces combining multiple organisms and templates.

- **Questionnaires Page**: Interface for managing questionnaires
  - Location: `app/questionnaires/page.tsx`
  - Features:
    - List of existing questionnaires
    - Modal for creating new questionnaires
    - Questionnaire input and file upload
    - AI-generated answers display

- **Dashboard Page**: Main dashboard interface
  - Location: `app/dashboard/page.tsx`

## Design Tokens

Our application uses consistent design tokens for maintaining visual coherence:

- **Colors**:
  - Primary: Used for buttons, active states, and emphasis
  - Gray scale: Used for text, borders, and backgrounds

- **Typography**:
  - Font sizes: From small (text-sm) to extra large (text-2xl)
  - Font weights: Regular, medium, semibold

- **Spacing**:
  - Consistent padding and margins using the tailwind scale

## Usage Guidelines

### Adding New Components

1. Follow the Atomic Design principles when creating new components
2. Ensure components are responsive and accessible
3. Add appropriate documentation within component files
4. Update this document when adding significant new components

### Component Naming Conventions

- Use PascalCase for component names (e.g., `CardTitle`)
- Use descriptive, purpose-indicating names

## Future Development

Planned enhancements to our component library:

- Standardize component props interfaces
- Add comprehensive testing for all components
- Create a visual showcase using Storybook
- Implement more comprehensive accessibility features

---

*This component library documentation is maintained by the Garnet AI development team. Last updated: [Current Date]* 