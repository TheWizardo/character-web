import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { GraphData } from "../lib/types";
import { DEF_COLOR, RADIUS } from "../lib/constants";

interface Props {
  data: GraphData;
  selectedId: string | null;
  highlightTypeId: string | null;
  theme?: string;
  useLabelBg: boolean;
  onSelectCharacter: (id: string | null) => void;
  onUpdatePositions: (positions: Record<string, { x: number; y: number }>) => void;
}

export default function ForceGraph({
  data, selectedId, highlightTypeId, theme, useLabelBg,
  onSelectCharacter, onUpdatePositions,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<any, any> | null>(null);
  const posRef = useRef<Record<string, { x: number; y: number }>>({});
  const selectedIdRef = useRef(selectedId);
  const highlightTypeIdRef = useRef(highlightTypeId);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { highlightTypeIdRef.current = highlightTypeId; }, [highlightTypeId]);
  // useEffect(() => buildGraph(), [useLabelBg])

  const typeColor = useCallback(
    (id: string) => data.connectionTypes.find((ct) => ct.id === id)?.color ?? DEF_COLOR,
    [data.connectionTypes]
  );

  const buildGraph = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = window.innerWidth, H = window.innerHeight;
    svg.attr("width", W).attr("height", H);

    const cssVar = (v: string, fb: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;

    // ── Defs ──────────────────────────────────────────────
    const defs = svg.append("defs");

    data.connectionTypes.forEach((ct) => {
      defs.append("marker")
        .attr("id", `ae-${ct.id}`)
        .attr("viewBox", "0 -5 10 10").attr("refX", 28).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", ct.color).attr("opacity", 0.85);

      defs.append("marker")
        .attr("id", `as-${ct.id}`)
        .attr("viewBox", "0 -5 10 10").attr("refX", 28).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto-start-reverse")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", ct.color).attr("opacity", 0.85);
    });

    const addGlow = (id: string, std: number) => {
      const f = defs.append("filter").attr("id", id);
      f.append("feGaussianBlur").attr("stdDeviation", std).attr("result", "cb");
      const m = f.append("feMerge");
      m.append("feMergeNode").attr("in", "cb");
      m.append("feMergeNode").attr("in", "SourceGraphic");
    };
    addGlow("glow", 4);
    addGlow("selGlow", 8);

    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "transparent")
      .on("click", () => onSelectCharacter(null));

    const container = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (e) => container.attr("transform", e.transform));
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2));

    // ── Data ──────────────────────────────────────────────
    const nodes: any[] = data.characters.map((c) => ({
      ...c,
      x: posRef.current[c.id]?.x ?? (Math.random() - 0.5) * 300,
      y: posRef.current[c.id]?.y ?? (Math.random() - 0.5) * 300,
    }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: any[] = data.connections
      .filter((c) => nodeMap.has(c.source) && nodeMap.has(c.target))
      .map((c) => ({ ...c }));

    // ── Parallel edge detection ───────────────────────────
    // Use UNORDERED pair key so Tom→Hadas and Hadas→Tom are both detected
    // as sharing the same node-pair. Only when there are 2+ edges between
    // the same pair (any direction) do we curve them.
    const pairCount = new Map<string, number>();
    links.forEach((d: any) => {
      const key = [d.source, d.target].sort().join("||");
      pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
    });
    const pairIdx = new Map<string, number>();
    links.forEach((d: any) => {
      const key = [d.source, d.target].sort().join("||");
      d._pairKey = key;
      d._pairIdx = pairIdx.get(key) ?? 0;
      d._pairTotal = pairCount.get(key) ?? 1;
      pairIdx.set(key, (pairIdx.get(key) ?? 0) + 1);
    });

    // ── Simulation ────────────────────────────────────────
    // Scale link distance so more nodes get more breathing room (√n factor)
    const n = Math.max(nodes.length, 1);
    const linkDist = 160 + 20 * Math.sqrt(n);
    // If positions are already known, start soft — prevents nodes flying when
    // data changes (e.g. editing a character) from restarting the layout hard.
    const hasKnownPositions = nodes.some((nd: any) => posRef.current[nd.id]);
    const startAlpha = hasKnownPositions ? 0.15 : 0.8;

    // Viewport bounds for bounding force (container is centered at W/2, H/2)
    const padX = Math.min(W / 2 - 80, 200 + n * 12);
    const padY = Math.min(H / 2 - 80, 160 + n * 10);

    const sim = d3.forceSimulation(nodes)
      .alpha(startAlpha)
      .alphaDecay(0.025)       // slightly faster decay → settles quicker after a rebuild
      .velocityDecay(0.55)     // nodes slow down firmly — prevents drifting
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(linkDist).strength(0.3))
      .force("charge", d3.forceManyBody().strength(-220))
      .force("collision", d3.forceCollide(48))
      .force("center", d3.forceCenter(0, 0).strength(0.04))
      // Soft bounding force — pushes nodes back into view without hard-clamping
      .force("bound", (alpha: number) => {
        nodes.forEach((nd: any) => {
          const k = 0.6 * alpha;
          if (nd.x > padX) nd.vx -= k * (nd.x - padX);
          if (nd.x < -padX) nd.vx -= k * (nd.x + padX);
          if (nd.y > padY) nd.vy -= k * (nd.y - padY);
          if (nd.y < -padY) nd.vy -= k * (nd.y + padY);
        });
      });

    simRef.current = sim;

    // ── Links ─────────────────────────────────────────────
    const linkPaths = container.append("g").selectAll("path")
      .data(links).join("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => typeColor(d.type))
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.65)
      .attr("marker-end", (d: any) => `url(#ae-${d.type})`)
      .attr("marker-start", (d: any) => d.mutual ? `url(#as-${d.type})` : null);

    const labelGs = container.append("g").selectAll("g")
      .data(links).join("g");

    const label = labelGs.append("text")
      .attr("text-anchor", "middle")
      .attr("font-family", "'DM Mono', monospace")
      .attr("font-size", "9px")
      .attr("fill", (d: any) => typeColor(d.type))
      .attr("opacity", 0.9)
      .text((d: any) => {
        const s = String(d.label ?? "");
        return s.charAt(0).toUpperCase() + s.slice(1);
      });

    if (useLabelBg) {
      label.each(function () {
        const bbox = (this as SVGTextElement).getBBox();
        d3.select(this.parentNode as SVGGElement)
          .insert("rect", "text")
          .attr("x", bbox.x - 1)
          .attr("y", bbox.y)
          .attr("width", bbox.width + 2)
          .attr("height", bbox.height)
          .attr("rx", 3)
          .attr("fill", "var(--bg-base)");
      });
    }

    // ── Nodes ─────────────────────────────────────────────
    const nodeEls = container.append("g").selectAll("g")
      .data(nodes).join("g")
      .style("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", (e, d) => {
          if (!e.active) sim.alphaTarget(0.15).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => {
          if (!e.active) sim.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      )
      .on("click", (e, d: any) => { e.stopPropagation(); onSelectCharacter(d.id); });

    nodeEls.append("circle").attr("r", RADIUS)
      .attr("fill", (d: any) => d.color || DEF_COLOR).attr("fill-opacity", 0.15)
      .attr("stroke", (d: any) => d.color || DEF_COLOR).attr("stroke-width", 2)
      .attr("class", "node-ring");

    // nodeEls.append("circle").attr("r", RADIUS * 0.33)
    //   .attr("fill", (d: any) => d.color || DEF_COLOR).attr("opacity", 0.40);

    nodeEls.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-family", "'Cormorant Garamond', serif").attr("font-size", "15px")
      .attr("font-weight", "600").attr("fill", (d: any) => d.color || DEF_COLOR).attr("opacity", 0.9)
      .text((d: any) => d.name[0]);

    nodeEls.append("text").attr("text-anchor", "middle").attr("dy", "2.8em")
      .attr("font-family", "'Cormorant Garamond', serif").attr("font-size", "13px")
      .attr("font-weight", "500").attr("class", "node-label").attr("opacity", 0.9)
      .text((d: any) => d.name);

    nodeEls
      .on("mouseenter", function () {
        d3.select(this).select(".node-ring")
          .attr("r", RADIUS * 1.25).attr("fill-opacity", 0.25).attr("filter", "url(#glow)");
      })
      .on("mouseleave", function (_e, d: any) {
        const s = d.id === selectedIdRef.current;
        d3.select(this).select(".node-ring")
          .attr("r", RADIUS * (s ? 1.25 : 1)).attr("fill-opacity", s ? 0.3 : 0.15)
          .attr("filter", s ? "url(#selGlow)" : null);
      });

    // ── Path helpers ──────────────────────────────────────
    const getPairOffset = (d: any, spread = 34) => {
      if (d._pairTotal <= 1) return 0;

      if (d._pairTotal % 2 === 1) {
        const center = Math.floor(d._pairTotal / 2);
        return (d._pairIdx - center) * spread;
      }

      return (d._pairIdx - (d._pairTotal / 2 - 0.5)) * spread;
    };

    const getCurveGeom = (d: any) => {
      const sx = d.source.x, sy = d.source.y;
      const tx = d.target.x, ty = d.target.y;

      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      const ux = dx / len;
      const uy = dy / len;

      const startX = sx + ux * RADIUS;
      const startY = sy + uy * RADIUS;
      const endX = tx - ux * RADIUS;
      const endY = ty - uy * RADIUS;

      if (d._pairTotal === 1) {
        return {
          startX, startY, endX, endY,
          mx: (startX + endX) / 2,
          my: (startY + endY) / 2,
        };
      }

      // Canonical pair direction: stable regardless of actual source/target direction
      const sourceId = String(d.source.id);
      const targetId = String(d.target.id);
      const forward = sourceId < targetId;

      const csx = forward ? sx : tx;
      const csy = forward ? sy : ty;
      const ctx = forward ? tx : sx;
      const cty = forward ? ty : sy;

      const cdx = ctx - csx;
      const cdy = cty - csy;
      const clen = Math.sqrt(cdx * cdx + cdy * cdy) || 1;

      const nx = -cdy / clen;
      const ny = cdx / clen;

      const offset = getPairOffset(d);

      const midBaseX = (sx + tx) / 2;
      const midBaseY = (sy + ty) / 2;

      const mx = midBaseX + nx * offset;
      const my = midBaseY + ny * offset;

      return { startX, startY, endX, endY, mx, my };
    };

    const pathD = (d: any) => {
      const { startX, startY, endX, endY, mx, my } = getCurveGeom(d);

      if (d._pairTotal === 1) {
        return `M${startX},${startY} L${endX},${endY}`;
      }

      return `M${startX},${startY} Q${mx},${my} ${endX},${endY}`;
    };

    const labelPos = (d: any) => {
      const { startX, startY, endX, endY, mx, my } = getCurveGeom(d);

      if (d._pairTotal === 1) {
        return {
          x: (startX + endX) / 2,
          y: (startY + endY) / 2 - 7,
        };
      }

      // Quadratic Bezier midpoint at t = 0.5
      return {
        x: 0.25 * startX + 0.5 * mx + 0.25 * endX,
        y: 0.25 * startY + 0.5 * my + 0.25 * endY - 6,
      };
    };

    // ── Tick ──────────────────────────────────────────────
    sim.on("tick", () => {
      linkPaths.attr("d", (d: any) => pathD(d));
      labelGs.attr("transform", (d: any) => {
        const p = labelPos(d); return `translate(${p.x},${p.y})`;
      });
      nodeEls.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      nodes.forEach((nd: any) => { posRef.current[nd.id] = { x: nd.x, y: nd.y }; });
    });
    sim.on("end", () => onUpdatePositions({ ...posRef.current }));

    // ── Highlight (exposed via DOM ref) ───────────────────
    const applyHighlight = (charId: string | null, typeId: string | null) => {
      nodeEls.select(".node-ring")
        .attr("r", (d: any) => RADIUS * (d.id === charId ? 1.25 : 1))
        .attr("fill-opacity", (d: any) => d.id === charId ? 0.3 : 0.15)
        .attr("stroke-width", (d: any) => d.id === charId ? 3 : 2)
        .attr("filter", (d: any) => d.id === charId ? "url(#selGlow)" : null);

      if (typeId) {
        linkPaths
          .attr("opacity", (d: any) => d.type === typeId ? 1 : 0.08)
          .attr("stroke-width", (d: any) => d.type === typeId ? 2 : 1.5);
        labelGs.attr("opacity", (d: any) => d.type === typeId ? 1 : 0.08);
        nodeEls.attr("opacity", 1);
      } else if (charId) {
        linkPaths
          .attr("opacity", (d: any) => (d.source.id === charId || d.target.id === charId) ? 1 : 0.12)
          .attr("stroke-width", (d: any) => (d.source.id === charId || d.target.id === charId) ? 2 : 1.5);
        labelGs.attr("opacity", (d: any) => (d.source.id === charId || d.target.id === charId) ? 1 : 0.12);
        nodeEls.attr("opacity", (d: any) => {
          if (d.id === charId) return 1;
          return links.some((l: any) =>
            (l.source.id === charId && l.target.id === d.id) ||
            (l.target.id === charId && l.source.id === d.id)
          ) ? 0.85 : 0.3;
        });
      } else {
        linkPaths.attr("opacity", 0.65).attr("stroke-width", 1.5);
        labelGs.attr("opacity", 1);
        nodeEls.attr("opacity", 1);
      }
    };

    (svgRef.current as any).__applyHighlight = applyHighlight;
    applyHighlight(selectedIdRef.current, highlightTypeIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, useLabelBg, theme, onSelectCharacter, onUpdatePositions, typeColor]);

  useEffect(() => {
    buildGraph();
    const onResize = () => buildGraph();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); simRef.current?.stop(); };
  }, [buildGraph]);

  useEffect(() => {
    const fn = (svgRef.current as any)?.__applyHighlight;
    if (fn) fn(selectedId, highlightTypeId);
  }, [selectedId, highlightTypeId]);

  return (
    <svg ref={svgRef} className="graph-svg absolute inset-0 w-full h-full"
      style={{ background: "transparent" }} />
  );
}
