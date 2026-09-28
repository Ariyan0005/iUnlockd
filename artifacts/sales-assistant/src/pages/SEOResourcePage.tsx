import { useSEO } from "@/lib/seo";
import { Battery, Cable, Cpu, Monitor, Network } from "lucide-react";

type ResourcePageId =
  | "display-compatibility"
  | "battery-compatibility"
  | "ic-compatibility"
  | "tp-isp-pinout"
  | "erp-for-business";

type ResourcePageConfig = {
  title: string;
  description: string;
  heading: string;
  intro: string;
  icon: React.ElementType;
  sections: Array<{ heading: string; body: string }>;
  closingHeading: string;
  closingBody: string;
};

const RESOURCE_PAGES: Record<ResourcePageId, ResourcePageConfig> = {
  "display-compatibility": {
    title: "Display Compatibility Guide for Mobile Repair | iUnlockd",
    description:
      "Find display compatibility information for iPhone, Samsung, and Android phones before replacing a mobile screen or LCD assembly.",
    heading: "Display Compatibility for Mobile Phone Repair",
    intro:
      "Choose the right display assembly with practical compatibility information for smartphone technicians, repair shops, and device resellers.",
    icon: Monitor,
    sections: [
      {
        heading: "Match the display before installation",
        body:
          "Display compatibility can depend on the exact device model, region, connector, refresh rate, frame, and touch panel generation. Confirm the model number and assembly type before opening a device.",
      },
      {
        heading: "Built for repair professionals",
        body:
          "Use this resource when sourcing iPhone screens, Samsung AMOLED displays, Android LCD assemblies, replacement glass, or touch-compatible parts for a customer repair.",
      },
    ],
    closingHeading: "Need the full display compatibility resource?",
    closingBody:
      "The complete partner resource and service link will be available here soon. Keep this page bookmarked for display compatibility references and technician guides.",
  },
  "battery-compatibility": {
    title: "Battery Compatibility Guide for Mobile Phone Repair | iUnlockd",
    description:
      "Check mobile phone battery compatibility details for safe replacement, including model matching, connector type, capacity, and battery health considerations.",
    heading: "Battery Compatibility for Smartphones",
    intro:
      "Get clearer battery replacement decisions for iPhone, Samsung, Xiaomi, and Android devices with compatibility guidance made for repair workflows.",
    icon: Battery,
    sections: [
      {
        heading: "Confirm the complete battery match",
        body:
          "A compatible battery must match the phone model, connector, physical dimensions, voltage profile, and battery-management requirements. Capacity alone is not enough to confirm a safe replacement.",
      },
      {
        heading: "Support safer repair decisions",
        body:
          "Technicians and resellers can use this page to review battery replacement requirements before ordering parts or starting a mobile phone repair service.",
      },
    ],
    closingHeading: "Need the full battery compatibility resource?",
    closingBody:
      "The complete partner resource and service link will be available here soon. Keep this page bookmarked for battery replacement references and mobile repair guidance.",
  },
  "ic-compatibility": {
    title: "IC Compatibility Guide for Smartphone Board Repair | iUnlockd",
    description:
      "Explore IC compatibility guidance for smartphone motherboard repair, charging IC replacement, power management, audio, and network-related components.",
    heading: "IC Compatibility for Smartphone Motherboard Repair",
    intro:
      "Identify the right integrated circuit family for board-level mobile repair and reduce avoidable mistakes when replacing critical smartphone components.",
    icon: Cpu,
    sections: [
      {
        heading: "Check the IC family and board revision",
        body:
          "IC compatibility can change across board revisions, device variants, manufacturers, and storage configurations. Match the board code and component marking before attempting microsoldering work.",
      },
      {
        heading: "For technicians and board repair labs",
        body:
          "Use this resource for charging IC, power-management IC, audio IC, baseband, and other smartphone motherboard repair research.",
      },
    ],
    closingHeading: "Need the full IC compatibility resource?",
    closingBody:
      "The complete partner resource and service link will be available here soon. Keep this page bookmarked for IC compatibility references and board repair guidance.",
  },
  "tp-isp-pinout": {
    title: "TP and ISP Pinout Guide for Mobile Repair Technicians | iUnlockd",
    description:
      "Find TP and ISP pinout guidance for smartphone servicing, eMMC, UFS, memory access, test points, and advanced mobile motherboard repair.",
    heading: "TP & ISP Pinout for Advanced Mobile Repair",
    intro:
      "Use TP and ISP pinout information to plan advanced smartphone servicing, memory access, and board-level diagnostic work with more confidence.",
    icon: Cable,
    sections: [
      {
        heading: "Understand test points before connecting",
        body:
          "Test-point and ISP work requires the exact device variant, board revision, pinout layout, and supported service method. Always verify the board before applying power or connecting a programmer.",
      },
      {
        heading: "Made for advanced service workflows",
        body:
          "This resource is intended for mobile repair technicians working with eMMC, UFS, boot repair, data access, and other specialist motherboard service procedures.",
      },
    ],
    closingHeading: "Need the complete TP and ISP pinout resource?",
    closingBody:
      "The complete partner resource and service link will be available here soon. Keep this page bookmarked for pinout references and advanced technician guides.",
  },
  "erp-for-business": {
    title: "ERP Software for Business, POS and Inventory Management | iUnlockd",
    description:
      "Discover ERP for business with POS, inventory, sales, purchasing, accounting, and operations management tools for growing companies.",
    heading: "ERP for Business, POS & Operations",
    intro:
      "Bring sales, inventory, purchasing, customer records, and daily operations into one connected ERP platform built for modern businesses.",
    icon: Network,
    sections: [
      {
        heading: "Run your business from one system",
        body:
          "Business ERP software helps teams manage products, stock, sales orders, purchasing, customers, suppliers, invoices, and operational reporting from a shared workspace.",
      },
      {
        heading: "ERP and POS for growing teams",
        body:
          "A connected POS and inventory system gives business owners better visibility into sales, stock movement, cash flow, and the decisions that keep day-to-day operations moving.",
      },
    ],
    closingHeading: "Looking for a connected business platform?",
    closingBody:
      "The full ERP and POS partner resource will be available here soon. Keep this page bookmarked for business software, inventory, and operations updates.",
  },
};

export default function SEOResourcePage({ page }: { page: ResourcePageId }) {
  const config = RESOURCE_PAGES[page];
  const Icon = config.icon;

  useSEO(config.title, config.description);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          iUnlockd resource guide
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {config.heading}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
          {config.intro}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {config.sections.map((section) => (
          <article key={section.heading} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{section.body}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:flex">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{config.closingHeading}</h2>
            <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{config.closingBody}</p>
          </div>
        </div>
      </section>
    </main>
  );
}