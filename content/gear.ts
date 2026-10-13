import { GearSchema, type Gear } from "./schemas";

// Mirrors the /gear page (public/atelier/gear.html). Only what the page shows:
// no sizes, memory or storage (not confirmed by the owner).
const data: Gear = {
  page: "/gear",
  items: [
    { role: "Main machine", name: "MacBook Pro with the M4 Pro chip, in Space Black" },
    { role: "Second laptop", name: "Lenovo ThinkPad T460" },
    { role: "Keyboard", name: "AULA F75 mechanical keyboard" },
    { role: "Mouse", name: "A4Tech 2X Click mouse" },
  ],
};

export const gear = GearSchema.parse(data);
