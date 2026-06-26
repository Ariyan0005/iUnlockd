import { useNavigate } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Server,
  ShieldCheck,
  Zap,
  Globe,
  Clock,
  Star,
  ArrowRight,
  Lock,
  Wrench,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast Processing",
    desc: "Most orders processed within minutes to hours.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "Enterprise-grade security for every transaction.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    desc: "Unlock devices from carriers worldwide.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    desc: "Round-the-clock assistance for all your needs.",
  },
];

const TESTIMONIALS = [
  {
    name: "Alex M.",
    rating: 5,
    text: "Unlocked my iPhone in under 2 hours. Incredibly fast and reliable service!",
  },
  {
    name: "Sarah K.",
    rating: 5,
    text: "The server unlock service worked perfectly. Highly recommend iUnlockd!",
  },
  {
    name: "James T.",
    rating: 5,
    text: "Best prices and super easy to use. Will definitely use again.",
  },
];

export default function Home() {
  useSEO("iUnlockd — Professional IMEI & Server Unlock Services", "Fast, reliable IMEI and server unlock services for all major carriers worldwide. iCloud bypass, MDM removal. Trusted by thousands.");
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 py-20 md:py-32 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            <Lock className="w-3 h-3 mr-1" />
            Professional Unlock Services
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Unlock Your Device
            <span className="text-primary block">With Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Fast, reliable IMEI and server unlock services for all major carriers and
            manufacturers worldwide. Trusted by thousands of customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/imei-services")}>
              <Smartphone className="w-5 h-5 mr-2" />
              IMEI Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/server-services")}>
              <Server className="w-5 h-5 mr-2" />
              Server Services
            </Button>
          </div>
          {user && (
            <p className="mt-6 text-sm text-muted-foreground">
              Welcome back, <span className="text-foreground font-medium">{user.name}</span>!
              {" "}Balance:{" "}
              <span className="text-primary font-semibold">
                ${parseFloat(user.balance).toFixed(2)}
              </span>
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Choose iUnlockd?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We deliver professional unlock services with unmatched speed and reliability.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services CTA */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <Card
            className="border-border hover:border-primary/40 cursor-pointer transition-all hover:shadow-lg group"
            onClick={() => navigate("/imei-services")}
          >
            <CardContent className="p-8 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Smartphone className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">IMEI Services</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Unlock your device using its IMEI number. Supports all major carriers
                  globally — AT&T, T-Mobile, Verizon, EE, Three, and more.
                </p>
              </div>
              <Button variant="outline" className="w-fit mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Browse IMEI Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-border hover:border-primary/40 cursor-pointer transition-all hover:shadow-lg group"
            onClick={() => navigate("/server-services")}
          >
            <CardContent className="p-8 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Server className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Server Services</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Advanced server-side unlock solutions for complex carrier restrictions.
                  MDM removal, iCloud bypass, and more.
                </p>
              </div>
              <Button variant="outline" className="w-fit mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Browse Server Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-border hover:border-primary/40 cursor-pointer transition-all hover:shadow-lg group"
            onClick={() => navigate("/tool-rent")}
          >
            <CardContent className="p-8 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Wrench className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Remote / Rent Service</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Rent professional unlock tools or access remote services. Flexible
                  plans for technicians and resellers.
                </p>
              </div>
              <Button variant="outline" className="w-fit mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Browse Remote &amp; Rent
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">What Our Customers Say</h2>
            <p className="text-muted-foreground">Trusted by thousands of customers worldwide</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-border">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                  <p className="text-sm font-semibold">— {t.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      {!user && (
        <section className="py-16 px-4 bg-primary/5 border-y border-primary/10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Create a new account and unlock your device today. No subscription required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/register")}>
                Create New Account
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
