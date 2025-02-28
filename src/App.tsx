import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import { SupabaseConfig } from "./components/SupabaseConfig";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/supabase-config"
          element={
            <SupabaseConfig
              onSave={(url, key) => {
                // This will trigger a page reload to apply the new configuration
                window.location.href = "/";
              }}
            />
          }
        />
        {/* Add tempo routes before the catch-all */}
        {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
      </Routes>
    </Suspense>
  );
}

export default App;
