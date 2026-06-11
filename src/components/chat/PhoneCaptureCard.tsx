import { useState, useEffect } from "react";
import { Phone, CheckCircle2, AlertCircle, Loader2, User } from "lucide-react";
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

interface PhoneCaptureCardProps {
  data: CardMessageData;
  variant?: "sent" | "received";
}

const MAX_NAME_LEN = 100;

export const PhoneCaptureCard = ({ data, variant = "received" }: PhoneCaptureCardProps) => {
  const isSent = variant === "sent";

  const [fullName, setFullName] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [dialCode, setDialCode] = useState("+1");
  const [state, setState] = useState<CardState>("pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // On mount, check auth & existing phone (profile or localStorage)
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id ?? null;
      setUserId(uid);
      setAuthChecked(true);

      if (uid) {
        // Authenticated: check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_number")
          .eq("id", uid)
          .single();

        if (profile?.user_number) {
          setSavedNumber(profile.user_number);
          setState("success");
        }
      } else {
        // Visitor: check localStorage for prior submission
        const visitorPhone = localStorage.getItem("visitor_phone");
        const visitorName = localStorage.getItem("visitor_full_name");
        if (visitorPhone && visitorName) {
          setSavedNumber(visitorPhone);
          setSavedName(visitorName);
          setState("success");
        }
      }
    };
    init();
  }, []);

  const isVisitor = authChecked && !userId;

  const handleSubmit = async () => {
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
      // Authenticated path: update profile directly (name not collected)
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
      // Visitor path: save to localStorage + persist via edge function
      localStorage.setItem("visitor_phone", e164);
      localStorage.setItem("visitor_full_name", trimmedName);

      const visitorId = getOrCreateVisitorId();
      try {
        const { data: resp, error: fnErr } = await supabase.functions.invoke('visitor-chat', {
          body: {
            action: 'submit_phone',
            visitor_id: visitorId,
            phone_e164: e164,
            phone_country_dial_code: dialCode.startsWith('+') ? dialCode.replace(/[^+\d]/g, '') : `+${dialCode}`,
            phone_national: stripNonDigits(phoneValue),
            visitor_full_name: trimmedName,
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

    setSavedNumber(e164);
    setSavedName(isVisitor ? trimmedName : null);
    setState("success");
  };

  const title = isVisitor
    ? (data.title === "Phone Number Required" || !data.title
        ? "Contact Information Required"
        : data.title)
    : (data.title || "Phone Number Required");

  const description = isVisitor
    ? "Please provide your name and phone number so we can reach you."
    : data.description;

  const submitDisabled =
    state === "submitting" ||
    !stripNonDigits(phoneValue) ||
    (isVisitor && !fullName.trim());

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

      {/* Success state */}
      {state === "success" && savedNumber ? (
        <div className={cn(
          "flex items-start gap-2 p-2 rounded-md",
          isSent ? "bg-white/10" : "bg-emerald-50 dark:bg-emerald-950/30"
        )}>
          <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", isSent ? "text-emerald-300" : "text-emerald-600")} />
          <div className="min-w-0 space-y-0.5">
            <p className={cn("text-xs font-medium", isSent ? "text-white" : "text-emerald-700 dark:text-emerald-400")}>
              {savedName ? "Contact information saved" : "Phone number saved"}
            </p>
            {savedName && (
              <p className={cn("text-xs", isSent ? "text-white/80" : "text-foreground")}>
                {savedName}
              </p>
            )}
            <p className={cn("text-xs font-mono", isSent ? "text-white/70" : "text-muted-foreground")}>
              {savedNumber}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Full name input (visitors only) */}
          {isVisitor && (
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
                disabled={state === "submitting"}
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
            disabled={state === "submitting"}
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
            disabled={submitDisabled}
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
