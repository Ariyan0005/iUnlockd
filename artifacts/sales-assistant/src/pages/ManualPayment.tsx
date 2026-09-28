import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const WHATSAPP_NUMBER = "96897043234";

const WA_ICON = (
  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const USDT_ICON = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 32 32" fill="currentColor">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.576v-2.37h5.42V8.497H8.818v2.94h5.42v2.37c-4.4.202-7.706 1.074-7.706 2.118 0 1.044 3.306 1.915 7.706 2.117v7.583h3.684v-7.584c4.394-.202 7.694-1.073 7.694-2.116 0-1.043-3.3-1.914-7.694-2.118" fill="#fff"/>
  </svg>
);

const BNB_ICON = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 32 32" fill="currentColor">
    <circle cx="16" cy="16" r="16" fill="#F0B90B"/>
    <path d="M12.116 14.404L16 10.52l3.886 3.886 2.263-2.263L16 6l-6.149 6.141 2.265 2.263zM6 16l2.263-2.264L10.527 16l-2.264 2.264L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.264 2.262L16 26l-6.149-6.142-.003-.003 2.268-2.259zm9.348-1.598L23.728 16l-2.264-2.264 2.264-2.263L26 16l-2.264 2.264zM18.911 16l-2.91-2.911L13.088 16l2.913 2.913L18.911 16z" fill="#fff"/>
  </svg>
);

const TRX_ICON = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 32 32" fill="currentColor">
    <circle cx="16" cy="16" r="16" fill="#EF0027"/>
    <path d="M22.27 10.05l-12.1-2.04 6.94 16.93 8.65-10.56-3.49-4.33zm-8.79 11.54l-1.1-2.68 6.52-4.21-5.42 6.89zm6.14-7.41l-6.72 4.34-1.62-3.95 10.24 1.73-1.9-2.12z" fill="#fff"/>
  </svg>
);

export default function ManualPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { amount?: number; orderId?: string } | null;
  const amount = state?.amount;
  const orderId = state?.orderId;

  const waMessage = orderId
    ? encodeURIComponent(`Hi, I want to make a manual payment of $${amount?.toFixed(2)} USDT. My Order ID is #${orderId}.`)
    : encodeURIComponent("Hi, I want to make a manual payment for my iUnlockd account.");

  return (
    <div className="max-w-md mx-auto px-4 py-6 flex flex-col min-h-[80vh]">
      <button
        onClick={() => navigate("/add-fund", { state: { step: "method", amount, orderId } })}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Manual Payment</h1>
        <p className="text-sm text-gray-500 mt-1">Contact admin to process your payment manually.</p>
      </div>

      {amount && orderId && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400 font-mono">Order #{orderId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount to pay</span>
            <span className="text-xl font-bold text-gray-900">${amount.toFixed(2)} USDT</span>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
        <p className="text-sm font-semibold text-amber-800 mb-2">How it works</p>
        <ol className="flex flex-col gap-1.5 text-xs text-amber-700">
          <li className="flex gap-2"><span className="font-bold shrink-0">1.</span> Contact admin via WhatsApp below.</li>
          <li className="flex gap-2"><span className="font-bold shrink-0">2.</span> Share your Order ID and send the payment amount.</li>
          <li className="flex gap-2"><span className="font-bold shrink-0">3.</span> Admin will verify and credit your account manually.</li>
        </ol>
      </div>

      <div className="border border-gray-200 rounded-2xl p-4 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Supported Payment Methods</p>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#26A17B]/10 border border-[#26A17B]/30 text-[#1a7a5e] rounded-xl text-xs font-semibold">
            {USDT_ICON}
            USDT Payment
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-[#B8860B] rounded-xl text-xs font-semibold">
            {BNB_ICON}
            Binance Pay
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-[#B8860B] rounded-xl text-xs font-semibold">
            {BNB_ICON}
            BEP20
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EF0027]/10 border border-[#EF0027]/30 text-[#b8001e] rounded-xl text-xs font-semibold">
            {TRX_ICON}
            TRC20
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 bg-[#25D366] text-white rounded-2xl hover:bg-[#20b958] transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {WA_ICON}
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">WhatsApp</p>
            <p className="text-sm opacity-90">+968 97043234</p>
            <span className="inline-block mt-1 text-xs bg-white/25 px-2 py-0.5 rounded-full font-medium">⚡ Fast Response</span>
          </div>
        </a>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Admin will verify your payment and credit your wallet within a few minutes.
      </p>
    </div>
  );
}
