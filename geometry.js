function distance(a, b) {
  return (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
}

function orient(a, b, c) {
  return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
}

function isConvex(a, b, c) {
  return orient(a, b, c) >= 0;
}

function testPointTriangle(p, a, b, c) {
  return orient(a, b, p) >= 0 && orient(b, c, p) >= 0 && orient(c, a, p) >= 0;
}

function pointSegmentDistance(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = p.x - a.x;
  const wy = p.y - a.y;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) {
    return distance(p, a);
  }
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    return distance(p, b);
  }
  const t = c1 / c2;
  const px = a.x + t * vx;
  const py = a.y + t * vy;
  return (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py);
}

function testSegments(a1, b1, a2, b2) {
  return orient(a1, b1, a2) * orient(a1, b1, b2) < 0 && orient(a2, b2, a1) * orient(a2, b2, b1) < 0;
}

function fixPolygon(polygon) {
  var area = 0;
  for (var i1 = polygon.length - 1, i2 = 0; i2 < polygon.length; i1 = i2, i2++) {
    area += polygon[i1].x * polygon[i2].y - polygon[i1].y * polygon[i2].x;
  }
  if (area < 0) {
    return [...polygon].reverse();
  }
  else {
    return polygon;
  }
}

// O(n^4) but O(n^3) on average due to randomization
function generateRandomPolygon(n, d, x1, y1, x2, y2) {
  var points = [];
  for (var i = 0; i < n; i++) {
    points[i] = { x: randomBetween(x1, x2), y: randomBetween(y1, y2) };
  }
  points.sort((a, b) => a.x - b.x);
  var polygon = [];
  polygon.push(points[0]);
  polygon.push(points[1]);
  for (var i = 2; i < points.length; i++) {
    while (polygon.length >= 2 && !isConvex(polygon[polygon.length - 2], polygon[polygon.length - 1], points[i])) {
      polygon.pop();
    }
    polygon.push(points[i]);
  }
  randomShuffle(points);
  var dSq = d * d;
  while (true) {
    var stop = true;
    for (var i1 = polygon.length - 1, i2 = 0; i2 < polygon.length; i1 = i2, i2++) {
      for (var j = 0; j < points.length; j++) {
        if (polygon.includes(points[j])) {
          continue;
        }
        var bad = false;
        for (var k1 = polygon.length - 1, k2 = 0; k2 < polygon.length && !bad; k1 = k2, k2++) {
          if (testSegments(polygon[i1], points[j], polygon[k1], polygon[k2]) || testSegments(polygon[i2], points[j], polygon[k1], polygon[k2])) {
            bad = true;
          }
          if (pointSegmentDistance(points[j], polygon[k1], polygon[k2]) <= dSq) {
            bad = true;
          }
        }
        for (var k = 0; k < polygon.length && !bad; k++) {
          if (k != i1 && pointSegmentDistance(polygon[k], polygon[i1], points[j]) <= dSq) {
            bad = true;
          }
          if (k != i2 && pointSegmentDistance(polygon[k], polygon[i2], points[j]) <= dSq) {
            bad = true;
          }
        }
        if (bad) {
          continue;
        }
        stop = false;
        polygon.splice(i1 + 1, 0, points[j]);
        break;
      }
    }
    if (stop) {
      break;
    }
  }
  return polygon;
}

// O(n^2)
function triangulatePolygon(polygon) {
  var n = polygon.length;
  var v = new Array(n);
  var l = new Array(n);
  var r = new Array(n);
  var t = new Array();
  for (var i = 0; i < n; i++) {
    v[i] = { x: polygon[i].x, y: polygon[i].y };
    l[i] = i == 0 ? n - 1 : i - 1;
    r[i] = i == n - 1 ? 0 : i + 1;
  }
  function isEar(i) {
    var i1 = l[i];
    var i2 = i;
    var i3 = r[i];
    if (!isConvex(v[i1], v[i2], v[i3])) {
      return false;
    }
    for (var j = r[i3]; j != i1; j = r[j]) {
      if (testPointTriangle(v[j], v[i1], v[i2], v[i3])) {
        return false;
      }
    }
    return true;
  }
  var e = new Set();
  for (var i = 0; i < n; i++) {
    if (isEar(i)) {
      e.add(i);
    }
  }
  function remove(i) {
    l[r[i]] = l[i];
    r[l[i]] = r[i];
  }
  function update(i) {
    if (isEar(i)) {
      e.add(i);
    }
    else {
      e.delete(i);
    }
  }
  while (e.size > 0) {
    var [i] = e;
    e.delete(i);
    remove(i);
    update(l[i]);
    update(r[i]);
    t.push([l[i], i, r[i]]);
  }
  return t;
}

// O(n^3)
function decomposePolygon(polygon) {
  var n = polygon.length;
  var v = new Array(n);
  for (var i = 0; i < n; i++) {
    v[i] = { x: polygon[i].x, y: polygon[i].y };
  }
  var w = new Array(n);
  var ai = n - 2;
  var bi = n - 1;
  for (var ci = 0; ci < n; ci++) {
    w[bi] = new Set();
    for (var di = 0; di < n; di++) {
      if (di == ai || di == bi || di == ci) {
        continue;
      }
      if (isConvex(v[bi], v[di], v[ci]) && isConvex(v[di], v[bi], v[ai])) {
        continue;
      }
      var b = true;
      var ei = n - 1;
      for (var fi = 0; fi < n; fi++) {
        if (testSegments(v[bi], v[di], v[ei], v[fi])) {
          b = false;
          break;
        }
        ei = fi;
      }
      if (b) {
        w[bi].add(di);
      }
    }
    ai = bi;
    bi = ci;
  }
  var dp = new Map();
  function decompose(u) {
    var key = u.join(',');
    if (dp.has(key)) {
      return dp.get(key);
    }
    var l = u.length;
    if (l > 3) {
      var ai = u[l - 2];
      var bi = u[l - 1];
      for (var i = 0; i < l; i++) {
        var ci = u[i];
        if (!isConvex(v[ai], v[bi], v[ci])) {
          var r = null;
          for (var j = 0; j < l; j++) {
            var di = u[j];
            if (di == ai || di == bi || di == ci) {
              continue;
            }
            if (w[bi].has(di)) {
              var s = (i + l - 1) % l;
              var u1 = [];
              var u2 = [];
              for (var k = s; k != j; k = (k + 1) % l) u1.push(u[k]);
              u1.push(u[j]);
              for (var k = j; k != s; k = (k + 1) % l) u2.push(u[k]);
              u2.push(u[s]);
              var q = decompose(u1).concat(decompose(u2));
              if (r == null || q.length < r.length) {
                r = q;
              }
            }
          }
          dp.set(key, r);
          return r;
        }
        ai = bi;
        bi = ci;
      }
    }
    return [u];
  }
  var a = new Array();
  for (var i = 0; i < n; i++) {
    a.push(i);
  }
  return decompose(a);
}
