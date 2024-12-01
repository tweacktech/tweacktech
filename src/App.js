import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Loader from "./Component/Loader";
import "./App.css";
import SpeedTypingTest from "./Pages/SpeedTypingTest ";

// Lazy load the pages
const Index = lazy(() => import("./Pages/Index"));
const LandingPage = lazy(() => import("./Pages/LandingPage"));
const AboutPage = lazy(() => import("./Pages/AboutPage"));
const ContactPage = lazy(() => import("./Pages/ContactPage"));
const NotFound = lazy(() => import("./Pages/NotFound"));

function App() {
  return (
    <div>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Define your routes */}
            <Route path="/" element={<Index />} />
            <Route path="/typing" element={<SpeedTypingTest />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/support" element={<ContactPage />} />
            <Route path="/*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;