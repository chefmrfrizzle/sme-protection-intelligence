import { Info } from "lucide-react";
import { brand } from "@/domain/brand";

export function Disclaimer() {
  return (
    <div className="disclaimer">
      <Info aria-hidden="true" size={17} />
      <p>{brand.disclaimer}</p>
    </div>
  );
}
