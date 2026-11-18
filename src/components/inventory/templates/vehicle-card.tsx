import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MediaSlot } from "@/components/shared/media";
import { fieldPath } from "@/components/shared/field-path";
import {
  publicItemPrice,
  vehicleCoverUrl,
  vehicleHref,
  vehicleTitle,
  vehicleYearLabel,
} from "@/components/inventory/data";
import type { BrochureVehicle } from "@/types/brochure";
import styles from "./vehicle-card.module.scss";

type VehicleCardProps = {
  vehicle: BrochureVehicle;
  instanceId: string;
  index: number;
  showPrices?: boolean;
};

/** Framed print card: plate, year, model, chassis, one figure, price. */
export function VehicleCard({
  vehicle,
  instanceId,
  index,
  showPrices = true,
}: VehicleCardProps) {
  const title = vehicleTitle(vehicle) || "Motorcar";
  const alt = vehicle.imageAlt.trim() || title;
  const price = publicItemPrice(vehicle.price, { showPrices }, vehicle);

  return (
    <Link
      href={vehicleHref(vehicle)}
      className={styles.card}
      aria-label={`${title}${price ? ` — ${price}` : ""}`}
    >
      <figure className={styles.plate}>
        <MediaSlot
          url={vehicleCoverUrl(vehicle)}
          slotId={`${instanceId}_${index + 1}`}
          jsonPath={fieldPath(instanceId, `vehicles[${index}].imageUrl`)}
          alt={alt}
          className={styles.image}
        />
      </figure>

      <div className={styles.body}>
        <p className={styles.year}>{vehicleYearLabel(vehicle)}</p>
        <h3 className={styles.model}>
          {vehicle.make ? <span className={styles.make}>{vehicle.make}</span> : null}
          {vehicle.model}
        </h3>

        <dl className={styles.specs}>
          {vehicle.chassis.trim() ? (
            <div className={styles.specRow}>
              <dt>Chassis</dt>
              <dd className={styles.mono}>{vehicle.chassis}</dd>
            </div>
          ) : null}
          {vehicle.metricValue.trim() ? (
            <div className={styles.specRow}>
              <dt>{vehicle.metricLabel.trim() || "Figure"}</dt>
              <dd>{vehicle.metricValue}</dd>
            </div>
          ) : null}
          {vehicle.transmission.trim() ? (
            <div className={styles.specRow}>
              <dt>Gearbox</dt>
              <dd>{vehicle.transmission}</dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.footer}>
          {price ? <span className={styles.price}>{price}</span> : <span className={styles.price} />}
          <span className={styles.view}>
            View
            <ArrowUpRight className={styles.viewIcon} aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
