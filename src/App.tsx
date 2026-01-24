import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequirementForm from "./pages/RequirementForm";
import ReviewItems from "./pages/ReviewItems";
import AdminPanel from "./pages/AdminPanel";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequirementForm />} />
          <Route path="/review" element={<ReviewItems />} />
          <Route path="/admin" element={<AdminPanel />} />
          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
