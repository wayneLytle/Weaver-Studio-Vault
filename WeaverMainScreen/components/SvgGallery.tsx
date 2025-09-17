// Place this in WeaverMainScreen/components/SvgGallery.tsx
const iconNames = [
  "arrow-big-up.svg",
  // Add more SVG filenames here
];

export default function SvgGallery() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "24px", background: "#181820", padding: "32px" }}>
      {iconNames.map(name => (
        <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={`/icons/lucide-main/icons/${name}`} alt={name} style={{ width: 48, height: 48 }} />
          <span style={{ color: "#e0c87a", fontSize: 12, marginTop: 8 }}>{name.replace(".svg", "")}</span>
        </div>
      ))}
    </div>
  );
}
