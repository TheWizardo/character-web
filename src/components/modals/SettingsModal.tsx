import React from "react";
import { Tab } from "../../lib/types";
import { X } from "lucide-react";


interface Props {
  title: string;
  secondaryTitle?: string;
  additionalInfo?: string;
  tabs: Tab[];
  currentTab: string;
  onClose: () => void;
  setTab: (t:string) => void;
  children: React.ReactNode;
}

export default function SettingsModal({
  title, secondaryTitle, additionalInfo, tabs, currentTab, children, onClose, setTab,
}: Props) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden scale-in flex flex-col"
        style={{
          background: "var(--panel-gradient)",
          border: "1px solid var(--border-medium)",
          boxShadow: "0 40px 80px var(--shadow-xl)",
          maxHeight: "88vh",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="font-display text-lg font-semibold leading-none m-0"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h2>

              {secondaryTitle && <>
                <span
                  aria-hidden="true"
                  className="leading-none"
                  style={{ color: "var(--text-muted)" }}
                >
                  |
                </span>

                <span
                  className="text-sm leading-none"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 400,
                    marginTop: "0.02em",
                  }}
                >
                  {secondaryTitle}
                </span>
              </>}
            </div>
            {additionalInfo && <p className="font-mono text-xs" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              {additionalInfo}
            </p>}
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1.5 flex-shrink-0 mb-2">
          {tabs.map(({ id, Icon, name }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1 ${currentTab === id ? "px-5" : ""} py-2 text-sm font-mono rounded-lg transition-all`}
              style={{
                background: currentTab === id ? "var(--gold-dim)" : "transparent",
                border: `1px solid ${currentTab === id ? "var(--gold-border)" : "transparent"}`,
                color: currentTab === id ? "var(--gold)" : "var(--text-muted)",
              }}>
              <Icon size={13} /> {name}
            </button>
          ))}
        </div>

        <div style={{
          height: 0,
          width: "97.5%",
          margin: "0 auto",
          border: "1px solid var(--text-muted)",
          borderStyle: "dashed",
        }} />

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div >
    </div >
  );
}
