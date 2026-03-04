import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  authenticated: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("pin_authenticated") === "true");

  const signOut = () => {
    sessionStorage.removeItem("pin_authenticated");
    setAuthenticated(false);
  };

  useEffect(() => {
    const handler = () => setAuthenticated(sessionStorage.getItem("pin_authenticated") === "true");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { authenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated) navigate("/login");
  }, [authenticated, navigate]);

  if (!authenticated) return null;
  return <>{children}</>;
};
