import { Header } from "@/components/commands/header/header";
import { KitchenMonitor } from "@/components/commands/monitor/KitchenMonitor";
import { PrinterSelectionProvider } from "@/components/commands/monitor/PrinterSelectionContext";

export default function CommandsPage() {
  return (
    <PrinterSelectionProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 flex-col overflow-hidden pt-16">
          <KitchenMonitor />
        </main>
      </div>
    </PrinterSelectionProvider>
  );
}
