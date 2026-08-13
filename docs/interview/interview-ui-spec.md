# Interview Module - UI Specifications

## Design System Integration

- Follow TITAN design system and component library
- Use consistent color palette and typography
- Maintain spacing and layout consistency across all interview screens

## Color Palette

- Primary: #3B82F6 (Blue)
- Secondary: #10B981 (Green)
- Accent: #F59E0B (Amber)
- Success: #10B981 (Green)
- Warning: #EF4444 (Red)
- Neutral: #6B7280 (Gray)
- Background: #F9FAFB (Light Gray)

## Typography

- Headlines: Poppins, Bold, 28px
- Subheadings: Poppins, SemiBold, 18px
- Body Text: Inter, Regular, 14px
- Labels: Inter, Medium, 12px
- Code/Mono: Courier New, 12px

## Component Specifications

### Interview Setup Card

- Max Width: 600px
- Padding: 24px
- Border Radius: 12px
- Background: White
- Shadow: Subtle elevation shadow
- Responsive: Stack elements on mobile

### Question Display

- Font Size: 16px
- Line Height: 1.6
- Color: #1F2937 (Dark Gray)
- Padding: 20px
- Max Width: 100%

### Response Input Area

- Min Height: 120px
- Max Height: 300px
- Border: 1px solid #E5E7EB
- Border Radius: 8px
- Padding: 12px
- Font: 14px, Inter
- Placeholder: Light gray

### Timer Display

- Font Size: 24px
- Font Weight: Bold
- Color: #3B82F6
- Format: MM:SS
- Update Interval: Every second

### Score Display

- Large Number: 48px, Bold
- Subtext: 14px, Medium
- Progress Bar: 100% width, 8px height
- Color Gradient: Green to Blue

### Feedback Section

- Background: #F3F4F6
- Padding: 16px
- Border Left: 4px solid #3B82F6
- Border Radius: 4px
- Font Size: 14px

## Button Specifications

### Primary Button

- Background: #3B82F6
- Text Color: White
- Padding: 12px 24px
- Border Radius: 8px
- Font Weight: 600
- Hover: #2563EB
- Active: #1D4ED8

### Secondary Button

- Background: White
- Border: 1px solid #3B82F6
- Text Color: #3B82F6
- Padding: 12px 24px
- Border Radius: 8px
- Hover: #F0F9FF

### Tertiary Button

- Background: Transparent
- Text Color: #6B7280
- Padding: 8px 16px
- Hover: #E5E7EB

## Responsive Design

- Desktop: 1920px and above
- Tablet: 768px to 1919px
- Mobile: Below 768px

### Mobile Adjustments

- Full width buttons
- Larger touch targets (44px minimum)
- Single column layout
- Larger font sizes: +2px
- Increased padding

## Accessibility

- WCAG 2.1 AA compliance
- Minimum contrast ratio: 4.5:1
- Focus indicators: 2px solid #3B82F6
- Keyboard navigation support
- Screen reader friendly labels
- Alternative text for all icons

## Animation & Transitions

- Button hover: 200ms ease-in-out
- Modal slide-in: 300ms cubic-bezier
- Score counter: 1s ease-out
- Feedback fade-in: 400ms ease-in
- Page transitions: 300ms fade
