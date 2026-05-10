"use client";
import Tilt from "react-parallax-tilt";
import { QRCodeSVG } from "qrcode.react";
import { Terminal } from "lucide-react";
import { profile } from "@/content/profile";

export function AccessCard() {
  if (!profile.accessCard) return null;
  const c = profile.accessCard;
  const qrValue = c.qrUrl ?? profile.calendlyUrl;

  return (
    <Tilt
      tiltMaxAngleX={8}
      tiltMaxAngleY={8}
      perspective={1200}
      glareEnable
      glareMaxOpacity={0.18}
      glareColor="#ffffff"
      glarePosition="all"
      glareBorderRadius="12px"
      transitionSpeed={1500}
      gyroscope={false}
      className="w-full"
    >
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl p-5 font-mono text-xs uppercase tracking-wide"
        style={{
          background:
            "linear-gradient(145deg, hsl(0 0% 12%) 0%, hsl(0 0% 6%) 100%)",
          boxShadow:
            "inset 0 1px 0 hsl(0 0% 100% / 0.06), 0 16px 32px hsl(0 0% 0% / 0.4)",
          color: "hsl(0 0% 80%)",
        }}
      >
        {/* Terminal icon */}
        <Terminal className="h-7 w-7 text-white" aria-hidden />

        {/* Top labels */}
        <div className="mt-6">
          <p className="text-[13px] font-bold tracking-wider text-white">{c.label}</p>
          <p className="text-[10px] text-white/40">{c.subLabel}</p>
        </div>

        {/* Member section */}
        <div className="mt-12">
          <p className="text-[10px] text-white/40">{c.memberLabel}</p>
          <p className="text-[13px] font-bold tracking-wider text-white">{c.ownerName}</p>
        </div>

        {/* Bottom row: role + QR */}
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <p className="text-[10px] text-white/40">{c.role}</p>
          <div className="rounded-sm bg-white p-1">
            <QRCodeSVG value={qrValue} size={56} bgColor="#ffffff" fgColor="#000000" level="L" />
          </div>
        </div>
      </div>
    </Tilt>
  );
}
