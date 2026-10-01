import { ArrowLeft, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Invoices() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Invoices</h1>
      <p className="text-sm text-muted-foreground mb-8">Your billing invoices and receipts.</p>

      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Receipt className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
        <p className="text-muted-foreground text-sm">No invoices yet.</p>
      </div>
    </div>
  );
}
