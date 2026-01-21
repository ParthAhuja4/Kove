import { useContext, useState } from "react";
import { AuthContext } from "../contexts/allContext";
import api from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AuthContextType } from "../contexts/allContext";

const OTPLoginPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const context = useContext<AuthContextType | null>(AuthContext);

  const navigate = useNavigate();
  if (!context) {
    navigate("/otp-login");
    return;
  }
  const { login } = context;

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/generate-otp", { email });
      setMessage("If an account with that email exists, an OTP has been sent.");
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP. Please try again later.");
      console.error(err);
    }
  };

  const handleLoginWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/login-user-otp", { email, otp });
      login(data.data.token);
      navigate("/chat");
    } catch (err) {
      setError(
        "Failed to login with OTP. Please check the code and try again.",
      );
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted to-primary/10 text-foreground p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
          <CardTitle className="text-center text-3xl font-bold">
            Kove - OTP Login
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {!otpSent ? (
            <form onSubmit={handleGenerateOtp} className="space-y-4">
              <p className="text-sm text-center text-primary-foreground/80">
                {" "}
                {/* Adjusted text color */}
                Enter your email to receive a one-time password.
              </p>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLoginWithOtp} className="space-y-4">
              <p className="text-sm text-center text-primary-foreground/80">
                {" "}
                {/* Adjusted text color */}
                Enter the OTP sent to {email}.
              </p>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login with OTP
              </Button>
            </form>
          )}
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          {message && (
            <p className="text-accent text-sm text-center">{message}</p>
          )}
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to Password Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPLoginPage;
