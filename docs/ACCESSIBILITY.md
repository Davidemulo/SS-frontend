# Accessibility Compliance Guide (WCAG 2.1 AA)

This document outlines accessibility improvements implemented across StellarSettle to meet WCAG 2.1 AA compliance standards.

## Keyboard Navigation

### Interactive Elements
- All buttons and links have visible focus states via `focus-visible` pseudo-class
- Tab order follows logical document flow
- Escape key closes dialogs and dropdowns
- Enter/Space activates buttons and checkbox inputs

### Form Controls
- All form inputs have associated `<label>` elements with matching `htmlFor` attributes
- Error messages linked to inputs via `aria-describedby`
- Required fields marked with `aria-required="true"`
- Form submission validates and announces errors to screen readers

## Screen Reader Support

### ARIA Labels
- Dialog elements use `aria-label` or `aria-labelledby`
- Icon-only buttons include `aria-label` descriptions
- Dynamic content updates announced via `aria-live` regions
- List items marked with `role="listitem"` for clarity

### Page Structure
- Semantic HTML: `<main>`, `<nav>`, `<section>`, `<article>`
- Heading hierarchy follows logical flow (no skipped levels)
- Image alt text describes content (decorative images use `aria-hidden="true"`)
- Tables include `<thead>`, `<tbody>` and row/column headers

## Visual Accessibility

### Color Contrast
- Text/background contrast meets 4.5:1 ratio (AA standard)
- Color not used as sole identifier (icons + color for status)
- Focus indicators have 3:1 contrast ratio
- Warning/error colors paired with icons and text

### Text & Readability
- Minimum 14px font size for body text
- Line height ≥ 1.5 for readability
- Maximum 80 characters per line (promotes scanning)
- Text can be resized up to 200% without loss of function

### Motion & Animation
- Animations respect `prefers-reduced-motion` media query
- Auto-playing content can be paused/stopped
- No content flashes more than 3x per second

## Component-Specific Improvements

### ActivityFeed (#457)
- Export button includes `aria-label="Export activity history as CSV"`
- Date range inputs have labels and ARIA descriptions
- Filter select includes accessible label
- Activity event cards have semantic structure

### InvoiceFraudReport (#442)
- Dialog includes `aria-label` and `aria-describedby`
- Radio button options properly labeled
- Text area has `aria-required="true"`
- Submit button disabled state clearly indicated

### InvoiceMaturityCountdown (#460)
- Countdown displays semantic date information
- Urgent/Critical badges include descriptive labels
- Numeric information (days) available as text
- Card heading uses `<CardTitle>` with proper hierarchy

### Forms & Inputs
- All inputs have associated labels (visible or aria-label)
- Checkbox/radio groups use `<fieldset>` and `<legend>`
- Select elements properly labeled
- Textarea includes row/column hints

## Testing

### Automated Testing
```bash
npm run test:a11y
```

Tests check for:
- Missing alt text on images
- Color contrast violations
- Missing form labels
- Improper heading hierarchy
- Missing ARIA landmarks
- Keyboard accessibility

### Manual Testing
1. **Keyboard only**: Navigate entire app using Tab/Shift+Tab, Enter, Escape, Arrow keys
2. **Screen reader**: Test with NVDA (Windows), JAWS, or VoiceOver (Mac/iOS)
3. **Zoom**: Resize text to 200% and verify layout works
4. **Color blindness**: Test with color blindness simulation tools

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessibility Insights](https://accessibilityinsights.io/)

## Ongoing Maintenance

- Review accessibility on every component addition
- Test with real assistive technologies before release
- Monitor for color contrast in custom themes
- Keep dependencies updated for a11y patches
