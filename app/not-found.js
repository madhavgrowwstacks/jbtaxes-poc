import { Compass } from "lucide-react";
import { Button, Card, EmptyState } from "../components/ui";

export default function NotFound() {
  return (
    <div className="page page-narrow">
      <Card>
        <EmptyState icon={Compass} title="Page not found" action={<Button href="/">Back to dashboard</Button>}>
          This page isn't part of the prototype.
        </EmptyState>
      </Card>
    </div>
  );
}
