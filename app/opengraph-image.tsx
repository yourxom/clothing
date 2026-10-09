import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt     = "AURELIA — Contemporary Indian Fashion";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display:         "flex",
          flexDirection:   "column",
          justifyContent:  "flex-end",
          width:           "100%",
          height:          "100%",
          background:      "linear-gradient(135deg, #f7efe4 0%, #ede3d5 50%, #e5d8c8 100%)",
          padding:         "64px",
          fontFamily:      "Georgia, serif",
        }}
      >
        {/* Decorative gradient block */}
        <div
          style={{
            position:     "absolute",
            top:          0,
            right:        0,
            width:        "45%",
            height:       "100%",
            background:   "linear-gradient(145deg, #e7cab6, #af8068)",
            opacity:      0.35,
          }}
        />
        {/* Large watermark letter */}
        <div
          style={{
            position:   "absolute",
            right:      "4%",
            top:        "5%",
            fontSize:   360,
            lineHeight: 1,
            color:      "rgba(255,255,255,0.22)",
            fontStyle:  "italic",
          }}
        >
          A
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize:      72,
            letterSpacing: "0.22em",
            color:         "#29251f",
            marginBottom:  "16px",
          }}
        >
          AURELIA
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize:    32,
            color:       "#706b62",
            maxWidth:    "560px",
            lineHeight:  1.4,
            fontStyle:   "italic",
          }}
        >
          Contemporary Indian dressing,<br />imagined for every version of your day.
        </div>

        {/* Bottom pill */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            marginTop:    "40px",
            fontSize:     16,
            letterSpacing:"0.2em",
            textTransform:"uppercase",
            color:        "#6b7c5c",
          }}
        >
          New Collection · Coming 2026
        </div>
      </div>
    ),
    { ...size }
  );
}
