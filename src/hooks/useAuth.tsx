import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Navigate } from "react-router-dom";

type AuthContextType = {
  authenticated: boolean;
  login: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  login: () => {},
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("pin_authenticated") === "true"
  );

  const login = useCallback(() => {
    sessionStorage.setItem("pin_authenticated", "true");
    setAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem("pin_authenticated");
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { authenticated } = useAuth();
  const navigate = useNavigate();

  if (!authenticated) {
    navigate("/login");
    return null;
  }

  return <>{children}</>;
};
