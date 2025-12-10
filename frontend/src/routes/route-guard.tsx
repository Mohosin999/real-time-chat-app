import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router-dom";

interface Props {
  requireAuth?: boolean;
}

const RouteGuard = ({ requireAuth }: Props) => {
  const { user } = useAuth();

  // ------------------------------------------
  // 1️⃣ Protected route: requireAuth = true
  // যদি রুট Protected হয় এবং user লগইন করা না থাকে
  // তখন user কে "/" এ পাঠিয়ে দাও (login/home)
  // ------------------------------------------
  if (requireAuth && !user) return <Navigate to="/" replace />;

  // ------------------------------------------
  // 2️⃣ Public route: requireAuth = false
  // user আগেই লগইন করা থাকলে
  // তাকে login/signup-এ যেতে দিও না
  // সরাসরি /chat এ পাঠিয়ে দাও
  // ------------------------------------------
  if (!requireAuth && user) return <Navigate to="/chat" replace />;

  return <Outlet />;
};

export default RouteGuard;
