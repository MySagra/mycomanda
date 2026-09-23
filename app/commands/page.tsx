import { Header } from "@/components/commands/header/header";
import { KitchenMonitor } from "@/components/commands/monitor/KitchenMonitor";
import { PrinterSelectionProvider } from "@/components/commands/monitor/PrinterSelectionContext";
import { GuideProvider } from "@/components/commands/guide/GuideContext";

export default function CommandsPage() {
  return (
    <PrinterSelectionProvider>
      <GuideProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <Header />
          <main className="flex flex-1 flex-col overflow-hidden pt-16">
            <KitchenMonitor />
          </main>
        </div>
      </GuideProvider>
    </PrinterSelectionProvider>
  );
}
