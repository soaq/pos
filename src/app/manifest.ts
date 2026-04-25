import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Restaurant 3D Planner",
    short_name: "Kitchen Planner",
    description: "Scan restaurant kitchens and edit equipment layouts.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ead9",
    theme_color: "#13110d",
  };
}
