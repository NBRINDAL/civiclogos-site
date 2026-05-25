"use client";

import { useFormStatus } from "react-dom";
import styles from "./page.module.css";

export function ReviewSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={styles.submitButton}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving review..." : "Save review state"}
    </button>
  );
}
