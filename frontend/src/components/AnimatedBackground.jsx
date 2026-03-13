import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/system";
import { alpha } from "@mui/material/styles";
import { G8 } from "../theme.js";

// ── Slow drift keyframes ──────────────────────────────────────────────────────
const drift1 = keyframes`
  0%,100% { transform: translate(0px,   0px)   scale(1);    }
  33%      { transform: translate(70px,  90px)  scale(1.05); }
  66%      { transform: translate(-50px, 55px)  scale(0.96); }
`;
const drift2 = keyframes`
  0%,100% { transform: translate(0px,   0px)    scale(1);    }
  40%      { transform: translate(-80px, -60px)  scale(0.95); }
  72%      { transform: translate(65px,  75px)   scale(1.04); }
`;
const drift3 = keyframes`
  0%,100% { transform: translate(0px,  0px)   scale(1);    }
  30%      { transform: translate(80px, -70px) scale(1.06); }
  65%      { transform: translate(-45px,65px)  scale(0.96); }
`;
const grain = keyframes`
  0%,100% { transform: translate(0,0) }
  20%     { transform: translate(-1%,-2%) }
  40%     { transform: translate(2%, 1%) }
  60%     { transform: translate(-1%, 3%) }
  80%     { transform: translate(2%,-1%) }
`;

export default function AnimatedBackground({ isDark }) {
  const noiseRef = useRef(null);

  useEffect(() => {
    if (!noiseRef.current) return;
    const ns  = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.setAttribute("width",  "200");
    svg.setAttribute("height", "200");
    const filter  = document.createElementNS(ns, "filter");
    filter.setAttribute("id", "noise");
    const feTurb  = document.createElementNS(ns, "feTurbulence");
    feTurb.setAttribute("type",          "fractalNoise");
    feTurb.setAttribute("baseFrequency", "0.70");
    feTurb.setAttribute("numOctaves",    "4");
    feTurb.setAttribute("stitchTiles",   "stitch");
    const feColor = document.createElementNS(ns, "feColorMatrix");
    feColor.setAttribute("type",   "saturate");
    feColor.setAttribute("values", "0");
    filter.appendChild(feTurb);
    filter.appendChild(feColor);
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("width",  "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("filter", "url(#noise)");
    svg.appendChild(filter);
    svg.appendChild(rect);
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" })
    );
    noiseRef.current.style.backgroundImage = `url(${url})`;
    return () => URL.revokeObjectURL(url);
  }, []);

  // CSB: yellow + ash orbs on very deep dark
  const orbs = isDark
    ? [
        {
          size: 800, top: "-22%", left: "48%",
          color: `radial-gradient(circle, ${alpha(G8.orange, 0.07)} 0%, transparent 65%)`,
          anim: `${drift1} 36s ease-in-out infinite`,
        },
        {
          size: 700, top: "35%",  left: "-16%",
          color: `radial-gradient(circle, ${alpha("#808080", 0.06)} 0%, transparent 65%)`,
          anim: `${drift2} 44s ease-in-out infinite`,
        },
        {
          size: 600, top: "62%",  left: "60%",
          color: `radial-gradient(circle, ${alpha(G8.orange, 0.05)} 0%, transparent 65%)`,
          anim: `${drift3} 30s ease-in-out infinite`,
        },
      ]
    : [
        {
          size: 800, top: "-22%", left: "48%",
          color: `radial-gradient(circle, ${alpha(G8.orangeDim, 0.06)} 0%, transparent 65%)`,
          anim: `${drift1} 36s ease-in-out infinite`,
        },
        {
          size: 700, top: "35%",  left: "-16%",
          color: `radial-gradient(circle, ${alpha("#888888", 0.05)} 0%, transparent 65%)`,
          anim: `${drift2} 44s ease-in-out infinite`,
        },
        {
          size: 600, top: "62%",  left: "60%",
          color: `radial-gradient(circle, ${alpha(G8.orangeDim, 0.04)} 0%, transparent 65%)`,
          anim: `${drift3} 30s ease-in-out infinite`,
        },
      ];

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        backgroundColor: isDark ? G8.black : G8.cream,
      }}
    >
      {/* CSB signature: subtle dot grid in dark mode */}
      {isDark && (
        <Box sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 100%)",
        }} />
      )}

      {/* Gradient orbs */}
      {orbs.map((orb, i) => (
        <Box key={i} sx={{
          position: "absolute",
          width: orb.size, height: orb.size,
          top: orb.top, left: orb.left,
          borderRadius: "50%",
          background: orb.color,
          animation: orb.anim,
          willChange: "transform",
          filter: "blur(2px)",
        }} />
      ))}

      {/* Radial vignette */}
      <Box sx={{
        position: "absolute",
        inset: 0,
        background: isDark
          ? "radial-gradient(ellipse 90% 90% at 50% 0%, transparent 40%, rgba(21,21,21,0.8) 100%)"
          : "radial-gradient(ellipse 90% 90% at 50% 0%, transparent 40%, rgba(255,255,255,0.65) 100%)",
      }} />

      {/* Film grain */}
      <Box
        ref={noiseRef}
        sx={{
          position: "absolute",
          inset: "-20%",
          opacity: isDark ? 0.02 : 0.015,
          backgroundSize: "200px 200px",
          backgroundRepeat: "repeat",
          animation: `${grain} 10s steps(10) infinite`,
          mixBlendMode: "overlay",
        }}
      />
    </Box>
  );
}
