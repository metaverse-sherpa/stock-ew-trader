import React from 'react';
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";   
import StockListPage from "./pages/StockListPage.tsx";
import StockDetailPage from "./pages/StockDetailPage.tsx";
import SettingsDialog from "./components/ui/SettingsDialog.tsx";
import { Settings } from 'lucide-react';

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stocks" element={<StockListPage />} />
        <Route path="/stocks/:symbol" element={<StockDetailPage />} />
      </Routes>
      <SettingsDialog trigger={
        <button className="fixed top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Settings className="h-5 w-5" />
        </button>
      }/>
    </Suspense>
  );
}

export default App;
