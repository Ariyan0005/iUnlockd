import { useState, useEffect } from "react";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

type Tab = "profile" | "password";

interface PasskeyItem {
  id: number;
  credentialId: string;
  deviceName: string | null;
  createdAt: string;
}

export default function Account() {
  useSEO("My Account — iUnlockd", "Manage your iUnlockd profile, password and account settings.");
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("profile");

  const nameParts = user?.name?.split(" ") ?? [];
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") ?? "");
  const [companyName, setCompanyName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postCode, setPostCode] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean | null>(null);
  const [twoFaMode, setTwoFaMode] = useState<"idle" | "setup" | "disable-verify">("idle");
  const [twoFaData, setTwoFaData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaMsg, setTwoFaMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const [passkeyList, setPasskeyList] = useState<PasskeyItem[]>([]);
  const [passkeyMsg, setPasskeyMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passkeyAdding, setPasskeyAdding] = useState(false);

  const fetchPasskeys = async () => {
    const token = localStorage.getItem("iu_token");
    try {
      const res = await fetch("/api/user/passkey/list", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPasskeyList(await res.json() as PasskeyItem[]);
    } catch {}
  };

  useEffect(() => {
    if (tab !== "password") return;
    const token = localStorage.getItem("iu_token");
    fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setTwoFaEnabled(d.totpEnabled ?? false))
      .catch(() => setTwoFaEnabled(false));
    void fetchPasskeys();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!firstName.trim()) { setProfileMsg({ type: "error", text: "First name is required." }); return; }
    if (!address1.trim()) { setProfileMsg({ type: "error", text: "Address 1 is required." }); return; }
    if (!city.trim() || city.trim().length < 2) { setProfileMsg({ type: "error", text: "City must be at least 2 characters." }); return; }
    if (!/^[a-zA-Z\s\-'.]+$/.test(city.trim())) { setProfileMsg({ type: "error", text: "City should only contain letters." }); return; }
    if (!stateName.trim() || stateName.trim().length < 2) { setProfileMsg({ type: "error", text: "State must be at least 2 characters." }); return; }
    if (!/^[a-zA-Z\s\-'.]+$/.test(stateName.trim())) { setProfileMsg({ type: "error", text: "State should only contain letters." }); return; }
    if (!postCode.trim() || postCode.trim().length < 3) { setProfileMsg({ type: "error", text: "Post code must be at least 3 characters." }); return; }
    if (!/^[a-zA-Z0-9\s\-]{3,10}$/.test(postCode.trim())) { setProfileMsg({ type: "error", text: "Invalid post code format (3–10 alphanumeric characters)." }); return; }
    setProfileLoading(true);
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    try {
      const token = localStorage.getItem("iu_token");
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, address1, address2, city, state: stateName, postCode, companyName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "error", text: data.error ?? "Update failed" });
      } else {
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
        refreshUser();
      }
    } catch {
      setProfileMsg({ type: "error", text: "Network error." });
    } finally {
      setProfileLoading(false);
    }
  };

  const startTwoFaSetup = async () => {
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      const token = localStorage.getItem("iu_token");
      const res = await fetch("/api/user/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setTwoFaMsg({ type: "error", text: data.error ?? "Setup failed" }); return; }
      setTwoFaData({ qrDataUrl: data.qrDataUrl, secret: data.secret });
      setTwoFaCode("");
      setTwoFaMode("setup");
    } catch { setTwoFaMsg({ type: "error", text: "Network error" }); }
    finally { setTwoFaLoading(false); }
  };

  const verifyTwoFaEnable = async () => {
    if (twoFaCode.length !== 6) return;
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      const token = localStorage.getItem("iu_token");
      const res = await fetch("/api/user/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: twoFaCode }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFaMsg({ type: "error", text: data.error ?? "Verification failed" }); return; }
      setTwoFaEnabled(true);
      setTwoFaMode("idle");
      setTwoFaData(null);
      setTwoFaCode("");
      setTwoFaMsg({ type: "success", text: "2FA enabled! Your account is now protected." });
    } catch { setTwoFaMsg({ type: "error", text: "Network error" }); }
    finally { setTwoFaLoading(false); }
  };

  const verifyTwoFaDisable = async () => {
    if (twoFaCode.length !== 6) return;
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      const token = localStorage.getItem("iu_token");
      const res = await fetch("/api/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: twoFaCode }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFaMsg({ type: "error", text: data.error ?? "Verification failed" }); return; }
      setTwoFaEnabled(false);
      setTwoFaMode("idle");
      setTwoFaCode("");
      setTwoFaMsg({ type: "success", text: "2FA has been disabled." });
    } catch { setTwoFaMsg({ type: "error", text: "Network error" }); }
    finally { setTwoFaLoading(false); }
  };

  const handleAddPasskey = async () => {
    setPasskeyMsg(null);
    setPasskeyAdding(true);
    const token = localStorage.getItem("iu_token");
    try {
      const optRes = await fetch("/api/user/passkey/registration-options", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!optRes.ok) {
        const d = await optRes.json() as { error?: string };
        setPasskeyMsg({ type: "error", text: d.error ?? "Failed to start passkey setup" });
        return;
      }
      const options = await optRes.json() as Parameters<typeof startRegistration>[0]["optionsJSON"];
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch {
        setPasskeyMsg({ type: "error", text: "Passkey setup cancelled or not supported on this device" });
        return;
      }
      const deviceName = `${navigator.platform || "Device"} — ${new Date().toLocaleDateString()}`;
      const regRes = await fetch("/api/user/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...attResp, deviceName }),
      });
      const regData = await regRes.json() as { error?: string };
      if (!regRes.ok) { setPasskeyMsg({ type: "error", text: regData.error ?? "Registration failed" }); return; }
      setPasskeyMsg({ type: "success", text: "Passkey added! You can now sign in with biometrics." });
      void fetchPasskeys();
    } catch {
      setPasskeyMsg({ type: "error", text: "Unexpected error. Please try again." });
    } finally {
      setPasskeyAdding(false);
    }
  };

  const handleDeletePasskey = async (id: number) => {
    const token = localStorage.getItem("iu_token");
    try {
      const res = await fetch(`/api/user/passkey/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setPasskeyMsg({ type: "error", text: "Failed to remove passkey" }); return; }
      setPasskeyMsg({ type: "success", text: "Passkey removed." });
      void fetchPasskeys();
    } catch {
      setPasskeyMsg({ type: "error", text: "Network error" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "Passwords don't match" }); return; }
    if (newPw.length < 8) { setPwMsg({ type: "error", text: "Password must be at least 8 characters" }); return; }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("iu_token");
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ type: "error", text: data.error ?? "Failed to change password" });
      } else {
        setPwMsg({ type: "success", text: "Password changed successfully!" });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setShowPwForm(false);
      }
    } catch {
      setPwMsg({ type: "error", text: "Network error." });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header strip */}
      <div className="border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Profile &amp; Password</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex">
        <button
          onClick={() => setTab("profile")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "profile"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setTab("password")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "password"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Password &amp; authentication
        </button>
      </div>

      <div className="px-4 py-6">

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 max-w-lg">
            {profileMsg && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border ${
                profileMsg.type === "success"
                  ? "text-green-700 bg-green-50 border-green-200"
                  : "text-red-600 bg-red-50 border-red-200"
              }`}>
                {profileMsg.type === "success"
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            <ProfileField label="First Name" value={firstName} onChange={setFirstName} placeholder="First Name" required />
            <ProfileField label="Last Name" value={lastName} onChange={setLastName} placeholder="Last Name" />
            <ProfileField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Company Name" />
            <ProfileField label="Address 1" value={address1} onChange={setAddress1} placeholder="House/Street address" required />
            <ProfileField label="Address 2" value={address2} onChange={setAddress2} placeholder="Apt, Suite, Unit (optional)" />
            <ProfileField label="City" value={city} onChange={setCity} placeholder="e.g. London" required hint="Letters only, min 2 chars" />
            <ProfileField label="State / Province" value={stateName} onChange={setStateName} placeholder="e.g. England" required hint="Letters only, min 2 chars" />
            <ProfileField label="Post Code" value={postCode} onChange={setPostCode} placeholder="e.g. SW1A 1AA" required hint="3–10 alphanumeric characters" />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                value={user.email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">Email cannot be changed.</p>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="mt-2 px-6 py-3 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-900 transition-colors disabled:opacity-60 w-fit"
            >
              {profileLoading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}

        {/* ── PASSWORD & AUTH TAB ── */}
        {tab === "password" && (
          <div className="flex flex-col gap-5 max-w-lg">

            {/* Change Password form view */}
            {showPwForm ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Password</p>
                      <p className="text-xs text-gray-500">Strengthen your account by ensuring your password is strong.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowPwForm(false); setPwMsg(null); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                    className="text-xs font-medium text-gray-700 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Hide
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="p-4 flex flex-col gap-4">
                  {pwMsg && (
                    <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border ${
                      pwMsg.type === "success"
                        ? "text-green-700 bg-green-50 border-green-200"
                        : "text-red-600 bg-red-50 border-red-200"
                    }`}>
                      {pwMsg.type === "success"
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <AlertCircle className="w-4 h-4 shrink-0" />}
                      {pwMsg.text}
                    </div>
                  )}

                  <PwField label="Old Password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
                  <PwField label="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew(!showNew)} />
                  <PwField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />

                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="w-full py-3.5 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-900 transition-colors disabled:opacity-60"
                  >
                    {pwLoading ? "Saving…" : "Save"}
                  </button>
                </form>
              </div>
            ) : (
              /* Default password card — just shows button */
              <div className="border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Password</p>
                      <p className="text-xs text-gray-500 mt-0.5">Strengthen your account by ensuring your password is strong.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPwForm(true)}
                    className="shrink-0 text-xs font-semibold text-white bg-black px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Passkeys section */}
            <div className="border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Passkeys (Biometrics)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Login with fingerprint, face ID, or hardware key</p>
                  </div>
                </div>
                {passkeyList.length === 0 && (
                  <button
                    type="button"
                    onClick={() => void handleAddPasskey()}
                    disabled={passkeyAdding}
                    className="shrink-0 text-xs font-semibold text-white bg-black px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {passkeyAdding ? "Adding..." : <><Plus className="w-3 h-3" /> Add Passkey</>}
                  </button>
                )}
              </div>

              <div className="px-4 py-3 flex flex-col gap-2">
                {passkeyMsg && (
                  <p className={`text-xs rounded-lg px-3 py-2 border ${passkeyMsg.type === "success" ? "text-green-700 bg-green-50 border-green-200" : "text-red-500 bg-red-50 border-red-200"}`}>
                    {passkeyMsg.text}
                  </p>
                )}
                {passkeyList.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No passkeys yet. Click "Add Passkey" to set up biometric login.</p>
                ) : (
                  passkeyList.map((pk) => (
                    <div key={pk.id} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-900">{pk.deviceName ?? "Passkey"}</p>
                          <p className="text-xs text-gray-400">{new Date(pk.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeletePasskey(pk.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
                        title="Remove passkey"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Two Factor Authentication (2FA) */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Authenticator App (2FA)</p>
                      <p className="text-xs text-gray-500 mt-0.5">Google Authenticator / Authy — TOTP</p>
                    </div>
                  </div>
                  {twoFaEnabled === true && twoFaMode === "idle" && (
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full shrink-0 self-center">Active</span>
                  )}
                  {twoFaEnabled === false && twoFaMode === "idle" && (
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full shrink-0 self-center">Off</span>
                  )}
                </div>
              </div>

              <div className="px-4 py-4 flex flex-col gap-4">
                {twoFaMsg && (
                  <p className={`text-sm rounded-lg px-3 py-2 ${twoFaMsg.type === "success" ? "text-green-700 bg-green-50 border border-green-200" : "text-red-500 bg-red-50 border border-red-200"}`}>
                    {twoFaMsg.text}
                  </p>
                )}

                {twoFaMode === "idle" && twoFaEnabled === false && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-500">Add an extra layer of security. Scan a QR code with Google Authenticator or Authy.</p>
                    <button
                      onClick={startTwoFaSetup}
                      disabled={twoFaLoading}
                      className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-60"
                    >
                      {twoFaLoading ? "Generating…" : "Set Up Authenticator App"}
                    </button>
                  </div>
                )}

                {twoFaMode === "setup" && twoFaData && (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-gray-600">
                      Scan the QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>, then enter the 6-digit code to verify.
                    </p>
                    <div className="flex justify-center">
                      <img src={twoFaData.qrDataUrl} alt="2FA QR Code" className="w-44 h-44 rounded-xl border border-gray-200" />
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Can't scan? Enter this key manually:</p>
                      <p className="text-xs font-mono text-gray-800 break-all">{twoFaData.secret}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Enter the 6-digit code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-xl tracking-widest font-mono text-gray-900 focus:outline-none focus:border-gray-600 bg-white"
                      />
                    </div>
                    <button
                      onClick={verifyTwoFaEnable}
                      disabled={twoFaLoading || twoFaCode.length !== 6}
                      className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-60"
                    >
                      {twoFaLoading ? "Verifying…" : "Verify & Enable 2FA"}
                    </button>
                    <button onClick={() => { setTwoFaMode("idle"); setTwoFaCode(""); setTwoFaMsg(null); }} className="text-xs text-gray-500 hover:text-gray-700 text-center">Cancel</button>
                  </div>
                )}

                {twoFaMode === "idle" && twoFaEnabled === true && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-500">Your account is protected by authenticator app 2FA. To remove it, verify your code below.</p>
                    <button
                      onClick={() => { setTwoFaMode("disable-verify"); setTwoFaCode(""); setTwoFaMsg(null); }}
                      className="w-full py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Disable 2FA
                    </button>
                  </div>
                )}

                {twoFaMode === "disable-verify" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-gray-600">Enter your current authenticator code to confirm disabling 2FA.</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-xl tracking-widest font-mono text-gray-900 focus:outline-none focus:border-gray-600 bg-white"
                    />
                    <button
                      onClick={verifyTwoFaDisable}
                      disabled={twoFaLoading || twoFaCode.length !== 6}
                      className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {twoFaLoading ? "Disabling…" : "Confirm Disable 2FA"}
                    </button>
                    <button onClick={() => { setTwoFaMode("idle"); setTwoFaCode(""); setTwoFaMsg(null); }} className="text-xs text-gray-500 hover:text-gray-700 text-center">Cancel</button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function ProfileField({ label, value, onChange, placeholder, required, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-600 bg-white placeholder-gray-400"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function PwField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-600 bg-white placeholder-gray-400"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
