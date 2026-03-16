// src/components/portals/user/AMLSimulator.jsx

import { useState } from "react";
import { User, CreditCard, DollarSign, Zap } from "lucide-react";
import { AML_TRANSACTIONS } from "../../../data/mockData";
import { buildTxnId, scoreTxn, formatTime, formatINR } from "../../../utils/helpers";
import { Panel, SectionHeader, Badge } from "../../shared";

const FORM_FIELDS = [
  { key: "receiver", label: "Receiver Name",  placeholder: "e.g. Riya Mehta",   icon: User,       type: "text"   },
  { key: "account",  label: "Account Number", placeholder: "e.g. HDFC••4521",   icon: CreditCard, type: "text"   },
  { key: "amount",   label: "Amount (₹)",     placeholder: "e.g. 50000",         icon: DollarSign, type: "number" },
];

export default function AMLSimulator() {
  const [transactions, setTransactions] = useState(AML_TRANSACTIONS);
  const [form,         setForm]         = useState({ receiver: "", account: "", amount: "" });

  const handleSubmit = () => {
    if (!form.receiver || !form.amount) return;

    const { score, status } = scoreTxn(Math.random());
    const newTxn = {
      id:       buildTxnId(transactions.length + 1),
      receiver: form.receiver,
      account:  form.account || "UNKN••0000",
      amount:   parseFloat(form.amount),
      status,
      score,
      time:     formatTime(),
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setForm({ receiver: "", account: "", amount: "" });
  };

  const flaggedCount = transactions.filter((t) => t.status === "flagged").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-2xl font-bold tracking-tight">AML Simulator</h2>
        <p className="text-slate-400 text-sm">Simulate transactions and observe AML scoring in real-time</p>
      </div>

      {/* ── New transaction form ── */}
      <Panel>
        <SectionHeader title="New Transaction" />
        <div className="grid grid-cols-3 gap-4">
          {FORM_FIELDS.map(({ key, label, placeholder, icon: Icon, type }) => (
            <div key={key}>
              <label className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2 block">
                {label}
              </label>
              <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-mono"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-mono transition-all flex items-center gap-2 group"
        >
          <Zap size={14} className="group-hover:animate-bounce" />
          Simulate Transaction
        </button>
      </Panel>

      {/* ── Transaction table ── */}
      <Panel>
        <SectionHeader
          title="Transaction History"
          subtitle={`${flaggedCount} flagged of ${transactions.length} total`}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {["Txn ID", "Receiver", "Account", "Amount", "AML Score", "Status", "Time"].map((h) => (
                  <th key={h} className="text-left text-xs font-mono uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((t) => (
                <tr key={t.id} className={t.status === "flagged" ? "bg-rose-500/5" : ""}>
                  <td className="py-3 pr-4 text-slate-400 text-xs font-mono">{t.id}</td>
                  <td className="py-3 pr-4 text-white text-sm font-medium">{t.receiver}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs font-mono">{t.account}</td>
                  <td className="py-3 pr-4 text-white text-sm font-mono">₹{formatINR(t.amount)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5 w-16">
                        <div
                          className={`h-1.5 rounded-full transition-all ${t.score > 0.6 ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${t.score * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${t.score > 0.6 ? "text-rose-400" : "text-emerald-400"}`}>
                        {t.score}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4"><Badge status={t.status} /></td>
                  <td className="py-3 text-slate-500 text-xs font-mono">{t.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
