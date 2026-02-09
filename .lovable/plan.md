

## Accessibility Fixes Plan (No UI/UX Changes)

This plan addresses Lighthouse/PageSpeed accessibility issues by adding non-visual semantic attributes to the EverAfter codebase. All changes are purely accessibility-focused—no visual, layout, or behavioral modifications.

---

## Audit Summary: Accessibility Issues Found

| Issue Category | Components Affected | Lighthouse Report |
|----------------|---------------------|-------------------|
| Icon-only buttons missing accessible names | 12 components | "Buttons do not have an accessible name" |
| Links missing discernible names | 4 components | "Links do not have a discernible name" |
| Form inputs missing labels or IDs | 5 components | "Form elements do not have associated labels" |
| Form inputs missing autocomplete | 3 components | Form autocomplete improvements |
| Form error states missing aria-invalid | 2 components | Improve error accessibility |

---

## File-by-File Execution Plan

### 1. Icon-Only Buttons & Links (Task 1)

#### `src/components/ui/expandable-chat.tsx`
- **Line 87-93**: Add `aria-label="Close chat"` to the X button inside ExpandableChat
- **Line 147-162**: Add `aria-label` prop support to ExpandableChatToggle, defaulting to "Open chat" / "Close chat" based on `isOpen` state

#### `src/components/Contact.tsx`
- **Line 223-225**: Add `aria-label="Follow us on Instagram"` to Instagram icon link
- **Line 226-230**: Add `aria-label="Follow us on TikTok"` to TikTok icon link  
- **Line 231-235**: Add `aria-label="Message us on WhatsApp"` to WhatsApp icon link
- **Line 196-206**: Add `aria-label="Chat with us on WhatsApp"` to the WhatsApp contact link

#### `src/components/ui/voice-input.tsx`
- **Line 50-119**: Add `aria-label="Start voice recording"` / `"Stop voice recording"` to the voice input button based on `_listening` state
- Add `role="button"` and `tabIndex={0}` for keyboard accessibility

#### `src/components/ui/expandable-chat-assistant.tsx`
- **Line 716-721**: Add `aria-label="Remove file"` to the file removal button (×)
- **Line 760-768**: Add `aria-label="Send message"` to the submit button

#### `src/components/PromotionalFooter.tsx`
- **Line 116-140**: Add `role="button"` and `aria-label` with dynamic campaign headline to the clickable footer div

#### `src/components/dashboard/DashboardNavigation.tsx`
- **Line 115-125**: Add `aria-label="Open menu"` / `"Close menu"` to mobile menu toggle button based on `isMobileMenuOpen` state
- **Line 129-203**: Add `aria-expanded` attribute and `aria-controls` to mobile menu button

