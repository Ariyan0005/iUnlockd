import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center gap-6">
      <div className="text-8xl font-black text-muted-foreground/20">404</div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button onClick={() => navigate("/")}>
        <Home className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
    </div>
  );
}
