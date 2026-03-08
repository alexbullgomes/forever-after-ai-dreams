import { useState, useEffect } from "react";
import { Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhoneNumberField, {
  buildPhoneE164,
  isValidPhone,
  formatUSPhone,
  stripNonDigits,
} from "@/components/ui/phone-number-field";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CardMessageData } from "@/types/chat";

type CardState = "pending" | "submitting" | "success" | "error";

interface PhoneCaptureCardProps {
  data: CardMessageData;
  variant?: "sent" | "received";
}

export const PhoneCaptureCard = ({ data, variant = "received" }: PhoneCaptureCardProps) => {
  const isSent = variant === "sent";

  const [phoneValue, setPhoneValue] = useState("");
  const [dialCode, setDialCode] = useState("+1");
  const [state, setState] = useState<CardState>("pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // On mount, check auth & existing user_number
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_number")
        .eq("id", uid)
        .single();

      if (profile?.user_number) {
        setSavedNumber(profile.user_number);
        setState("success");
      }
    };
    init();
  }, []);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!isValidPhone(dialCode, phoneValue)) {
      setErrorMsg("Please enter a valid phone number.");
      setState("error");
      return;
    }

    setState("submitting");
    setErrorMsg("");

    const e164 = buildPhoneE164(dialCode, phoneValue);

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

    setSavedNumber(e164);
    setState("success");
  };

  // Not authenticated — show a message
  if (userId === null && state !== "success") {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 p-3 rounded-lg min-w-[220px] max-w-[300px]",
          isSent
            ? "bg-white/10 border border-white/20"
            : "bg-muted/70 border border-border"
        )}
      >
        <div className="flex items-center gap-2">
          <Phone className={cn("w-5 h-5", isSent ? "text-white/60" : "text-muted-foreground")} />
          <h4 className={cn("font-semibold text-sm", isSent ? "text-white" : "text-foreground")}>
            {data.title || "Phone Number Required"}
          </h4>
        </div>
        <p className={cn("text-xs", isSent ? "text-white/70" : "text-muted-foreground")}>
          Please log in to provide your phone number.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 p-3 rounded-lg min-w-[220px] max-w-[300px]",
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
            {data.title || "Phone Number Required"}
          </h4>
        </div>
      </div>

      {data.description && (
        <p className={cn("text-xs leading-relaxed", isSent ? "text-white/70" : "text-muted-foreground")}>
          {data.description}
        </p>
      )}

      {/* Success state */}
      {state === "success" && savedNumber ? (
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md",
          isSent ? "bg-white/10" : "bg-emerald-50 dark:bg-emerald-950/30"
        )}>
          <CheckCircle2 className={cn("w-4 h-4 shrink-0", isSent ? "text-emerald-300" : "text-emerald-600")} />
          <div className="min-w-0">
            <p className={cn("text-xs font-medium", isSent ? "text-white" : "text-emerald-700 dark:text-emerald-400")}>
              Phone number saved
            </p>
            <p className={cn("text-xs font-mono", isSent ? "text-white/70" : "text-muted-foreground")}>
              {savedNumber}
            </p>
          </div>
        </div>
      ) : (
        <>
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
            disabled={state === "submitting" || !stripNonDigits(phoneValue)}
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