#### `src/components/gallery/GalleryModal.tsx`
- **Line 74-86**: Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` referencing the media item title

#### `src/components/ui/gallery/NavigationDock.tsx`
- **Line 41-83**: Add `role="button"` and `aria-label` with item title to each thumbnail button in the dock

---

### 2. Form Labels, IDs, and Error States (Task 2)

#### `src/components/Contact.tsx`
- **Lines 139-148**: Add `id="contact-name"` to name input, add `htmlFor="contact-name"` to label
- **Lines 145-149**: Add `id="contact-email"` to email input, add `htmlFor="contact-email"` to label
- **Lines 155-158**: Add `id="contact-phone"` to phone input, add `htmlFor="contact-phone"` to label
- **Lines 160-164**: Add `id="contact-date"` to date input, add `htmlFor="contact-date"` to label
- **Lines 169-172**: Add `id="contact-message"` to textarea, add `htmlFor="contact-message"` to label
- Add `aria-required="true"` to required fields

#### `src/components/auth/EmailAuthForm.tsx`
- **Lines 134-150**: Add `id="auth-fullname"` to fullName input, add `htmlFor="auth-fullname"` to label
- **Lines 153-170**: Add `id="auth-email"` to email input, add `htmlFor="auth-email"` to label
- **Lines 172-190**: Add `id="auth-password"` to password input, add `htmlFor="auth-password"` to label
- Add `autoComplete` attributes: `name` for fullName, `email` for email, `current-password` / `new-password` for password

#### `src/components/quiz/LeadCapture.tsx`
- Already has proper `id` and `Label htmlFor` structure
- **Lines 88-90, 105-107**: Add `aria-invalid={Boolean(errors.fullName)}` and `aria-describedby="fullName-error"` to inputs with errors
- Add `id="fullName-error"` and `id="email-error"` to error message paragraphs

#### `src/components/quiz/ConsultationFormFields.tsx`
- **Lines 12-22**: Add `id="consultation-cellphone"` to input, add `htmlFor="consultation-cellphone"` to label
- Add `aria-required="true"` to required field

#### `src/components/PromotionalPopup.tsx`
- **Lines 232-246**: Already has `id="phone"` and `htmlFor="phone"` - verified correct
- Add `aria-describedby` linking to the legal note text

---

### 3. Heading Hierarchy Fixes (Task 3)

#### `src/pages/Planner.tsx`
- **Line 58**: Change `<h1>` to remain as `<h1>` (main page heading, correct)
- Verify `<h2>` usage in ProductsSection and CampaignCardsSection is correct

#### `src/components/planner/ProductsSection.tsx`
- **Line 27, 60, 75**: Verify `<h2>` headings are semantically correct (they are section headings under the main `<h1>`)

#### `src/components/Contact.tsx`
- **Line 118**: Keep `<h2>` as the main section heading
- **Line 135**: Keep `<h3>` for "Send us a message" subheading
- **Line 184**: Keep `<h3>` for "Get in touch" subheading
- **Line 221**: Change `<h4>` to remain as `<h4>` (correct level under `<h3>`)
- **Line 240**: Keep `<h4>` for "Quick Response Promise" (correct level)

#### `src/components/Testimonials.tsx`
- **Line 42**: Keep `<h2>` as section heading
- **Line 66**: Keep `<h4>` for testimonial names (correct level inside cards)

#### `src/components/Portfolio.tsx`
- **Line 158, 181**: Keep `<h2>` for "Recent Stories" section
- **Line 238-239**: Keep `<h3>` for portfolio item titles (correct level)

---

### 4. Keyboard Focus & Interactive Semantics (Task 4)

#### `src/components/Portfolio.tsx`
- **Lines 203-249**: The Card is clickable via `onClick` - add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space

#### `src/components/ui/gallery/NavigationDock.tsx`
- **Lines 41-83**: The motion.div items use `onClick` - add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler

#### `src/components/PromotionalFooter.tsx`
- **Lines 116-140**: The div has `onClick` - add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space

#### Dialog Modal Accessibility (already mostly correct via Radix)
- `src/components/ui/dialog.tsx`: Radix Dialog already provides `role="dialog"` and `aria-modal="true"` automatically
- Verify DialogTitle is always present (it is in all usages)

#### `src/components/ui/gallery/GalleryModal.tsx`
- **Lines 73-98**: This is a custom modal (not using Radix Dialog) - add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to a heading

---

## Technical Summary

| File | Change Type | Changes |
|------|-------------|---------|
| `src/components/ui/expandable-chat.tsx` | aria-label | 2 buttons |
| `src/components/Contact.tsx` | aria-label, ids, htmlFor | 4 links, 5 form fields |
| `src/components/ui/voice-input.tsx` | aria-label, role, tabIndex | 1 button |
| `src/components/ui/expandable-chat-assistant.tsx` | aria-label | 2 buttons |
| `src/components/PromotionalFooter.tsx` | role, aria-label, keyboard | 1 div |
| `src/components/dashboard/DashboardNavigation.tsx` | aria-label, aria-expanded | 1 button |
| `src/components/ui/gallery/GalleryModal.tsx` | role, aria-modal, aria-labelledby | 1 modal |
| `src/components/ui/gallery/NavigationDock.tsx` | role, aria-label, keyboard | multiple items |
| `src/components/auth/EmailAuthForm.tsx` | id, htmlFor, autoComplete | 3 fields |
| `src/components/quiz/LeadCapture.tsx` | aria-invalid, aria-describedby | 2 fields |
| `src/components/quiz/ConsultationFormFields.tsx` | id, htmlFor | 1 field |
| `src/components/Portfolio.tsx` | role, tabIndex, keyboard | card items |
| `src/components/PromotionalPopup.tsx` | aria-describedby | 1 field |

**Total Estimated Changes:** ~14 files, ~50 attribute additions

---

## What This Does NOT Change

- No visual styling changes
- No layout or spacing changes
- No copy/text changes
- No business logic changes
- No booking, auth, or Stripe behavior changes
- No media asset changes

---

## Verification Checklist

After implementation, test these pages/features:

| Page/Feature | What to Check |
|--------------|---------------|
| **Homepage (/)** | Tab through all interactive elements, verify focus is visible, screen reader announces button purposes |
| **Services (/services)** | Product cards are keyboard accessible, chat toggle announces state |
| **Booking Modal** | Date picker and time slots are labeled, form fields announce properly |
| **Campaign pages (/promo/*)** | Pricing cards are keyboard accessible, consultation form is labeled |
| **Contact Section** | All form fields have proper labels, social links announce destinations |
| **Admin (/dashboard/*)** | Mobile menu toggle announces state, navigation is keyboard accessible |
| **Gallery Modal** | Modal is announced as dialog, close button is labeled, navigation dock is accessible |

**Run Lighthouse Accessibility audit** after implementation to verify score improvement.

