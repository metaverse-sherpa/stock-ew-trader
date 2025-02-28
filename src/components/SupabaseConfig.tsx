import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useToast } from "./ui/use-toast";

interface SupabaseConfigProps {
  onSave?: (url: string, key: string) => void;
}

export function SupabaseConfig({ onSave }: SupabaseConfigProps) {
  const { toast } = useToast();
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem("custom_supabase_url") || "",
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem("custom_supabase_key") || "",
  );

  const handleSave = () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Error",
        description: "Please provide both Supabase URL and API key",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem("custom_supabase_url", supabaseUrl);
    localStorage.setItem("custom_supabase_key", supabaseKey);

    // Call the onSave callback
    if (onSave) {
      onSave(supabaseUrl, supabaseKey);
    }

    toast({
      title: "Success",
      description: "Supabase configuration saved. Please refresh the page.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Configuration</CardTitle>
        <CardDescription>
          Enter your Supabase project URL and anon key to connect to a different
          database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supabase-url">Supabase URL</Label>
          <Input
            id="supabase-url"
            placeholder="https://your-project-id.supabase.co"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-key">Supabase Anon Key</Label>
          <Input
            id="supabase-key"
            placeholder="your-anon-key"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
}
