import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Theme"
      disabled
    >
      <Moon className="w-4 h-4" />
    </Button>
  );
}
