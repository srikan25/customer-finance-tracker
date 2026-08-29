import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/auth.css";
import { Eye, EyeOffIcon } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const emailConfirmationMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // console.log("Logged in user:", data.user);
      navigate("/", { replace: true });
      //
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // console.log(showPassword);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">₹</div>
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Login to manage your customer payments</p>
        {emailConfirmationMessage && (
          <p className="auth-success">{emailConfirmationMessage}</p>
        )}

        <form action="" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Your Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "hide password" : "show password"}
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup"> Sign Up</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
