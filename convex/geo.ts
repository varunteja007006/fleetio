export function haversineDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371000;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function distanceToSegment(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
	plat: number,
	plng: number,
): number {
	const midLatRad = ((lat1 + lat2) / 2) * (Math.PI / 180);
	const mPerDegLat = 111320;
	const mPerDegLng = 111320 * Math.cos(midLatRad);

	const ax = lng1 * mPerDegLng;
	const ay = lat1 * mPerDegLat;
	const bx = lng2 * mPerDegLng;
	const by = lat2 * mPerDegLat;
	const px = plng * mPerDegLng;
	const py = plat * mPerDegLat;

	const dx = bx - ax;
	const dy = by - ay;

	if (dx === 0 && dy === 0) {
		return Math.hypot(px - ax, py - ay);
	}

	const t = Math.max(
		0,
		Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)),
	);

	const cx = ax + t * dx;
	const cy = ay + t * dy;

	return Math.hypot(px - cx, py - cy);
}
