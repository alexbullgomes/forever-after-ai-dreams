import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Mail, Phone, MapPin, Instagram } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { trackReferralConversion } from "@/utils/affiliateTracking";
import PhoneNumberField, { buildPhonePayload } from "@/components/ui/phone-number-field";
import type { ContactContent } from "@/hooks/useHomepageContent";

interface ContactProps {
  content?: ContactContent;
}

const Contact = ({ content }: ContactProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    message: ""
  });
  const [dialCode, setDialCode] = useState("+1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const badgeText = content?.badge_text ?? "Get In Touch";
  const titleLine1 = content?.title_line1 ?? "Let's Create Something";
  const titleLine2 = content?.title_line2 ?? "Beautiful Together";
  const subtitle = content?.subtitle ?? "Ready to turn your wedding day into a cinematic masterpiece? Let's discuss your vision and create magic together.";
  const formTitle = content?.form_title ?? "Send us a message";
  const email = content?.email ?? "contact@everafterca.com";
  const phone = content?.phone ?? "(442) 224-4820";
  const whatsappUrl = content?.whatsapp_url ?? "https://wa.me/message/Z3PCMXW6HCTQF1";
  const address = content?.address ?? "California, USA";
  const socialLinks = content?.social_links ?? [
    { platform: "instagram", url: "https://www.instagram.com/everafterca" },
    { platform: "tiktok", url: "https://www.tiktok.com/@everafter.ca" },
    { platform: "whatsapp", url: "https://wa.me/message/Z3PCMXW6HCTQF1" }
  ];
  const quickResponseTitle = content?.quick_response_title ?? "Quick Response Promise";
  const quickResponseText = content?.quick_response_text ?? "We understand how exciting (and overwhelming) planning can be. That's why we respond to all inquiries within 24 hours, and often much sooner. You deserve immediate attention.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const webhookData = {
        ...formData,
        ...buildPhonePayload(dialCode, formData.phone),
        userId: user?.id || null,
        userEmail: user?.email || null,
        submittedAt: new Date().toISOString(),
        source: "Dream Weddings Contact Form"
      };
      console.log('Sending webhook data:', webhookData);
      const response = await fetch('https://hmdnronxajctsrlgrhey.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook_type: 'contact_form',
          payload: webhookData
        })
      });
      if (response.ok) {
        await trackReferralConversion('form_submission', {
          source: 'contact_form',
          user_name: formData.name,
          user_email: formData.email,
          event_date: formData.date
        });
        toast({
          title: "Message Sent!",
          description: "We'll get back to you within 24 hours."
        });
        setFormData({ name: "", email: "", phone: "", date: "", message: "" });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
      toast({
        title: "Error sending message",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Social icon renderer
  const renderSocialIcon = (platform: string) => {
    if (platform === "instagram") {
      return <Instagram className="w-6 h-6 text-white" aria-hidden="true" />;
    }
    if (platform === "tiktok") {
      return (
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    }
    if (platform === "whatsapp") {
      return (
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
        </svg>
      );
    }
    return null;
  };

  return <section id="contact" className="py-20 bg-contact-bg-gradient text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Heart className="w-5 h-5" style={{
              color: `hsl(var(--brand-text-accent) / 0.8)`
            }} />
              <span className="text-sm font-medium" style={{
              color: `hsl(var(--brand-badge-bg))`
            }}>{badgeText}</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {titleLine1}
            <span className="block bg-brand-gradient bg-clip-text text-transparent" style={{
            filter: 'brightness(1.2)'
          }}>
              {titleLine2}
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-white">{formTitle}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-white/70 mb-2">
                      Your Name *
                    </label>
                    <Input id="contact-name" name="name" value={formData.name} onChange={handleChange} required aria-required="true" className="bg-white/10 border-white/30 text-white placeholder:text-neutral-400 focus:border-brand-primary-from" placeholder="Your full name" autoComplete="name" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-white/70 mb-2">
                      Email *
                    </label>
                    <Input id="contact-email" name="email" type="email" value={formData.email} onChange={handleChange} required aria-required="true" className="bg-white/10 border-white/30 text-white placeholder:text-neutral-400 focus:border-brand-primary-from" placeholder="your@email.com" autoComplete="email" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-white/70 mb-2">
                      Phone
                    </label>
                    <PhoneNumberField
                      id="contact-phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      dialCode={dialCode}
                      onDialCodeChange={setDialCode}
                      inputClassName="bg-white/10 border-white/30 text-white placeholder:text-neutral-400 focus:border-brand-primary-from"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-date" className="block text-sm font-medium text-white/70 mb-2">
                      Event Date
                    </label>
                    <Input id="contact-date" name="date" type="date" value={formData.date} onChange={handleChange} className="bg-white/10 border-white/30 text-white placeholder:text-neutral-400 focus:border-brand-primary-from" />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-white/70 mb-2">
                    Tell us about your vision
                  </label>
                  <Textarea id="contact-message" name="message" value={formData.message} onChange={handleChange} className="bg-white/10 border-white/30 text-white placeholder:text-neutral-400 focus:border-brand-primary-from min-h-[120px]" placeholder="Share details about your wedding day, venue, style preferences, and any special requests..." />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-white">Get in touch</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-brand-gradient rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Email us</p>
                    <p className="text-white font-medium">{email}</p>
                  </div>
                </div>

                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 bg-brand-gradient rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Whatsapp or Call us</p>
                    <p className="text-white font-medium">{phone}</p>
                  </div>
                </a>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-brand-gradient rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Based in</p>
                    <p className="text-white font-medium">{address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Follow our work</h4>
              <div className="flex space-x-4">
                {socialLinks.map((link, index) => (
                  <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Follow us on ${link.platform}`} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    {renderSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h4 className="text-lg font-semibold mb-4 text-white">{quickResponseTitle}</h4>
              <p className="text-white/70 text-sm leading-relaxed">{quickResponseText}</p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Contact;
