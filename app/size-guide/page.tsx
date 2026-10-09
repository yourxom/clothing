import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "AURELIA size guide — find your perfect fit across kurtas, dresses, sarees, lehengas and more.",
};

const womensSizes = [
  { size: "XS", chest: "32–33", waist: "26–27", hips: "35–36", indianSize: "S" },
  { size: "S",  chest: "34–35", waist: "28–29", hips: "37–38", indianSize: "M" },
  { size: "M",  chest: "36–37", waist: "30–31", hips: "39–40", indianSize: "L" },
  { size: "L",  chest: "38–40", waist: "32–34", hips: "41–43", indianSize: "XL" },
  { size: "XL", chest: "41–43", waist: "35–37", hips: "44–46", indianSize: "XXL" },
  { size: "XXL",chest: "44–46", waist: "38–40", hips: "47–49", indianSize: "3XL" },
];

const kurtaLengths = [
  { type: "Tunic kurta",    length: "35–38 inches", bestFor: "Worn with jeans or palazzos" },
  { type: "Straight kurta", length: "40–42 inches", bestFor: "Worn with churidar or leggings" },
  { type: "Long kurta",     length: "44–48 inches", bestFor: "Paired with slim pants or worn as a dress" },
  { type: "Anarkali",       length: "50–55 inches", bestFor: "Festive and occasion wear" },
];

const fittingTips = [
  { title: "Measure yourself",    tip: "Use a soft measuring tape. Measure over light clothing for the most accurate result. Measure chest at the fullest point, waist at the narrowest, hips at the widest." },
  { title: "When in between sizes", tip: "Go up one size for a relaxed fit, or down for a more tailored look. AURELIA silhouettes are designed with ease — we recommend your natural size in most styles." },
  { title: "Kurta length",        tip: "If you prefer a shorter or longer length than stated, note it in your order comments. Alterations will be available at launch." },
  { title: "Sarees and lehengas", tip: "Saree blouses are sized by chest measurement. Lehenga waistbands are adjustable by ±2 inches unless stated otherwise." },
];

export default function SizeGuidePage() {
  return (
    <main id="main-content" className="container content-page">
      <span className="eyebrow">Fit &amp; sizing</span>
      <h1 className="serif">Find your perfect fit.</h1>
      <p className="content-lead">
        All AURELIA measurements are in inches. If you&apos;re between sizes, we recommend going
        up — our silhouettes are designed with room to move.
      </p>
      <p className="notice">
        This is a preview guide. Final size specifications will be confirmed for each style
        before the catalogue launches.
      </p>

      {/* Main size chart */}
      <h2>Women&apos;s size chart</h2>
      <p>All measurements in inches.</p>
      <div className="size-table-wrap">
        <table className="size-table">
          <caption className="sr-only">Women&apos;s size chart — measurements in inches</caption>
          <thead>
            <tr>
              <th scope="col">AURELIA size</th>
              <th scope="col">Chest</th>
              <th scope="col">Waist</th>
              <th scope="col">Hips</th>
              <th scope="col">Indian size equiv.</th>
            </tr>
          </thead>
          <tbody>
            {womensSizes.map(row => (
              <tr key={row.size}>
                <td><strong>{row.size}</strong></td>
                <td>{row.chest}</td>
                <td>{row.waist}</td>
                <td>{row.hips}</td>
                <td>{row.indianSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kurta lengths */}
      <h2>Kurta lengths</h2>
      <div className="size-table-wrap">
        <table className="size-table">
          <caption className="sr-only">Kurta length guide</caption>
          <thead>
            <tr>
              <th scope="col">Style</th>
              <th scope="col">Length (approx.)</th>
              <th scope="col">Best worn with</th>
            </tr>
          </thead>
          <tbody>
            {kurtaLengths.map(row => (
              <tr key={row.type}>
                <td><strong>{row.type}</strong></td>
                <td>{row.length}</td>
                <td>{row.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fitting tips */}
      <h2>Fitting tips</h2>
      <div className="content-card-grid">
        {fittingTips.map(tip => (
          <div key={tip.title} className="content-card">
            <h2>{tip.title}</h2>
            <p>{tip.tip}</p>
          </div>
        ))}
      </div>

      {/* How to measure */}
      <h2>How to measure yourself</h2>
      <details open>
        <summary>Chest / Bust</summary>
        <p>Wrap the tape measure around the fullest part of your chest, keeping it parallel to the floor. Breathe normally and don&apos;t pull the tape too tight.</p>
      </details>
      <details>
        <summary>Waist</summary>
        <p>Measure around your natural waistline — the narrowest part of your torso, usually about an inch above your belly button.</p>
      </details>
      <details>
        <summary>Hips</summary>
        <p>Stand with feet together and measure around the widest part of your hips and seat, keeping the tape parallel to the floor.</p>
      </details>
      <details>
        <summary>Height</summary>
        <p>Stand straight against a wall without shoes. Mark the wall at the top of your head and measure from the floor to the mark. Most AURELIA lengths are designed for a height of 5&apos;4&quot;–5&apos;6&quot;.</p>
      </details>

      <p style={{ marginTop: "2.5rem" }}>
        Still unsure? <Link href="/contact" className="text-link">Ask us for help ↗</Link>
      </p>
    </main>
  );
}
