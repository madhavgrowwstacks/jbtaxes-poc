"use client";
import { Archive } from "lucide-react";
import PageHeader from "./PageHeader";
import { useStore } from "./store";
import { Button, Card, EmptyState } from "./ui";
import { CURRENT_TAX_YEAR } from "../lib/data";

// Shown on pages that only make sense for the live season.
export default function ClosedSeasonNotice({ title, pageTitle, children }) {
  const { taxYear, actions } = useStore();
  return (
    <div className="page page-narrow">
      <PageHeader title={pageTitle} />
      <Card>
        <EmptyState
          icon={Archive}
          title={title.replace("{year}", taxYear)}
          action={<Button onClick={() => actions.setTaxYear(CURRENT_TAX_YEAR)}>Switch to tax year {CURRENT_TAX_YEAR}</Button>}
        >
          {children}
        </EmptyState>
      </Card>
    </div>
  );
}
