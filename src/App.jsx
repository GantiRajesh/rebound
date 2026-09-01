import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { RegionProvider } from './context/RegionContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Checklist from './pages/Checklist';
import Glossary from './pages/Glossary';
import Directory from './pages/Directory';
import Reset from './pages/Reset';
import About from './pages/About';
import Talk from './pages/Talk';
import Services from './pages/Services';
import Tools from './pages/Tools';
import Review from './pages/Review';

export default function App() {
  return (
    <ThemeProvider>
      <RegionProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/about" element={<About />} />
            <Route path="/talk" element={<Talk />} />
            <Route path="/services" element={<Services />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/review" element={<Review />} />
            {/* Legacy routes fold into the plan wizard */}
            <Route path="/triage" element={<Navigate to="/plan" replace />} />
            <Route path="/calculator" element={<Navigate to="/plan" replace />} />
          </Routes>
        </Layout>
      </RegionProvider>
    </ThemeProvider>
  );
}
