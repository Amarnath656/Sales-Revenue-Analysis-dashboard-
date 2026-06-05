import { SaleTransaction } from "../types";

// Helper to generate dates between a range
function generateRandomSales(preset: "saas" | "retail" | "ev"): SaleTransaction[] {
  const sales: SaleTransaction[] = [];
  
  if (preset === "saas") {
    const products = [
      { name: "Enterprise Cloud ERP", category: "Cloud Infrastructure", price: 1200, cost: 200 },
      { name: "Team Planner Pro", category: "Productivity Tools", price: 45, cost: 5 },
      { name: "Security Firewall Suite", category: "Cyber Security", price: 350, cost: 40 },
      { name: "Predictive Analytics Kit", category: "Analytics & AI", price: 850, cost: 120 },
      { name: "API Gateway Console", category: "Developer Tools", price: 150, cost: 25 },
    ];
    const regions = ["North America", "EMEA", "APAC", "LATAM"];
    const channels = ["Direct Sales", "Self-Service", "Enterprise Reseller"];
    const segments = ["Enterprise", "SME", "Mid-Market", "B2B Startup"];
    
    // Generate ~120 records spanning July 2025 to May 2026
    let idCounter = 1000;
    const start = new Date("2025-07-01").getTime();
    const end = new Date("2026-05-30").getTime();
    
    for (let i = 0; i < 150; i++) {
      const progress = i / 150;
      // Introduce an upward trend to represent month-over-month growth
      const dateMs = start + progress * (end - start) + (Math.random() - 0.5) * 5 * 24 * 60 * 60 * 1000;
      const dateStr = new Date(Math.max(start, Math.min(end, dateMs))).toISOString().split("T")[0];
      
      const prod = products[Math.floor(Math.random() * products.length)];
      // SaaS volumes: Enterprise will buy high quantities (e.g. user licenses) or single large contract
      const quantity = prod.category === "Productivity Tools" ? Math.floor(Math.random() * 80) + 10 : Math.floor(Math.random() * 8) + 1;
      const region = regions[Math.floor(Math.random() * regions.length)];
      const salesChannel = channels[Math.floor(Math.random() * channels.length)];
      const customerSegment = segments[Math.floor(Math.random() * segments.length)];
      
      const rev = quantity * prod.price;
      const profit = rev - (quantity * prod.cost);
      
      sales.push({
        id: `TX-${idCounter++}`,
        date: dateStr,
        productName: prod.name,
        category: prod.category,
        region,
        salesChannel,
        quantity,
        price: prod.price,
        cost: prod.cost,
        revenue: rev,
        profit,
        customerSegment
      });
    }
  } else if (preset === "retail") {
    const products = [
      { name: "UltraFly Air Sneakers", category: "Footwear", price: 180, cost: 45 },
      { name: "Commuter Canvas Jacket", category: "Outerwear", price: 220, cost: 65 },
      { name: "Retro Windbreaker Shell", category: "Outerwear", price: 110, cost: 30 },
      { name: "Merino Wool Everyday beanie", category: "Accessories", price: 40, cost: 10 },
      { name: "Modular Expandable Travel Pack", category: "Luggage", price: 290, cost: 95 },
      { name: "Multi-Activity Hydro Flask", category: "Accessories", price: 55, cost: 12 },
    ];
    const regions = ["East Coast", "West Coast", "Midwest", "Europe", "Asia-Pacific"];
    const channels = ["Online Store", "In-Store Flagship", "Partner Retailers"];
    const segments = ["Premium Consumer", "Outdoors Enthusiast", "Urban Professional", "Youth Casual"];
    
    let idCounter = 2000;
    const start = new Date("2025-07-01").getTime();
    const end = new Date("2026-05-30").getTime();
    
    for (let i = 0; i < 180; i++) {
      const progress = i / 180;
      // Add sales spike around Holiday Season (Nov/Dec - progress around 0.4 - 0.5)
      let dateMs = start + progress * (end - start);
      const isHolidaySeason = progress >= 0.4 && progress <= 0.55;
      if (isHolidaySeason && Math.random() > 0.3) {
        // clump more transactions in holiday weeks
        dateMs += (Math.random() - 0.5) * 15 * 24 * 60 * 60 * 1000;
      } else {
        dateMs += (Math.random() - 0.5) * 7 * 24 * 60 * 60 * 1000;
      }
      const dateStr = new Date(Math.max(start, Math.min(end, dateMs))).toISOString().split("T")[0];
      
      const prod = products[Math.floor(Math.random() * products.length)];
      // Retail volumes are typically medium values per order
      const quantity = Math.floor(Math.random() * 5) + 1;
      const region = regions[Math.floor(Math.random() * regions.length)];
      const salesChannel = channels[Math.floor(Math.random() * channels.length)];
      const customerSegment = segments[Math.floor(Math.random() * segments.length)];
      
      const rev = quantity * prod.price;
      const profit = rev - (quantity * prod.cost);
      
      sales.push({
        id: `TX-${idCounter++}`,
        date: dateStr,
        productName: prod.name,
        category: prod.category,
        region,
        salesChannel,
        quantity,
        price: prod.price,
        cost: prod.cost,
        revenue: rev,
        profit,
        customerSegment
      });
    }
  } else {
    // EV Automotive
    const products = [
      { name: "Model S EV Sports Sedan", category: "Vehicles", price: 79000, cost: 58000 },
      { name: "Model X EV Family Cruiser", category: "Vehicles", price: 92000, cost: 69000 },
      { name: "Dual-Charge Power Station", category: "Energy Chargers", price: 1200, cost: 500 },
      { name: "Tesla-Grid Solar Inverter", category: "Energy Storage", price: 4200, cost: 2400 },
      { name: "Pro-Pilot Autopilot Upgrade", category: "Software Licensing", price: 8000, cost: 0 }, // 100% margin software!
    ];
    const regions = ["California", "Texas Area", "Pacific Northwest", "Northern Europe", "Oceania Segment"];
    const channels = ["Direct Online Web", "Fleet Contract", "Corporate Fleet Sales"];
    const segments = ["Eco Premium Consumer", "Commercial Fleet", "SME Smart Logistic", "Governement Agency"];
    
    let idCounter = 3000;
    const start = new Date("2025-07-01").getTime();
    const end = new Date("2026-05-30").getTime();
    
    // EV transactions has higher values, so fewer transactions represents realistic high-ticket operation
    for (let i = 0; i < 90; i++) {
      const progress = i / 90;
      // High growth near Q1/Q2 2026 (progress > 0.6)
      const dateMs = start + progress * (end - start) + (Math.random() - 0.5) * 8 * 24 * 60 * 60 * 1000;
      const dateStr = new Date(Math.max(start, Math.min(end, dateMs))).toISOString().split("T")[0];
      
      const prod = products[Math.floor(Math.random() * products.length)];
      // Vehicles are mostly 1 unit per sale, other accessories/software might be larger
      const quantity = prod.category === "Vehicles" ? 1 : Math.floor(Math.random() * 4) + 1;
      const region = regions[Math.floor(Math.random() * regions.length)];
      const salesChannel = channels[Math.floor(Math.random() * channels.length)];
      const customerSegment = segments[Math.floor(Math.random() * segments.length)];
      
      const rev = quantity * prod.price;
      const profit = rev - (quantity * prod.cost);
      
      sales.push({
        id: `TX-${idCounter++}`,
        date: dateStr,
        productName: prod.name,
        category: prod.category,
        region,
        salesChannel,
        quantity,
        price: prod.price,
        cost: prod.cost,
        revenue: rev,
        profit,
        customerSegment
      });
    }
  }
  
  // Sort by date ascending to make time-series charts natural
  return sales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const PRESET_DATASETS = {
  saas: {
    key: "saas" as const,
    name: "Tech SaaS Solutions",
    industry: "Enterprise Software & Cloud Systems",
    description: "High-margin digital business model featuring contract licensing, regional tiers, and multiple customer tiers (SME to Enterprise).",
    data: generateRandomSales("saas")
  },
  retail: {
    key: "retail" as const,
    name: "Apex Apparel & Gear",
    industry: "Consumer Retail & E-Commerce",
    description: "Volume-based consumer goods featuring high seasonal holiday spikes, product-category distributions, and multichannel delivery networks.",
    data: generateRandomSales("retail")
  },
  ev: {
    key: "ev" as const,
    name: "Electra EV Automotive",
    industry: "Clean Tech Vehicles & Renewable Charging",
    description: "Premium high-average-order-value (AOV) automotive operations featuring EV vehicles, renewable charging accessories, and 100% margin FSD software addons.",
    data: generateRandomSales("ev")
  }
};
