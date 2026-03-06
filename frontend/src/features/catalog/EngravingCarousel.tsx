import { useRef } from "react";

const ENGRAVING_SAMPLES = [
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.30_PM_1__05_03_2026_gnhjn1.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.30_PM_2__05_03_2026_smowko.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765493/WhatsApp_Image_2026-03-05_at_7.44.30_PM_05_03_2026_flg2ts.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.29_PM_1__05_03_2026_pfhikt.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765493/WhatsApp_Image_2026-03-05_at_7.44.29_PM_05_03_2026_q10b5w.webp",
];

export function EngravingCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const prev = () => scrollRef.current?.scrollBy({ left: -scrollRef.current.offsetWidth, behavior: "smooth" });
  const next = () => scrollRef.current?.scrollBy({ left:  scrollRef.current.offsetWidth, behavior: "smooth" });

  return (
    <div className="engraving-carousel-wrapper">
      <div className="engraving-track" ref={scrollRef}>
        {ENGRAVING_SAMPLES.map((url, i) => (
          <div key={i} className="engraving-slide">
            <img
              src={url}
              alt={`Ejemplo de grabado ${i + 1}`}
              className="engraving-sample-img"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <button type="button" className="engraving-nav engraving-nav--prev" onClick={prev} aria-label="Anterior">‹</button>
      <button type="button" className="engraving-nav engraving-nav--next" onClick={next} aria-label="Siguiente">›</button>
    </div>
  );
}
