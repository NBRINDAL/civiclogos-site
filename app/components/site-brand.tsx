import Link from "next/link";
import styles from "./site-brand.module.css";

type SiteBrandProps = {
  href: string;
  subtitle: string;
  className?: string;
  title?: string;
};

export function SiteBrand({
  href,
  subtitle,
  className,
  title = "Civic Logos",
}: SiteBrandProps) {
  const combinedClassName = className
    ? `${styles.signature} ${className}`
    : styles.signature;

  return (
    <Link className={combinedClassName} href={href} aria-label={title}>
      <span className={styles.mark} aria-hidden="true">
        <span className={styles.square} />
        <span className={styles.circle} />
        <span className={styles.dot} />
      </span>
      <span className={styles.text}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
    </Link>
  );
}
