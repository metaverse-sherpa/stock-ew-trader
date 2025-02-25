import React from 'react';
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home.tsx";
import { SettingsDialog } from './components/SettingsDialog.tsx';   
import { TestButton } from "./components/TestButton.tsx";

function App() {
  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add tempo routes before the catch-all */}
          {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
        </Routes>
        <SettingsDialog />
        <TestButton />
      </Suspense>
    </div>
  );
}

export default App;
