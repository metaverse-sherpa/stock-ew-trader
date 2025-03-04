import { lazy, Suspense } from 'react';
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import type { ComponentProps } from 'react';

// Lazy load the SettingsDialog
const SettingsDialog = lazy(() => import('./SettingsDialog'));

// Loading component
const LoadingButton = () => (
  <Button variant="outline" size="icon">
    <Settings className="h-4 w-4" />
  </Button>
);

// Forward all props to the lazy-loaded component
export function LazySettingsDialog(props: ComponentProps<typeof SettingsDialog>) {
  return (
    <Suspense fallback={<LoadingButton />}>
      <SettingsDialog {...props} />
    </Suspense>
  );
} 