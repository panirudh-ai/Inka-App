import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/system";
import { alpha } from "@mui/material/styles";
import { G8 } from "../theme.js";

// ── Orb float keyframes ──────────────────────────────────────────────────────
const float1 = keyframes`
  0%,100% { transform: translate(0px,  0px)   scale(1);    }
  25%      { transform: translate(-70px, 80px)  scale(1.08); }
  50%      { transform: translate(50px,  130px) scale(0.94); }
  75%      { transform: translate(90px,  -50px) scale(1.05); }
`;
const float2 = keyframes`
  0%,100% { transform: translate(0px,  0px)   scale(1);    }
  30%      { transform: translate(100px, -60px) scale(1.1);  }
  60%      { transform: translate(-40px, 90px)  scale(0.92); }
  80%      { transform: translate(-80px, -30px) scale(1.04); }
`;
const float3 = keyframes`
  0%,100% { transform: translate(0px,   0px)   scale(1);    }
  20%      { transform: translate(60px,  100px) scale(0.96); }
  55%      { transform: translate(-90px, 60px)  scale(1.08); }
  80%      { transform: translate(30px,  -80px) scale(1.02); }
`;
const float4 = keyframes`
  0%,100% { transform: translate(0px,   0px)   scale(1);    }
  35%      { transform: translate(-60px, -90px) scale(1.06); }
  65%      { transform: translate(80px,  40px)  scale(0.95); }
`;
const grain = keyframes`
  0%,100% { transform: translate(0,0) }
  10%     { transform: translate(-2%,-3%) }
  20%     { transform: translate(3%, 2%) }
  30%     { transform: translate(-1%, 4%) }
  40%     { transform: translate(4%,-1%) }
  50%     { transform: translate(-3%, 3%) }
  60%     { transform: translate(2%, -4%) }
  70%     { transform: translate(-4%, 1%) }
  80%     { transform: translate(1%, 3%) }
  90%     { transform: translate(-2%,-2%) }
`;

export default function AnimatedBackground({ isDark }) {
  const noiseRef = useRef(null);

  // Generate SVG noise texture on mount
  useEffect(() => {
    if (!noiseRef.current) return;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.setAttribute("width", "200");
    svg.setAttribute("height", "200");
    const filter = document.createElementNS(ns, "filter");
    filter.setAttribute("id", "noise");
    const feTurbulence = document.createElementNS(ns, "feTurbulence");
    feTurbulence.setAttribute("type", "fractalNoise");
    feTurbulence.setAttribute("baseFrequency", "0.65");
    feTurbulence.setAttribute("numOctaves", "3");
    feTurbulence.setAttribute("stitchTiles", "stitch");
    const feColorMatrix = document.createElementNS(ns, "feColorMatrix");
    feColorMatrix.setAttribute("type", "saturate");
    feColorMatrix.setAttribute("values", "0");
    filter.appendChild(feTurbulence);
    filter.appendChild(feColorMatrix);
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("filter", "url(#noise)");
    svg.appendChild(filter);
    svg.appendChild(rect);
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    noiseRef.current.style.backgroundImage = `url(${url})`;
    return () => URL.revokeObjectURL(url);
  }, []);

  const orbs = isDark
    ? [
        {
          size: 700, top: "-15%", left: "55%",
          color: `radial-gradient(circle, ${alpha(G8.orange, 0.18)} 0%, transparent 68%)`,
          animation: `${float1} 22s ease-in-out infinite`,
        },
        {
          size: 900, top: "20%", left: "-20%",
          color: `radial-gradient(circle, ${alpha("#4a3060", 0.55)} 0%, transparent 65%)`,
          animation: `${float2} 28s ease-in-out infinite`,
        },
        {
          size: 600, top: "55%", left: "65%",
          color: `radial-gradient(circle, ${alpha("#1e3a3a", 0.6)} 0%, transparent 65%)`,
          animation: `${float3} 19s ease-in-out infinite`,
        },
        {
          size: 500, top: "70%", left: "15%",
          color: `radial-gradient(circle, ${alpha(G8.orange, 0.09)} 0%, transparent 65%)`,
          animation: `${float4} 24s ease-in-out infinite`,
        },
      ]
    : [
        {
          size: 700, top: "-15%", left: "55%",
          color: `radial-gradient(circle, ${alpha(G8.orange, 0.12)} 0%, transparent 68%)`,
          animation: `${float1} 22s ease-in-out infinite`,
        },
        {
          size: 900, top: "20%", left: "-20%",
          color: `radial-gradient(circle, ${alpha("#c8b4a0", 0.45)} 0%, transparent 65%)`,
          animation: `${float2} 28s ease-in-out infinite`,
        },
        {
          size: 600, top: "55%", left: "65%",
          color: `radial-gradient(circle, ${alpha("#a8c4b8", 0.35)} 0%, transparent 65%)`,
          animation: `${float3} 19s ease-in-out infinite`,
        },
        {
          size: 500, top: "70%", left: "15%",
          color: `radial-gradient(circle, ${alpha(G8.orange, 0.07)} 0%, transparent 65%)`,
          animation: `${float4} 24s ease-in-out infinite`,
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
      {/* Gradient orbs */}
      {orbs.map((orb, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            width:  orb.size,
            height: orb.size,
            top:    orb.top,
            left:   orb.left,
            borderRadius: "50%",
            background: orb.color,
            animation: orb.animation,
            willChange: "transform",
            filter: "blur(1px)",
          }}
        />
      ))}

      {/* Subtle radial vignette */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(ellipse 80% 80% at 50% 0%, transparent 40%, rgba(20,20,20,0.7) 100%)"
            : "radial-gradient(ellipse 80% 80% at 50% 0%, transparent 40%, rgba(240,235,229,0.5) 100%)",
        }}
      />

      {/* Film grain noise overlay */}
      <Box
        ref={noiseRef}
        sx={{
          position: "absolute",
          inset: "-20%",
          opacity: isDark ? 0.045 : 0.035,
          backgroundSize: "200px 200px",
          backgroundRepeat: "repeat",
          animation: `${grain} 8s steps(10) infinite`,
          mixBlendMode: "overlay",
        }}
      />
    </Box>
  );
}
