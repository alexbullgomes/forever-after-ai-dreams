import { useEffect, useMemo, useState } from "react";
import { Phone, CheckCircle2, AlertCircle, Loader2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneNumberField, {
  buildPhoneE164,
  isValidPhone,
  stripNonDigits,
} from "@/components/ui/phone-number-field";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CardMessageData } from "@/types/chat";
import { getOrCreateVisitorId } from "@/utils/visitor";

type CardState = "pending" | "submitting" | "success" | "error";

export interface PhoneCaptureSubmittedMeta {
  submittedNumber: string;
  submittedName?: string | null;
  submittedAt?: string | null;
}

interface PhoneCaptureCardProps {
  data: CardMessageData;
  variant?: "sent" | "received";
  /** ID of the underlying chat message; required for per-card persistence. */
  messageId?: string | number;
  conversationId?: string;
  /** If this specific message has already been submitted, pass its metadata to render success. */
  submittedMeta?: PhoneCaptureSubmittedMeta | null;
  /** Admin view: never show inputs; show submitted values or an awaiting state. */
  readOnly?: boolean;
  /** EntityPickerModal preview: always show blank, disabled fields. */
  previewOnly?: boolean;
}

const MAX_NAME_LEN = 100;

export const PhoneCaptureCard = ({
  data,
  variant = "received",
  messageId,
  conversationId,
  submittedMeta,
  readOnly = false,
  previewOnly = false,
}: PhoneCaptureCardProps) => {
  const isSent = variant === "sent";

  const [fullName, setFullName] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [dialCode, setDialCode] = useState("+1");
  const [state, setState] = useState<CardState>("pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [localSubmitted, setLocalSubmitted] = useState<PhoneCaptureSubmittedMeta | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth check (only used to decide whether to render the Full Name field
  // for unauthenticated visitors). Never used to prefill or auto-flip to success.
  useEffect(() => {
    if (previewOnly) {
      setAuthChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;
      setUserId(sessionData?.session?.user?.id ?? null);
      setAuthChecked(true);
    })();
    return () => { cancelled = true; };
  }, [previewOnly]);

  // Resolve submitted metadata: prefer just-submitted local state, then
  // server-persisted metadata for THIS specific message.
  const effectiveSubmitted: PhoneCaptureSubmittedMeta | null =
    localSubmitted ?? (submittedMeta && submittedMeta.submittedNumber ? submittedMeta : null);

  // For the EntityPickerModal preview, always treat as visitor view so both
  // Full Name + Phone fields are visible (disabled), accurately representing
  // what the visitor will receive.
  const showNameField = previewOnly ? true : (authChecked && !userId);
  const isVisitor = previewOnly ? true : (authChecked && !userId);

  const handleSubmit = async () => {
    if (previewOnly || readOnly) return;

    const trimmedName = fullName.trim();

    if (isVisitor) {
      if (!trimmedName) {
        setErrorMsg("Please enter your full name.");
        setState("error");
        return;
      }
      if (trimmedName.length > MAX_NAME_LEN) {
        setErrorMsg(`Name must be ${MAX_NAME_LEN} characters or less.`);
        setState("error");
        return;
      }
    }

    if (!isValidPhone(dialCode, phoneValue)) {
      setErrorMsg("Please enter a valid phone number.");
      setState("error");
      return;
    }

    setState("submitting");
    setErrorMsg("");

    const e164 = buildPhoneE164(dialCode, phoneValue);

    if (userId) {
      // Authenticated path: update profile directly (name not collected).
      // No localStorage writes; submitted state is local to this card only.
      const { error } = await supabase
        .from("profiles")
        .update({ user_number: e164 })
        .eq("id", userId);

      if (error) {
        setState("error");
        setErrorMsg("Failed to save. Please try again.");
        console.error("PhoneCaptureCard update error:", error);
        return;
      }
    } else {
      // Visitor path: persist via edge function, scoped to this message + visitor.
      const visitorId = getOrCreateVisitorId();
      const parsedMessageId =
        typeof messageId === "string" ? Number(messageId)
        : typeof messageId === "number" ? messageId
        : undefined;

      try {
        const { data: resp, error: fnErr } = await supabase.functions.invoke('visitor-chat', {
          body: {
            action: 'submit_phone',
            visitor_id: visitorId,
            phone_e164: e164,
            phone_country_dial_code: dialCode.startsWith('+') ? dialCode.replace(/[^+\d]/g, '') : `+${dialCode}`,
            phone_national: stripNonDigits(phoneValue),
            visitor_full_name: trimmedName,
            message_id: Number.isFinite(parsedMessageId as number) ? parsedMessageId : undefined,
          },
        });
        if (fnErr || (resp && resp.success === false)) {
          console.error('PhoneCaptureCard submit_phone error:', fnErr || resp);
          setState("error");
          setErrorMsg("Failed to save. Please try again.");
          return;
        }
      } catch (err) {
        console.error("PhoneCaptureCard visitor update error:", err);
        setState("error");
        setErrorMsg("Failed to save. Please try again.");
        return;
      }
    }

    setLocalSubmitted({
      submittedNumber: e164,
      submittedName: isVisitor ? trimmedName : null,
      submittedAt: new Date().toISOString(),
    });
    setState("success");
  };

  const title = useMemo(() => {
    const wantsContactCopy = isVisitor || readOnly || previewOnly;
    if (wantsContactCopy) {
      return (data.title === "Phone Number Required" || !data.title)
        ? "Contact Information Required"
        : data.title;
    }
    return data.title || "Phone Number Required";
  }, [data.title, isVisitor, readOnly, previewOnly]);

  const description = useMemo(() => {
    if (isVisitor || readOnly || previewOnly) {
      return "Please provide your name and phone number so we can reach you.";
    }
    return data.description;
  }, [data.description, isVisitor, readOnly, previewOnly]);

  const submitDisabled =
    state === "submitting" ||
    !stripNonDigits(phoneValue) ||
    (isVisitor && !fullName.trim());

  const renderSuccess = (s: PhoneCaptureSubmittedMeta) => (
    <div className={cn(
      "flex items-start gap-2 p-2 rounded-md",
      isSent ? "bg-white/10" : "bg-emerald-50 dark:bg-emerald-950/30"
    )}>
      <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", isSent ? "text-emerald-300" : "text-emerald-600")} />
      <div className="min-w-0 space-y-0.5">
        <p className={cn("text-xs font-medium", isSent ? "text-white" : "text-emerald-700 dark:text-emerald-400")}>
          {s.submittedName ? "Contact information saved" : "Phone number saved"}
        </p>
        {s.submittedName && (
          <p className={cn("text-xs", isSent ? "text-white/80" : "text-foreground")}>
            {s.submittedName}
          </p>
        )}
        <p className={cn("text-xs font-mono", isSent ? "text-white/70" : "text-muted-foreground")}>
          {s.submittedNumber}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 p-3 rounded-lg min-w-[240px] max-w-[320px]",
        isSent
          ? "bg-white/10 border border-white/20"
          : "bg-muted/70 border border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            isSent ? "bg-white/10" : "bg-primary/10"
          )}
        >
          <Phone className={cn("w-4 h-4", isSent ? "text-white" : "text-primary")} />
        </div>
        <div className="min-w-0">
          <h4 className={cn("font-semibold text-sm truncate", isSent ? "text-white" : "text-foreground")}>
            {title}
          </h4>
        </div>
      </div>

      {description && (
        <p className={cn("text-xs leading-relaxed", isSent ? "text-white/70" : "text-muted-foreground")}>
          {description}
        </p>
      )}

      {effectiveSubmitted ? (
        renderSuccess(effectiveSubmitted)
      ) : readOnly ? (
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md",
          isSent ? "bg-white/10" : "bg-muted"
        )}>
          <Clock className={cn("w-4 h-4 shrink-0", isSent ? "text-white/70" : "text-muted-foreground")} />
          <p className={cn("text-xs", isSent ? "text-white/80" : "text-muted-foreground")}>
            Awaiting visitor response
          </p>
        </div>
      ) : (
        <>
          {/* Full name input (visitors only, or preview) */}
          {showNameField && (
            <div className="relative">
              <User className={cn(
                "w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none",
                isSent ? "text-white/60" : "text-muted-foreground"
              )} />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                maxLength={MAX_NAME_LEN}
                disabled={state === "submitting" || previewOnly}
                className={cn(
                  "h-8 text-sm pl-7",
                  isSent && "bg-white/10 border-white/20 text-white placeholder:text-white/40"
                )}
              />
            </div>
          )}

          {/* Phone input */}
          <PhoneNumberField
            value={phoneValue}
            onChange={setPhoneValue}
            dialCode={dialCode}
            onDialCodeChange={setDialCode}
            placeholder="(555) 123-4567"
            disabled={state === "submitting" || previewOnly}
            inputClassName={cn(
              "h-8 text-sm",
              isSent && "bg-white/10 border-white/20 text-white placeholder:text-white/40"
            )}
          />

          {/* Error */}
          {state === "error" && errorMsg && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{errorMsg}</p>
            </div>
          )}

          {/* Submit button */}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitDisabled || previewOnly}
            className={cn(
              "w-full h-8 text-xs font-medium",
              isSent
                ? "bg-white/20 text-white hover:bg-white/30 border-0"
                : "bg-brand-gradient text-white hover:opacity-90"
            )}
          >
            {state === "submitting" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              data.ctaLabel || "Submit"
            )}
          </Button>
        </>
      )}
    </div>
  );
};
