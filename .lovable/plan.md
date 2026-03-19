

# Campaign-Specific Account Button Toggle

## Overview

Add a `show_account_button` boolean to `promotional_campaigns` that controls whether the Account/Login button appears in the Header on that specific campaign page. No global header logic changes.

## Changes

### 1. Database Migration

```sql
ALTER TABLE promotional_campaigns
  ADD COLUMN show_account_button boolean NOT NULL DEFAULT true;
```

### 2. Header Component (`src/components/Header.tsx`)

Add an optional `hideAccountButton` prop (default `false`). When `true`, the right-side `<div>` containing the Account/Login button is not rendered. No layout shift since the header uses `justify-between` — the logo stays left-aligned naturally.

```typescript
interface HeaderProps {
  onLoginClick: () => void;
  hideAccountButton?: boolean;
}
```

In the JSX, wrap the button div: `{!hideAccountButton && (<div>...</div>)}`

### 3. PromotionalLanding Page (`src/pages/PromotionalLanding.tsx`)

Pass the toggle to Header:

```tsx
<Header
  onLoginClick={() => setIsAuthModalOpen(true)}
  hideAccountButton={campaign.show_account_button === false}
/>
```

### 4. Campaign Hook (`src/hooks/usePromotionalCampaign.ts`)

Add `show_account_button: boolean` to the `PromotionalCampaign` interface. Parse it in the fetch logic with default `true`:

```typescript
show_account_button: data.show_account_button ?? true,
```

### 5. Admin Form (`src/components/admin/PromotionalCampaignForm.tsx`)

- Add `show_account_button: boolean` to the Campaign interface (default `true`)
- Add to initial state: `show_account_button: true`
- Add toggle in Basic tab below "Show Footer on Home":

```tsx
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Switch
      id="show_account_button"
      checked={formData.show_account_button}
      onCheckedChange={(checked) =>
        setFormData((prev) => ({ ...prev, show_account_button: checked }))
      }
    />
    <Label htmlFor="show_account_button">Show Account Button</Label>
  </div>
  <p className="text-sm text-muted-foreground">
    Control whether the Account button is visible in this campaign page header.
  </p>
</div>
```

No changes needed to the save logic — `formData` is already spread into `campaignData`.

## Files Modified

| File | Change |
|------|--------|
| Migration | Add `show_account_button` column |
| `src/components/Header.tsx` | Add optional `hideAccountButton` prop |
| `src/pages/PromotionalLanding.tsx` | Pass prop to Header |
| `src/hooks/usePromotionalCampaign.ts` | Add field to interface + parsing |
| `src/components/admin/PromotionalCampaignForm.tsx` | Add toggle to Basic tab |

## Safety

- Non-campaign pages never pass `hideAccountButton` → always visible
- Default `true` → existing campaigns unaffected
- Auth flow untouched — only the button visibility changes, not auth state
- No global header refactor

