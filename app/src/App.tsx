import { Navigate, Route, Routes } from "react-router-dom";
import { Today } from "./pages/Today";
import { Profile } from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="/today" element={<Today />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}
