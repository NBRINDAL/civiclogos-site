import Link from "next/link";
import Image from "next/image";
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
        <strong className={styles.wordmarkTitle}>
          <span className={styles.screenReaderOnly}>{title}</span>
          <Image
            alt=""
            aria-hidden="true"
            height={94}
            src="/brand/civic-logos-wordmark.svg"
            unoptimized
            width={535}
          />
        </strong>
        <span>{subtitle}</span>
      </span>
    </Link>
  );
}
