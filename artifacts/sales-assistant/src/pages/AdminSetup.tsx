import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

export default function AdminSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Setup failed.");
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch {
      setErr("Network error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo size="lg" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-blue-600" /> Admin Initialization
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">Create the primary administrator account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {success ? (
            <div className="rounded-md bg-green-50 p-4 border border-green-200 text-center">
              <p className="text-sm font-medium text-green-800">✅ Admin account configured successfully!</p>
              <p className="text-xs text-green-600 mt-1">Redirecting you to the login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4">
              {err && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 flex gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {err}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-black" placeholder="Admin User"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-black" placeholder="admin@iunlockd.com"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Password</label>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-black" placeholder="••••••••"/>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none disabled:opacity-50 transition-colors">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Setup Admin Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
