import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import type { User } from "../types/index";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.post(`/${id}`); // Assuming API endpoint for user profile
        setUser(data.data.user);
      } catch (err) {
        setError("Failed to fetch user data.");
        console.error(err);
      }
    };
    if (id) {
      fetchUser();
    }
  }, [id]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader className="flex flex-col items-center">
          <UserCircle2 className="h-16 w-16 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold">User Profile</CardTitle>
          <CardDescription className="text-center">
            Details for the selected user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive text-sm text-center mb-4">{error}</p>
          )}
          {user ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label>Name:</Label>
                <p className="text-foreground font-medium">{user.name}</p>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>Email:</Label>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
            </div>
          ) : (
            !error && (
              <p className="text-center text-muted-foreground">
                Loading user data...
              </p>
            )
          )}
          <Button onClick={() => navigate(-1)} className="w-full mt-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
