import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequirementForm from "./pages/RequirementForm";
import ReviewItems from "./pages/ReviewItems";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RequirementForm />} />
        <Route path="/review" element={<ReviewItems />} />
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
