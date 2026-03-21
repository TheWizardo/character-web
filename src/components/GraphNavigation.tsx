// GraphNavigation.tsx
import { MoveLeft, MoveRight, MoveUp, MoveDown, Plus, Minus, LocateFixed, Compass } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "../lib/useIsMobile";
import { CRIT_COLOR } from "../lib/constants";
import ToolBtn from "./ToolBtn";

interface Props {
    onPanLeft: () => void;
    onPanRight: () => void;
    onPanUp: () => void;
    onPanDown: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    compact?: boolean;
}
function DesktopHint() {
    const isMobile = useIsMobile();
    {/* Desktop hint */ }
    return <>
        {!isMobile && (
            <div style={{
                textAlign: "right", pointerEvents: "none",
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: "var(--text-muted-dim)",
            }}>
                <p>Scroll to zoom · Drag to pan</p>
                <p>Click node · Click legend to filter</p>
            </div>
        )}
    </>
}

export default function GraphNavigation({
    onPanLeft,
    onPanRight,
    onPanUp,
    onPanDown,
    onZoomIn,
    onZoomOut,
    onReset,
    compact = false,
}: Props) {
    const [expanded, setExpanded] = useState(false);

    const size = compact ? 40 : 46;
    const icon = compact ? 16 : 18;


    const btnStyle: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: "var(--panel-gradient)",
        border: "1px solid var(--border-medium)",
        color: "var(--text-muted)",
        transition: "transform 0.12s ease, color 0.12s ease, border-color 0.12s ease",
    };

    const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.color = "var(--gold)";
        e.currentTarget.style.borderColor = "var(--gold-border)";
    };

    const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "var(--border-medium)";
    };

    const goldenBtnStyle: React.CSSProperties = {
        ...btnStyle,
        background: "linear-gradient(135deg, var(--text-muted), var(--gold))",
        color: "var(--bg-deep)",
        border: "1px solid var(--gold-border)",
        fontFamily: "'DM Mono', monospace",
        fontWeight: 600,
        fontSize: compact ? 15 : 16,
    };


    if (expanded) {
        return <div
            style={{
                display: compact ? "flex" : "grid",
                flexDirection: compact ? "column" : undefined,
                gridTemplateColumns: compact ? undefined : `${size}px ${size}px ${size}px`,
                gridTemplateRows: compact ? undefined : `${size}px ${size}px ${size}px`,
                gap: compact ? 6 : 8,
                padding: `${icon * (compact ? 0.5 : 0.75)}px ${icon * (compact ? 0.75 : 1)}px`,
                borderRadius: 12,
                background: "var(--bg-deep)",
                border: "1px solid var(--border-subtle)",
                backdropFilter: "blur(8px)",
                opacity: 0.93,
                alignItems: "center",
            }}
        >
            {compact ? (
                <>
                    <ToolBtn onClick={onZoomIn} gold style={{ width: size, height: size }}>
                        <Plus size={icon} />
                    </ToolBtn>

                    <button
                        style={goldenBtnStyle}
                        onClick={onReset}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="Reset / fit"
                    >
                        <LocateFixed size={icon} />
                    </button>

                    <ToolBtn onClick={onZoomOut} gold style={{ width: size, height: size }}>
                        <Minus size={icon} />
                    </ToolBtn>

                    <button style={{ ...btnStyle, ...{ color: CRIT_COLOR } }} onClick={() => setExpanded(false)} title="Exit">
                        <Compass size={icon} />
                    </button>
                </>
            ) : (
                <>
                    <div />
                    <button style={btnStyle} onClick={onPanUp} onMouseEnter={hoverIn} onMouseLeave={hoverOut} title="Pan up">
                        <MoveUp size={icon} />
                    </button>
                    <button style={{ ...btnStyle, ...{ color: CRIT_COLOR } }} onClick={() => setExpanded(false)} title="Exit">
                        <Compass size={icon} />
                    </button>

                    <button style={btnStyle} onClick={onPanLeft} onMouseEnter={hoverIn} onMouseLeave={hoverOut} title="Pan left">
                        <MoveLeft size={icon} />
                    </button>
                    <button
                        style={goldenBtnStyle}
                        onClick={onReset}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="Reset / fit"
                    >
                        <LocateFixed size={icon} />
                    </button>
                    <button style={btnStyle} onClick={onPanRight} onMouseEnter={hoverIn} onMouseLeave={hoverOut} title="Pan right">
                        <MoveRight size={icon} />
                    </button>

                    <ToolBtn onClick={onZoomOut} gold style={{ width: size, height: size }}>
                        <Minus size={icon} />
                    </ToolBtn>
                    <button style={btnStyle} onClick={onPanDown} onMouseEnter={hoverIn} onMouseLeave={hoverOut} title="Pan down">
                        <MoveDown size={icon} />
                    </button>
                    <ToolBtn onClick={onZoomIn} gold style={{ width: size, height: size }}>
                        <Plus size={icon} />
                    </ToolBtn>
                </>
            )}
        </div>
    }

    return (
        <div
            className="flex flex-col items-end gap-3"
            style={compact ? {} : { width: "30ch" }}>
            <button
                onClick={() => { setExpanded(true); console.log("click") }}
                title="Navigation"
                style={{
                    ...btnStyle,
                    width: compact ? 48 : 52,
                    height: compact ? 48 : 52,
                }}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
            >
                <Compass size={compact ? 18 : 20} />
            </button>
            <DesktopHint />
        </div >
    );
}