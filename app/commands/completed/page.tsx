import { Header } from "@/components/commands/header/header";
import { CompletedOrders } from "@/components/commands/completed/CompletedOrders";
import { PrinterSelectionProvider } from "@/components/commands/monitor/PrinterSelectionContext";

export default function CompletedOrdersPage() {
  return (
    <PrinterSelectionProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 flex-col overflow-hidden pt-16">
          <CompletedOrders />
        </main>
      </div>
    </PrinterSelectionProvider>
  );
}
