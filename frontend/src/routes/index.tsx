import AppLayout from "@/layouts/app-layout";
import BaseLayout from "@/layouts/base-layout";
import { Route, Routes } from "react-router-dom";
import { authRoutesPaths, protectedRoutesPaths } from "./routes";
import RouteGuard from "./route-guard";
import Account from "@/pages/account";
import { PROTECTED_ROUTES } from "./routes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<RouteGuard requireAuth={false} />}>
        <Route element={<BaseLayout />}>
          {authRoutesPaths.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      {/* Protected routes - Account page with BaseLayout */}
      <Route element={<RouteGuard requireAuth={true} />}>
        <Route element={<BaseLayout />}>
          <Route path={PROTECTED_ROUTES.ACCOUNT} element={<Account />} />
        </Route>
      </Route>

      {/* Protected routes - Chat with AppLayout */}
      <Route element={<RouteGuard requireAuth={true} />}>
        <Route element={<AppLayout />}>
          {protectedRoutesPaths
            .filter((route) => route.path !== PROTECTED_ROUTES.ACCOUNT)
            .map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
