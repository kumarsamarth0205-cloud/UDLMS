import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import BusinessDashboard from "./pages/BusinessDashboard"
import LMODashboard from "./pages/LMODashboard"
import DigitalCertificateView from "./pages/DigitalCertificateView"

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/business/*" element={<BusinessDashboard />} />
          <Route path="/lmo/*" element={<LMODashboard />} />
          <Route path="/certificate/:id" element={<DigitalCertificateView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
