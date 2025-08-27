import mapboxgl from "mapbox-gl";

export function createDroneMarker(drone, map, onClick, onHover) {
  const el = document.createElement("div");
  el.className = "drone-marker";
  el.style.cssText = `width:32px;height:32px;border-radius:50%;background:${drone.isAllowed ? "#FFD700" : "#FF0000"}`;

  const icon = document.createElement("div");
  icon.style.cssText = `width:18px;height:18px;background:url(/drone.svg) no-repeat center/contain;filter:brightness(0) invert(1);transform:rotate(${drone.yaw}deg)`;
  el.appendChild(icon);

  el.addEventListener("mouseenter", onHover);
  el.addEventListener("mouseleave", () => onHover(null));
  el.addEventListener("click", () => onClick(drone.serial));

  return new mapboxgl.Marker({ element: el }).setLngLat(drone.coordinates).addTo(map);
}
