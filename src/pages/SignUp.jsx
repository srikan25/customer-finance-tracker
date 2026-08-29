import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

import "../styles/auth.css";
import { Eye, EyeOffIcon } from "lucide-react";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (!name.trim()) {
        throw new Error("Please enter your name.");
      }

      if (error) throw error;

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successful. Please verify your email before logging in.",
        },
      });

      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error.message);

      if (error?.status === 429) {
        setError(
          "Too many signup attempts. Please wait a while and try again.",
        );
      } else {
        setError(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">₹</div>

        <h1>Create Account</h1>
        <p className="auth-subtitle">start managing your customer payments</p>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <p>Enter the name you’d like displayed</p>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide Password" : "Show Password"}
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Create a password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                aria-label={
                  showConfirmPassword ? "Hide Password" : "Show Password"
                }
                title={showConfirmPassword ? "Hide" : "Show"}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "sign-up"}
          </button>
        </form>

        <p className="auth-switch">
          already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
};

export default SignUp;
