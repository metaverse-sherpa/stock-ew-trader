import React from 'react';
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home.tsx";
import { SettingsDialog } from './components/SettingsDialog.tsx';
import { TestButton } from "./components/TestButton.tsx";
import { Settings } from 'lucide-react';

function App() {
  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add tempo routes before the catch-all */}
          {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
        </Routes>
        <SettingsDialog trigger={
          <button className="fixed top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        }/>
      </Suspense>
    </div>
  );
}

export default App;
