import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import Onboarding from "./pages/onboarding";
import Dashboard from "./pages/dashboard";
import Products from "./pages/products";
import Categories from "./pages/categories";
import Sales from "./pages/sales";
import Customers from "./pages/customers";
import Expenses from "./pages/expenses";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import { ProtectedRoute } from "./components/protected-route";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <p className="font-display text-5xl font-bold text-primary">404</p>
      <p className="text-muted-foreground">Cette page n'existe pas.</p>
      <a href="/" className="text-sm font-medium text-primary underline underline-offset-4">
        Retour à l'accueil
      </a>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />

        <Route path="/onboarding">
          <ProtectedRoute requireBusiness={false}>
            <Onboarding />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/products">
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        </Route>
        <Route path="/categories">
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        </Route>
        <Route path="/sales">
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        </Route>
        <Route path="/customers">
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        </Route>
        <Route path="/expenses">
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        </Route>
        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
