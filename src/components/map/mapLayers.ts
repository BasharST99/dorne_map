import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import { loadImage } from "@/utils/mapUtils";

const ICON_DIAMETER = 44;     
const ICON_BORDER   = 4; 
const ARROW_W       = 14;    
const ARROW_H       = 12;  
const PADDING       = 6;   
const GREEN         = "#28E34E";
const GREEN_DARK    = "#1ba83a";
const RED           = "#FF3B30";
const RED_DARK      = "#CC2F26";

const SHADOW_BLUR   = 8;
const SHADOW_Y      = 2;
const SHADOW_COLOR  = "rgba(0,0,0,0.35)";


async function makeDroneBitmap(
  fill: string,
  ring: string,
  glyphImg: HTMLImageElement
) {
  const W = ICON_DIAMETER + PADDING * 2 + ARROW_H;
  const H = ICON_DIAMETER + PADDING * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const cx = PADDING + ICON_DIAMETER / 2;
  const cy = PADDING + ICON_DIAMETER / 2;

  ctx.save();
  ctx.shadowColor = SHADOW_COLOR;
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = SHADOW_Y;

  ctx.beginPath();
  ctx.arc(cx, cy, ICON_DIAMETER / 2, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.fill();

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, ICON_DIAMETER / 2 - ICON_BORDER, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();

  const baseX = cx + ICON_DIAMETER / 2 - 1; 
  const baseY = cy;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY - ARROW_W / 2);
  ctx.lineTo(baseX, baseY + ARROW_W / 2);
  ctx.lineTo(baseX + ARROW_H, baseY);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // drone glyph (white) centered
  const maxGlyph = ICON_DIAMETER * 0.7;
  const scale = Math.min(maxGlyph / glyphImg.width, maxGlyph / glyphImg.height);
  const gW = glyphImg.width * scale;
  const gH = glyphImg.height * scale;
  ctx.drawImage(glyphImg, cx - gW / 2, cy - gH / 2, gW, gH);

  return await createImageBitmap(canvas);
}

export type Sources = { drones: GeoJSONSource; paths: GeoJSONSource };

export async function addSourcesAndLayers(
  map: mapboxgl.Map,
  dronesData: GeoJSON.FeatureCollection,
  pathsData: GeoJSON.FeatureCollection
): Promise<Sources> {
  // Sources
  map.addSource("drones", { type: "geojson", data: dronesData, promoteId: "id" });
  map.addSource("paths",  { type: "geojson", data: pathsData,  promoteId: "id" });

  // Load your white-on-transparent glyph from /public
  const glyph = await loadImage("/drone.png");

  // Build composite icons
  const bmpGreen = await makeDroneBitmap(GREEN, GREEN_DARK, glyph);
  const bmpRed   = await makeDroneBitmap(RED,   RED_DARK,   glyph);

  if (!map.hasImage("drone-green")) map.addImage("drone-green", bmpGreen, { pixelRatio: 2 });
  if (!map.hasImage("drone-red"))   map.addImage("drone-red",   bmpRed,   { pixelRatio: 2 });


  // Drone puck + arrow (entire icon rotates via feature.properties.rotation)
  map.addLayer({
    id: "drones-layer",
    type: "symbol",
    source: "drones",
    layout: {
      "icon-image": [
        "case",
        ["==", ["get", "allowed"], 1],
        "drone-green",
        "drone-red"
      ],
      // Smooth size scaling; set a constant (e.g., 1) if you prefer fixed size
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        10, 0.65,
        14, 0.9,
        18, 1.1,
        22, 1.3
      ],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-rotation-alignment": "map",
      "icon-rotate": ["get", "rotation"], 
    },
  });

  map.addLayer({
    id: "paths-layer",
    type: "line",
    source: "paths",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "allowed"], 1],
        GREEN,
        RED,
      ],
      "line-width": 2,
      "line-opacity": 0.6,
    },
  });

  // Pointer feedback
  map.on("mouseenter", "drones-layer", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "drones-layer", () => { map.getCanvas().style.cursor = ""; });

  return {
    drones: map.getSource("drones") as GeoJSONSource,
    paths:  map.getSource("paths")  as GeoJSONSource,
  };
}
