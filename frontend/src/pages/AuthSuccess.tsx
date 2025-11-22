// src/components/auth-success.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// import { useAuth } from "@/hooks/use-auth";
// import { Spinner } from "@/components/ui/spinner";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // const { setToken } = useAuth(); // Assuming you have a setToken method in your auth hook

  const token = searchParams.get("token");

  useEffect(() => {
    const handleAuthSuccess = async () => {
      if (token) {
        // try {
        //   // Store the token
        //   setToken(token);

        //   // Optional: Fetch user data or verify token
        //   // await fetchUserData();

        //   // Redirect to dashboard or home page after a brief delay
        //   setTimeout(() => {
        //     navigate("/dashboard", { replace: true });
        //   }, 2000);
        // } catch (error) {
        //   console.error("Auth success error:", error);
        //   navigate("/login", {
        //     replace: true,
        //     state: { error: "Authentication failed" },
        //   });
        // }
        console.log("hey token -> ", token);
      } else {
        // No token found, redirect to login
        navigate("/login", {
          replace: true,
          state: { error: "No authentication token received" },
        });
      }
    };

    handleAuthSuccess();
  }, [token, navigate]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      {/* <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Authentication Successful</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-center text-sm text-muted-foreground">
              {token
                ? "Successfully authenticated! Redirecting..."
                : "No token received. Redirecting to login..."}
            </p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
};

export default AuthSuccess;
