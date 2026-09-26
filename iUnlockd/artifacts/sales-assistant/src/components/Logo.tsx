import { Link } from "react-router-dom";
import logoImg from "/logo.jpg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  linkTo?: string;
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", linkTo = "/", showText = true }: LogoProps) {
  const sizes = {
    sm: { box: 28, text: "text-base" },
    md: { box: 36, text: "text-xl" },
    lg: { box: 52, text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <Link to={linkTo} className={`flex items-center gap-2 select-none ${className}`}>
      <div
        className="overflow-hidden rounded-xl shrink-0"
        style={{ width: s.box, height: s.box }}
      >
        <img
          src={logoImg}
          alt="iUnlockd"
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)", transformOrigin: "center" }}
        />
      </div>
      {showText && (
        <span className={`${s.text} font-black tracking-tight`}><span className="text-primary">i</span><span className="text-foreground">Unlockd</span></span>
      )}
    </Link>
  );
}
