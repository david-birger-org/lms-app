import { OperationsStatusCard } from "@/components/dashboard/operations-status-card";
import { getRuntimeChecks } from "@/lib/runtime-checks";

export default function RuntimePage() {
  const runtimeChecks = getRuntimeChecks();

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <section className="px-4 lg:px-6">
        <OperationsStatusCard checks={runtimeChecks} />
      </section>
    </div>
  );
}
