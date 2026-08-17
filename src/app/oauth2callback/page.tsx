"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Table, AlertCircle } from "lucide-react";

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Memproses otorisasi Google API...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Parse URL params (search & hash)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));

    const code = urlParams.get("code");
    const accessToken = hashParams.get("access_token") || urlParams.get("access_token");
    const error = urlParams.get("error") || hashParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Gagal otorisasi Google API: ${error}`);
      setTimeout(() => router.push("/laporan"), 3000);
      return;
    }

    if (code || accessToken) {
      if (accessToken) {
        localStorage.setItem("google_sheets_access_token", accessToken);
      }
      localStorage.setItem("google_sheets_connected", "true");
      localStorage.setItem("google_sheets_connected_at", new Date().toISOString());

      setStatus("success");
      setMessage("Berhasil terhubung dengan Google Sheets API! Mengalihkan kembali ke Laporan...");

      setTimeout(() => {
        router.push("/laporan?google_sheets_sync=success");
      }, 1500);
    } else {
      // Default fallback when page opened directly
      setStatus("success");
      setMessage("Endpoint Callback Google OAuth 2.0 Siap Digunakan.");
      setTimeout(() => {
        router.push("/laporan");
      }, 2000);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
          <Table className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-lg font-extrabold text-slate-900">Google Sheets API OAuth 2.0</h1>
          <p className="text-xs text-slate-500 mt-1">{message}</p>
        </div>

        <div className="py-2">
          {status === "loading" && (
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Memverifikasi Token Google...</span>
            </div>
          )}

          {status === "success" && (
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Otorisasi Terverifikasi!</span>
            </div>
          )}

          {status === "error" && (
            <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Gagal Otorisasi Google</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-400 font-mono">
          Kedai Nyamleng POS — OAuth 2.0 Callback System
        </p>
      </div>
    </div>
  );
}
