import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";

interface EmailSettingsProps {
  userId?: string;
}

const EmailSettings = ({ userId }: EmailSettingsProps) => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [waveAlerts, setWaveAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      // Get current user's email from auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }

      const { data } = await supabase
        .from("user_settings")
        .select("email, email_subscribed, wave_alerts_enabled")
        .single();

      if (data) {
        // Only set email from settings if not already set from auth
        if (!user?.email && data.email) {
          setEmail(data.email || "");
        }
        setIsSubscribed(data.email_subscribed !== false);
        setWaveAlerts(data.wave_alerts_enabled !== false);
      }
    };

    loadSettings();
  }, [userId]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("user_settings").upsert({
        email,
        email_subscribed: isSubscribed,
        wave_alerts_enabled: waveAlerts,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your email notification settings have been updated",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications about your favorite stocks
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={isSubscribed}
            onCheckedChange={setIsSubscribed}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="wave-alerts">New Wave 5 Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when new Wave 5 patterns are detected
            </p>
          </div>
          <Switch
            id="wave-alerts"
            checked={waveAlerts}
            onCheckedChange={setWaveAlerts}
          />
        </div>

        <Button
          onClick={saveSettings}
          className="w-full mt-4"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailSettings;
