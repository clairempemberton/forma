// Greedy screen-space clustering for a few dozen markers. Points within `radius`
// pixels of a cluster's first member join it. Output order is stable for a given input.
export function clusterPoints(points, project, radius = 40) {
  const clusters = [];
  for (const p of points) {
    const [x, y] = project(p.lngLat);
    const hit = clusters.find((c) => (c.x - x) ** 2 + (c.y - y) ** 2 < radius * radius);
    if (hit) {
      hit.members.push(p);
      const n = hit.members.length;
      hit.cx = (hit.cx * (n - 1) + x) / n;
      hit.cy = (hit.cy * (n - 1) + y) / n;
    } else {
      clusters.push({ x, y, cx: x, cy: y, members: [p] });
    }
  }
  return clusters.map((c) => ({
    id: c.members.length > 1 ? `cluster:${c.members.map((m) => m.id).sort().join(",")}` : c.members[0].id,
    members: c.members,
    count: c.members.length,
    lngLat: c.members.length > 1
      ? [c.members.reduce((a, m) => a + m.lngLat[0], 0) / c.members.length, c.members.reduce((a, m) => a + m.lngLat[1], 0) / c.members.length]
      : c.members[0].lngLat,
  }));
}
