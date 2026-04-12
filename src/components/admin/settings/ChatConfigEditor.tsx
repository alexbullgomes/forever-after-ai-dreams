import { useState, useEffect } from 'react';
import { useChatConfig, ChatConfig } from '@/hooks/useChatConfig';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

export const ChatConfigEditor = () => {
  const { config, loading, DEFAULTS } = useChatConfig();
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<ChatConfig>(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Upsert into site_settings
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'chat_config',
        value: form as any,
        updated_by: user.id,
      }, { onConflict: 'key' });

    setSaving(false);

    if (error) {
      console.error('Error saving chat config:', error);
      toast({ title: 'Error', description: 'Failed to save chat configuration', variant: 'destructive' });
      return;
    }

    localStorage.setItem('everafter_chat_config', JSON.stringify(form));
    toast({ title: 'Success', description: 'Chat configuration saved!' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Chat Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Customize initial messages and auto-open behavior for the chat assistant.
        </p>
      </div>

      {/* Initial Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Initial Messages</CardTitle>
          <CardDescription>
            Configure the greeting messages visitors and logged-in users see when opening the chat for the first time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="visitor-message">Visitor Initial Message</Label>
            <Textarea
              id="visitor-message"
              value={form.visitor_initial_message}
              onChange={(e) => setForm(prev => ({ ...prev, visitor_initial_message: e.target.value }))}
              placeholder={DEFAULTS.visitor_initial_message}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Shown to unauthenticated visitors when they first open the chat.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-message">Logged-in User Initial Message</Label>
            <Textarea
              id="user-message"
              value={form.user_initial_message}
              onChange={(e) => setForm(prev => ({ ...prev, user_initial_message: e.target.value }))}
              placeholder={DEFAULTS.user_initial_message}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Shown to authenticated users. If empty, falls back to the visitor message.</p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Open Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Open Behavior</CardTitle>
          <CardDescription>
            Control whether the chat opens automatically and after how long.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Open Chat</Label>
              <p className="text-xs text-muted-foreground">Automatically open the chat after a delay.</p>
            </div>
            <Switch
              checked={form.auto_open_enabled}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, auto_open_enabled: checked }))}
            />
          </div>

          {form.auto_open_enabled && (
            <div className="space-y-2">
              <Label htmlFor="delay">Auto Open Delay (seconds)</Label>
              <Input
                id="delay"
                type="number"
                min={5}
                max={300}
                value={form.auto_open_delay_seconds}
                onChange={(e) => setForm(prev => ({ ...prev, auto_open_delay_seconds: Number(e.target.value) || 60 }))}
                className="w-32"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Only Once Per Session</Label>
              <p className="text-xs text-muted-foreground">Prevent the chat from auto-opening again after the user closes it.</p>
            </div>
            <Switch
              checked={form.show_once_per_session}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, show_once_per_session: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Chat Configuration
        </Button>
      </div>
    </div>
  );
};
