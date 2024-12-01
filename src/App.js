import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Loader from "./Component/Loader";
import "./App.css";
import SpeedTypingTest from "./Pages/SpeedTypingTest ";
import { Helmet } from "react-helmet";

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
        <Helmet>
          <title>TweackTech</title>
          <meta name="description" content="Learn more about Services TweackTech!" />
          <meta name="keywords" content="laravel,react, web, development,PHP,tweack,tech" />
          <meta property="og:title" content="TweackTech" />
          <meta property="og:description" content="Learn more about My React App." />
          <meta property="og:image" content="https://tweacktech.vercel.app/image.jpg" />
          <meta property="og:url" content="https://example.com/about" />
          <meta property="og:type" content="website" />

          <link rel="icon" href="./favicon_io/favicon_io"type="image/x-icon" />

          {/* For multiple favicon formats/sizes */}
          <link rel="apple-touch-icon" sizes="180x180" href="./favicon_io/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="./favicon_io/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="./favicon_io/favicon-16x16.png" />

                <link rel="manifest" href="/site.webmanifest"/>
              </Helmet>
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
