import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../pages/LandingPage';
import { QuickCheckPage } from '../pages/QuickCheckPage';
import { WizardPage } from '../pages/WizardPage';
import { HomePage } from '../pages/HomePage';
import { ExplorePage } from '../pages/ExplorePage';
import { SchemeDetailPage } from '../pages/SchemeDetailPage';
import { ComparePage } from '../pages/ComparePage';
import { PlanPage } from '../pages/PlanPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { PassportPage } from '../pages/PassportPage';
import { SavedPage } from '../pages/SavedPage';
import { ProfilePage } from '../pages/ProfilePage';
import { HouseholdPage } from '../pages/HouseholdPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Authentication Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'quick-check',
        element: <QuickCheckPage />,
      },
      {
        path: 'wizard',
        element: <WizardPage />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'schemes/:slug',
        element: <SchemeDetailPage />,
      },
      {
        path: 'compare',
        element: <ComparePage />,
      },
      {
        path: 'plan',
        element: <PlanPage />,
      },
      {
        path: 'applications',
        element: <ApplicationsPage />,
      },
      {
        path: 'passport',
        element: <PassportPage />,
      },
      {
        path: 'saved',
        element: <SavedPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'household',
        element: <HouseholdPage />,
      },
      {
        path: '404',
        element: <NotFoundPage />,
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);
