import "./App.css";
import SignUp from "./pages/SignUp";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import FinanceDetails from "./pages/FinanceDetails";
import Login from "./pages/Login.jsx";
import "./styles/darkMode.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        setSession(session);
      } catch (error) {
        console.error("session error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <h3>Loading...</h3>;
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={session ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={session ? <Navigate to="/" replace /> : <SignUp />}
          />
          <Route
            path="/"
            element={
              session ? (
                <Dashboard
                  session={session}
                  toggleTheme={toggleTheme}
                  theme={theme}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/finance/:loanId"
            element={
              session ? (
                <FinanceDetails toggleTheme={toggleTheme} theme={theme} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
