

## Country Dial Code Selector for All Phone Inputs

### Overview

Add a reusable `PhoneNumberField` component with a country dial code selector (defaulting to US +1) to all 6 phone input locations across the app, without changing existing UI layout, styling, or business logic.

---

### New Component: `src/components/ui/phone-number-field.tsx`

A reusable component that renders `[Dial Code Select] + [Phone Input]` in a single visual row matching existing input height and styling.

**Structure:**
- Uses a shadcn `Select` for dial code (compact, ~70px wide showing "+1")
- Uses the existing `Input` for the national number
- Wrapped in a `div` with `flex` layout and shared border styling to look like a single input
- Country list: ~20 most common countries (US, CA, MX, BR, UK, etc.) with dial codes
- Default: US (+1)
- Keyboard accessible, proper tab order, aria-labels

**Props interface:**
```typescript
interface PhoneNumberFieldProps {
  value: string;              // national number (formatted)
  onChange: (value: string) => void;
  dialCode: string;           // e.g. "+1"
  onDialCodeChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;         // applied to wrapper
  inputClassName?: string;    // applied to inner input
  disabled?: boolean;
}
```

**Output helpers** (exported utility functions in same file):
```typescript
export function buildPhoneE164(dialCode: string, national: string): string
export function buildPhonePayload(dialCode: string, national: string): {
  phone_e164: string;
  phone_country_dial_code: string;
  phone_national: string;
}
```

---

### Files to Update (6 forms)

#### 1. `src/components/PromotionalPopup.tsx`
- Add `dialCode` state (default "+1")
- Replace `<Input type="tel">` with `<PhoneNumberField>`
- On submit, keep sending `cellphone: phoneNumber` (legacy) AND add `phone_e164`, `phone_country_dial_code`, `phone_national` to webhook payload
- Update `isValidPhone` to work with selected country (for US: 10 digits, for others: 7-15 digits)
- Keep `formatPhoneNumber` for US format; skip formatting for non-US dial codes

#### 2. `src/components/Contact.tsx`
- Add `dialCode` state (default "+1")
- Replace phone `<Input>` with `<PhoneNumberField>`
- Webhook payload: keep `phone` (legacy, now E.164) and add new fields
- Keep `formatPhoneNumber` conditional on US dial code

#### 3. `src/components/ConsultationForm.tsx` (root)
- Add `dialCode` state (default "+1")
- Replace phone `<Input>` with `<PhoneNumberField>`
- Webhook payload: keep `phone` (legacy) and add E.164 fields

#### 4. `src/components/PersonalizedConsultationForm.tsx`
- Add `dialCode` state (default "+1")
- Replace phone `<Input>` with `<PhoneNumberField>`
- Webhook payload: keep `phone` (legacy) and add E.164 fields

#### 5. `src/components/ui/gallery/GalleryConsultationForm.tsx`
- Add `dialCode` state (default "+1")
- Replace phone `<Input>` with `<PhoneNumberField>`
- Webhook payload: keep `phone_number` (legacy) and add E.164 fields
- `profiles.user_number` update: send E.164 format

#### 6. `src/components/quiz/ConsultationFormFields.tsx`
- Extend props to include `dialCode` and `onDialCodeChange`
- Replace `<Input>` with `<PhoneNumberField>`
- Parent (`quiz/ConsultationForm.tsx`) needs `dialCode` state
- `formValidation.ts`: update `submitConsultationRequest` to accept and send E.164 fields alongside legacy `cellphone`

---

### Backward Compatibility Strategy

Every webhook payload will continue to send the **exact same legacy key** (`phone`, `cellphone`, or `phone_number`) with the national format value, PLUS three new fields:

| New Field | Example | Purpose |
|-----------|---------|---------|
| `phone_e164` | `+14155552671` | International standard |
| `phone_country_dial_code` | `+1` | Selected country code |
| `phone_national` | `(415) 555-2671` | Formatted national number |

No existing webhook consumer (n8n, edge functions) will break because legacy keys remain unchanged.

---

### Formatting Logic

- When dial code is `+1` (US/CA): apply `(XXX) XXX-XXXX` formatting (existing behavior preserved)
- When dial code is anything else: allow raw digit input with no formatting mask, placeholder changes to "Phone number"
- Validation: US requires 10 digits; other countries require 7-15 digits

---

### Country List (minimal, ~15 entries)

US +1, CA +1, MX +52, BR +55, GB +44, FR +33, DE +49, ES +34, IT +39, AU +61, IN +91, JP +81, KR +82, CO +57, AR +54, CL +56

The select shows flag emoji + dial code (e.g. "🇺🇸 +1"). Compact width.

---

### Admin Dashboard (UserProfileModal)

The `UserProfileModal.tsx` only **displays** phone numbers (read-only `<p>` tags). No phone inputs to modify there. No changes needed.

---

### Testing Checklist

For each of the 6 forms:
1. Default +1 selected, US number formatting works, submit succeeds
2. Switch to +52, enter Mexican number, payload has correct E.164
3. Invalid number shows existing error behavior
4. Webhook payload includes both legacy key and new E.164 fields
5. Tab order: dial code select is tabbable, then phone input

Pages to verify:
- Homepage Contact section
- Promotional popup (triggered by active popup config)
- Portfolio card consultation modal
- Wedding packages consultation modal
- Gallery like consultation modal
- Wedding quiz consultation popup

