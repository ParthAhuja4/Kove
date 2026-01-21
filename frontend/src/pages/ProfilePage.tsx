import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react"; // Importing an icon for navigation

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/update-name", { name });
      setMessage("Name updated successfully!");
      // Note: The user object in AuthContext will not update automatically.
      // A full page reload or re-fetching the user profile would be needed to see the change reflected everywhere.
    } catch (err) {
      setError("Failed to update name. Please try again.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">
            Profile
          </CardTitle>
          <CardDescription className="text-center">
            Manage your account settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            {message && (
              <p className="text-primary text-sm text-center">{message}</p>
            )}
            <Button type="submit" className="w-full">
              Update Name
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link
              to="/chat"
              className="text-primary hover:underline flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
