import { ArrowLeft, Mail, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Contact() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Contact Us</h1>
      <p className="text-sm text-muted-foreground mb-8">Reach us through any of the following channels.</p>

      <div className="flex flex-col gap-4">
        <a
          href="mailto:contact.iunlockd@gmail.com"
          className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Email</p>
            <p className="font-semibold text-sm">contact.iunlockd@gmail.com</p>
          </div>
        </a>

        <a
          href="https://wa.me/96897043234"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-green-400/40 hover:bg-green-50/50 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">WhatsApp</p>
            <p className="font-semibold text-sm">+968 97043234</p>
          </div>
        </a>

        <a
          href="https://t.me/iUnlockd_iU"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-sky-400/40 hover:bg-sky-50/50 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Telegram</p>
            <p className="font-semibold text-sm">@iUnlockd_iU</p>
          </div>
        </a>
      </div>
    </div>
  );
}
