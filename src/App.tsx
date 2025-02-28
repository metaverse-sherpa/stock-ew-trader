import React from 'react';
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";   
import { ToastProvider } from './components/ui/use-toast';

function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}

export default App;
