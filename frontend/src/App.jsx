import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Result from './components/Result';
import HistoryPage from './components/HistoryPage';
import TemplatesPage from './components/TemplatesPage';
import AnalyticsPage from './components/AnalyticsPage';
import CalendarPage from './components/CalendarPage';
import BrandsPage from './components/BrandsPage';
import SharePage from './components/SharePage';
import ImageGenerator from './components/ImageGenerator';
import Navbar from './components/Navbar';
import OnboardingTour from './components/OnboardingTour';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import ContentCalendar from './components/ContentCalendar';
import CampaignBuilder from './components/CampaignBuilder';
import GamificationPanel from './components/GamificationPanel';
import InspirationFeed from './components/InspirationFeed';
import ApprovalWorkflow from './components/ApprovalWorkflow';
import SmartQueue from './components/SmartQueue';

const isAuthenticated = () => !!localStorage.getItem('token');

const ProtectedRoute = () => {
    if (!isAuthenticated()) return <Navigate to="/auth" replace />;
    return <Outlet />;
};

const AppLayout = () => {
    return (
        <>
            <Navbar />
            <OnboardingTour />
            <KeyboardShortcuts />
            <div className="app-main">
                <Outlet />
            </div>
        </>
    );
};

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/auth" element={<Auth />} />
                <Route path="/share/:shareId" element={<SharePage />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/result" element={<Result />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/brands" element={<BrandsPage />} />
                        <Route path="/image-gen" element={<ImageGenerator />} />
                        <Route path="/content-calendar" element={<ContentCalendar />} />
                        <Route path="/campaigns" element={<CampaignBuilder />} />
                        <Route path="/progress" element={<GamificationPanel />} />
                        <Route path="/inspiration" element={<InspirationFeed />} />
                        <Route path="/approvals" element={<ApprovalWorkflow />} />
                        <Route path="/smart-queue" element={<SmartQueue />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/auth"} replace />} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <BrowserRouter>
                    <AnimatedRoutes />
                </BrowserRouter>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
