/* eslint-disable */

export const toGeoJSON = (layer, precision = 8) => {
  return layer.toGeoJSON(precision);
};
/**
 * Leaflet vector features drag functionality
 * @author Alexander Milevski <info@w8r.name>
 * @preserve
 */
L.Path.include({
  _transform: function (t) {
    if (this._renderer) {
      if (t) {
        this._renderer.transformPath(this, t);
      } else {
        this._renderer._resetTransformPath(this);
        this._update();
      }
    }
    return this;
  },
  _onMouseClick: function (t) {
    if (
      (this.dragging && this.dragging.moved()) ||
      (this._map.dragging && this._map.dragging.moved())
    ) {
      return;
    }
    this._fireMouseEvent(t);
  },
});
var END = {
  mousedown: "mouseup",
  touchstart: "touchend",
  pointerdown: "touchend",
  MSPointerDown: "touchend",
};
var MOVE = {
  mousedown: "mousemove",
  touchstart: "touchmove",
  pointerdown: "touchmove",
  MSPointerDown: "touchmove",
};
function distance(t, i) {
  var a = t.x - i.x,
    n = t.y - i.y;
  return Math.sqrt(a * a + n * n);
}
L.Handler.PathDrag = L.Handler.extend({
  statics: { DRAGGING_CLS: "leaflet-path-draggable" },
  initialize: function (t) {
    this._path = t;
    this._matrix = null;
    this._startPoint = null;
    this._dragStartPoint = null;
    this._mapDraggingWasEnabled = false;
  },
  addHooks: function () {
    this._path.on("mousedown", this._onDragStart, this);
    this._path.options.className = this._path.options.className
      ? this._path.options.className + " " + L.Handler.PathDrag.DRAGGING_CLS
      : L.Handler.PathDrag.DRAGGING_CLS;
    if (this._path._path) {
      L.DomUtil.addClass(this._path._path, L.Handler.PathDrag.DRAGGING_CLS);
    }
  },
  removeHooks: function () {
    this._path.off("mousedown", this._onDragStart, this);
    L.DomEvent.off(document, "mousemove touchmove", this._onDrag, this);
    L.DomEvent.off(document, "mouseup touchend", this._onDragEnd, this);
    this._path.options.className = this._path.options.className.replace(
      new RegExp("\\s+" + L.Handler.PathDrag.DRAGGING_CLS),
      ""
    );
    if (this._path._path) {
      L.DomUtil.removeClass(this._path._path, L.Handler.PathDrag.DRAGGING_CLS);
    }
  },
  moved: function () {
    return this._path._dragMoved;
  },
  _onDragStart: function (t) {
    var i = t.originalEvent._simulated ? "touchstart" : t.originalEvent.type;
    this._mapDraggingWasEnabled = false;
    this._startPoint = t.containerPoint.clone();
    this._dragStartPoint = t.containerPoint.clone();
    this._matrix = [1, 0, 0, 1, 0, 0];
    L.DomEvent.stop(t.originalEvent);
    L.DomUtil.addClass(this._path._renderer._container, "leaflet-interactive");
    L.DomEvent.on(document, MOVE[i], this._onDrag, this).on(
      document,
      END[i],
      this._onDragEnd,
      this
    );
    if (this._path._map.dragging.enabled()) {
      this._path._map.dragging.disable();
      this._mapDraggingWasEnabled = true;
    }
    this._path._dragMoved = false;
    if (this._path._popup) {
      this._path._popup._close();
    }
    this._replaceCoordGetters(t);
  },
  _onDrag: function (t) {
    L.DomEvent.stop(t);
    var i = t.touches && t.touches.length >= 1 ? t.touches[0] : t;
    var a = this._path._map.mouseEventToContainerPoint?.(i);
    if (t.type === "touchmove" && !this._path._dragMoved) {
      var n = this._dragStartPoint.distanceTo(a);
      if (n <= this._path._map.options.tapTolerance) {
        return;
      }
    }
    var r = a.x;
    var e = a.y;
    var s = r - this._startPoint.x;
    var o = e - this._startPoint.y;
    if (s || o) {
      if (!this._path._dragMoved) {
        this._path._dragMoved = true;
        this._path.fire("dragstart", t);
        this._path.bringToFront();
      }
      this._matrix[4] += s;
      this._matrix[5] += o;
      this._startPoint.x = r;
      this._startPoint.y = e;
      this._path.fire("predrag", t);
      this._path._transform(this._matrix);
      this._path.fire("drag", t);
    }
  },
  _onDragEnd: function (t) {
    var i = this._path._map.mouseEventToContainerPoint?.(t);
    var a = this.moved();
    if (a) {
      this._transformPoints(this._matrix);
      this._path._updatePath();
      this._path._project();
      this._path._transform(null);
      L.DomEvent.stop(t);
    }
    L.DomEvent.off(document, "mousemove touchmove", this._onDrag, this);
    L.DomEvent.off(document, "mouseup touchend", this._onDragEnd, this);
    this._restoreCoordGetters();
    if (this._mapDraggingWasEnabled) {
      if (a) L.DomEvent.fakeStop({ type: "click" });
      this._path._map.dragging.enable();
    }
    if (a) {
      this._path.fire("dragend", {
        distance: distance(this._dragStartPoint, i),
      });
      var n = this._path._containsPoint;
      this._path._containsPoint = L.Util.falseFn;
      L.Util.requestAnimFrame(function () {
        L.DomEvent.skipped({ type: "click" });
        this._path._containsPoint = n;
      }, this);
    }
    this._matrix = null;
    this._startPoint = null;
    this._dragStartPoint = null;
    this._path._dragMoved = false;
  },
  _transformPoints: function (t, i) {
    var a = this._path;
    var n, r, e;
    var s = L.point(t[4], t[5]);
    var o = a._map.options.crs;
    var h = o.transformation;
    var _ = o.scale(a._map.getZoom());
    var l = o.projection;
    var d = h.untransform(s, _).subtract(h.untransform(L.point(0, 0), _));
    var p = !i;
    a._bounds = new L.LatLngBounds();
    if (a._point) {
      i = l.unproject(l.project(a._latlng)._add(d));
      if (p) {
        a._latlng = i;
        a._point._add(s);
      }
    } else if (a._rings || a._parts) {
      var f = a._rings || a._parts;
      var g = a._latlngs;
      i = i || g;
      if (!L.Util.isArray(g[0])) {
        g = [g];
        i = [i];
      }
      for (n = 0, r = f.length; n < r; n++) {
        i[n] = i[n] || [];
        for (var u = 0, c = f[n].length; u < c; u++) {
          e = g[n][u];
          i[n][u] = l.unproject(l.project(e)._add(d));
          if (p) {
            a._bounds.extend(g[n][u]);
            f[n][u]._add(s);
          }
        }
      }
    }
    return i;
  },
  _replaceCoordGetters: function () {
    if (this._path.getLatLng) {
      this._path.getLatLng_ = this._path.getLatLng;
      this._path.getLatLng = L.Util.bind(function () {
        return this.dragging._transformPoints(this.dragging._matrix, {});
      }, this._path);
    } else if (this._path.getLatLngs) {
      this._path.getLatLngs_ = this._path.getLatLngs;
      this._path.getLatLngs = L.Util.bind(function () {
        return this.dragging._transformPoints(this.dragging._matrix, []);
      }, this._path);
    }
  },
  _restoreCoordGetters: function () {
    if (this._path.getLatLng_) {
      this._path.getLatLng = this._path.getLatLng_;
      delete this._path.getLatLng_;
    } else if (this._path.getLatLngs_) {
      this._path.getLatLngs = this._path.getLatLngs_;
      delete this._path.getLatLngs_;
    }
  },
});
L.Handler.PathDrag.makeDraggable = function (t) {
  t.dragging = new L.Handler.PathDrag(t);
  return t;
};
L.Path.prototype.makeDraggable = function () {
  return L.Handler.PathDrag.makeDraggable(this);
};
L.Path.addInitHook(function () {
  if (this.options.draggable) {
    this.options.interactive = true;
    if (this.dragging) {
      this.dragging.enable();
    } else {
      L.Handler.PathDrag.makeDraggable(this);
      this.dragging.enable();
    }
  } else if (this.dragging) {
    this.dragging.disable();
  }
});
L.SVG.include({
  _resetTransformPath: function (t) {
    t._path.setAttributeNS(null, "transform", "");
  },
  transformPath: function (t, i) {
    t._path.setAttributeNS(null, "transform", "matrix(" + i.join(" ") + ")");
  },
});
L.SVG.include(
  !L.Browser.vml
    ? {}
    : {
        _resetTransformPath: function (t) {
          if (t._skew) {
            t._skew.on = false;
            t._path.removeChild(t._skew);
            t._skew = null;
          }
        },
        transformPath: function (t, i) {
          var a = t._skew;
          if (!a) {
            a = L.SVG.create("skew");
            t._path.appendChild(a);
            a.style.behavior = "url(#default#VML)";
            t._skew = a;
          }
          var n =
            i[0].toFixed(8) +
            " " +
            i[1].toFixed(8) +
            " " +
            i[2].toFixed(8) +
            " " +
            i[3].toFixed(8) +
            " 0 0";
          var r =
            Math.floor(i[4]).toFixed() + ", " + Math.floor(i[5]).toFixed() + "";
          var e = this._path.style;
          var s = parseFloat(e.left);
          var o = parseFloat(e.top);
          var h = parseFloat(e.width);
          var _ = parseFloat(e.height);
          if (isNaN(s)) s = 0;
          if (isNaN(o)) o = 0;
          if (isNaN(h) || !h) h = 1;
          if (isNaN(_) || !_) _ = 1;
          var l = (-s / h - 0.5).toFixed(8) + " " + (-o / _ - 0.5).toFixed(8);
          a.on = "f";
          a.matrix = n;
          a.origin = l;
          a.offset = r;
          a.on = true;
        },
      }
);
function TRUE_FN() {
  return true;
}
L.Canvas.include({
  _resetTransformPath: function (t) {
    if (!this._containerCopy) return;
    delete this._containerCopy;
    if (t._containsPoint_) {
      t._containsPoint = t._containsPoint_;
      delete t._containsPoint_;
      this._requestRedraw(t);
    }
  },
  transformPath: function (t, i) {
    var a = this._containerCopy;
    var n = this._ctx,
      r;
    var e = L.Browser.retina ? 2 : 1;
    var s = this._bounds;
    var o = s.getSize();
    var h = s.min;
    if (!a) {
      a = this._containerCopy = document.createElement("canvas");
      r = a.getContext("2d");
      a.width = e * o.x;
      a.height = e * o.y;
      this._removePath(t);
      this._redraw();
      r.translate(e * s.min.x, e * s.min.y);
      r.drawImage(this._container, 0, 0);
      this._initPath(t);
      t._containsPoint_ = t._containsPoint;
      t._containsPoint = TRUE_FN;
    }
    n.save();
    n.clearRect(h.x, h.y, o.x * e, o.y * e);
    n.setTransform(1, 0, 0, 1, 0, 0);
    n.restore();
    n.save();
    n.drawImage(this._containerCopy, 0, 0, o.x, o.y);
    n.transform.apply(n, i);
    this._drawing = true;
    t._updatePath();
    this._drawing = false;
    n.restore();
  },
});
/**
 * Drag/rotate/resize handler for [leaflet](http://leafletjs.com) vector features.
 *
 * @author Alexander Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */ L.PathTransform_ = {};
L.PathTransform_.pointOnLine = function (t, i, a) {
  var n = 1 + a / t.distanceTo(i);
  return new L.Point(t.x + (i.x - t.x) * n, t.y + (i.y - t.y) * n);
};
L.PathTransform_.merge = function () {
  var t = 1;
  var i, a;
  var n = arguments[t];
  function r(t) {
    return Object.prototype.toString.call(t) === "[object Object]";
  }
  var e = arguments[0];
  while (n) {
    n = arguments[t++];
    for (i in n) {
      if (!n.hasOwnProperty(i)) {
        continue;
      }
      a = n[i];
      if (r(a) && r(e[i])) {
        e[i] = L.Util.extend(e[i], a);
      } else {
        e[i] = a;
      }
    }
  }
  return e;
};
L.Matrix = function (t, i, a, n, r, e) {
  this._matrix = [t, i, a, n, r, e];
};
L.Matrix.prototype = {
  transform: function (t) {
    return this._transform(t.clone());
  },
  _transform: function (t) {
    var i = this._matrix;
    var a = t.x,
      n = t.y;
    t.x = i[0] * a + i[1] * n + i[4];
    t.y = i[2] * a + i[3] * n + i[5];
    return t;
  },
  untransform: function (t) {
    var i = this._matrix;
    return new L.Point((t.x / i[0] - i[4]) / i[0], (t.y / i[2] - i[5]) / i[2]);
  },
  clone: function () {
    var t = this._matrix;
    return new L.Matrix(t[0], t[1], t[2], t[3], t[4], t[5]);
  },
  translate: function (t) {
    if (t === undefined) {
      return new L.Point(this._matrix[4], this._matrix[5]);
    }
    var i, a;
    if (typeof t === "number") {
      i = a = t;
    } else {
      i = t.x;
      a = t.y;
    }
    return this._add(1, 0, 0, 1, i, a);
  },
  scale: function (t, i) {
    if (t === undefined) {
      return new L.Point(this._matrix[0], this._matrix[3]);
    }
    var a, n;
    i = i || L.point(0, 0);
    if (typeof t === "number") {
      a = n = t;
    } else {
      a = t.x;
      n = t.y;
    }
    return this._add(a, 0, 0, n, i.x, i.y)._add(1, 0, 0, 1, -i.x, -i.y);
  },
  rotate: function (t, i) {
    var a = Math.cos(t);
    var n = Math.sin(t);
    i = i || new L.Point(0, 0);
    return this._add(a, n, -n, a, i.x, i.y)._add(1, 0, 0, 1, -i.x, -i.y);
  },
  flip: function () {
    this._matrix[1] *= -1;
    this._matrix[2] *= -1;
    return this;
  },
  _add: function (t, i, a, n, r, e) {
    var s = [[], [], []];
    var o = this._matrix;
    var h = [
      [o[0], o[2], o[4]],
      [o[1], o[3], o[5]],
      [0, 0, 1],
    ];
    var _ = [
        [t, a, r],
        [i, n, e],
        [0, 0, 1],
      ],
      l;
    if (t && t instanceof L.Matrix) {
      o = t._matrix;
      _ = [
        [o[0], o[2], o[4]],
        [o[1], o[3], o[5]],
        [0, 0, 1],
      ];
    }
    for (var d = 0; d < 3; d++) {
      for (var p = 0; p < 3; p++) {
        l = 0;
        for (var f = 0; f < 3; f++) {
          l += h[d][f] * _[f][p];
        }
        s[d][p] = l;
      }
    }
    this._matrix = [s[0][0], s[1][0], s[0][1], s[1][1], s[0][2], s[1][2]];
    return this;
  },
};
L.matrix = function (t, i, a, n, r, e) {
  return new L.Matrix(t, i, a, n, r, e);
};
L.PathTransform_.Handle = L.CircleMarker.extend({
  options: { className: "leaflet-path-transform-handler" },
  onAdd: function (t) {
    L.CircleMarker.prototype.onAdd.call(this, t);
    if (this._path && this.options.setCursor) {
      this._path.style.cursor =
        L.PathTransform_.Handle.CursorsByType[this.options.index];
    }
  },
});
L.PathTransform_.Handle.CursorsByType = [
  "nesw-resize",
  "nwse-resize",
  "nesw-resize",
  "nwse-resize",
];
L.PathTransform_.RotateHandle = L.PathTransform_.Handle.extend({
  options: {
    className: "leaflet-path-transform-handler transform-handler--rotate",
  },
  onAdd: function (t) {
    L.CircleMarker.prototype.onAdd.call(this, t);
    if (this._path && this.options.setCursor) {
      // Hide corner hover because roate handler is added on context menu.
      // this._path.style.cursor =
      //   'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZlcnNpb249IjEuMSI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz4KCjxnIGNsYXNzPSJjdXJyZW50TGF5ZXIiIHN0eWxlPSIiPjx0aXRsZT5MYXllciAxPC90aXRsZT48ZyBpZD0ic3VyZmFjZTEiIGNsYXNzPSIiIGZpbGw9IiM0ODQ4NDgiIGZpbGwtb3BhY2l0eT0iMSI+CjxwYXRoIHN0eWxlPSJzdHJva2U6IG5vbmU7IGZpbGwtcnVsZTogbm9uemVybzsiIGQ9Ik0gMS4zMjgxMjUgOC4zMzU5MzggTCAzLjUxOTUzMSA4Ljg0Mzc1IEMgMy43MzQzNzUgNy45MzM1OTQgNC4xNzk2ODggNy4wNzgxMjUgNC44MDg1OTQgNi4zNzUgTCAzLjEzMjgxMiA0Ljg3NSBDIDIuMjUgNS44NTkzNzUgMS42Mjg5MDYgNy4wNTQ2ODggMS4zMjgxMjUgOC4zMzU5MzggWiBNIDEuMzI4MTI1IDguMzM1OTM4ICIgaWQ9InN2Z18xIiBmaWxsPSIjNDg0ODQ4IiBmaWxsLW9wYWNpdHk9IjEiLz4KPHBhdGggc3R5bGU9InN0cm9rZTogbm9uZTsgZmlsbC1ydWxlOiBub256ZXJvOyIgZD0iTSAxLjEyNSAxMS4yMzQzNzUgQyAxLjMzMjAzMSAxMi42OTE0MDYgMS45NDUzMTIgMTQuMDU0Njg4IDIuODk0NTMxIDE1LjE4MzU5NCBMIDQuNjI4OTA2IDEzLjczODI4MSBDIDMuOTQ5MjE5IDEyLjkzMzU5NCAzLjUxMTcxOSAxMS45NTcwMzEgMy4zNjMyODEgMTAuOTIxODc1IEMgMy4zNjMyODEgMTAuOTIxODc1IDEuMTI1IDExLjIzNDM3NSAxLjEyNSAxMS4yMzQzNzUgWiBNIDEuMTI1IDExLjIzNDM3NSAiIGlkPSJzdmdfMiIgZmlsbD0iIzQ4NDg0OCIgZmlsbC1vcGFjaXR5PSIxIi8+CjxwYXRoIHN0eWxlPSJzdHJva2U6IG5vbmU7IGZpbGwtcnVsZTogbm9uemVybzsiIGQ9Ik0gMTAuMTI1IDIuMzM5ODQ0IEwgMTAuMTI1IDAgTCA2Ljc1IDMuMzc1IEwgMTAuMTI1IDYuNzUgTCAxMC4xMjUgNC42MTMyODEgQyAxMi42ODc1IDUuMTM2NzE5IDE0LjYyNSA3LjQxMDE1NiAxNC42MjUgMTAuMTI1IEMgMTQuNjI1IDEzLjIyNjU2MiAxMi4xMDE1NjIgMTUuNzUgOSAxNS43NSBDIDguMDU0Njg4IDE1Ljc1IDcuMTIxMDk0IDE1LjUxMTcxOSA2LjMwMDc4MSAxNS4wNjI1IEwgNS4yMTg3NSAxNy4wMzUxNTYgQyA2LjM3MTA5NCAxNy42NjQwNjIgNy42Nzk2ODggMTggOSAxOCBDIDEzLjM0Mzc1IDE4IDE2Ljg3NSAxNC40NjQ4NDQgMTYuODc1IDEwLjEyNSBDIDE2Ljg3NSA2LjE2Nzk2OSAxMy45MzM1OTQgMi44ODY3MTkgMTAuMTI1IDIuMzM5ODQ0IFogTSAxMC4xMjUgMi4zMzk4NDQgIiBpZD0ic3ZnXzMiIGZpbGw9IiM0ODQ4NDgiIGZpbGwtb3BhY2l0eT0iMSIvPgo8L2c+PC9nPjwvc3ZnPg==") 9 9, auto';
    }
  },
});
L.Handler.PathTransform_ = L.Handler.extend({
  options: {
    rotation: true,
    scaling: true,
    uniformScaling: true,
    maxZoom: 22,
    handlerOptions: {
      radius: 5,
      fillColor: "#ffffff",
      color: "#202020",
      fillOpacity: 1,
      weight: 2,
      opacity: 0.7,
      setCursor: true,
    },
    boundsOptions: {
      weight: 1,
      opacity: 1,
      dashArray: [3, 3],
      fill: false,
      noClip: true,
    },
    rotateHandleOptions: { weight: 1, opacity: 1, setCursor: true },
    handleLength: 20,
    edgesCount: 4,
    handleClass: L.PathTransform_.Handle,
    rotateHandleClass: L.PathTransform_.RotateHandle,
  },
  initialize: function (t) {
    this._path = t;
    this._map = null;
    this._activeMarker = null;
    this._originMarker = null;
    this._rotationMarker = null;
    this._rotationOrigin = null;
    this._scaleOrigin = null;
    this._angle = 0;
    this._scale = L.point(1, 1);
    this._initialDist = 0;
    this._initialDistX = 0;
    this._initialDistY = 0;
    this._rotationStart = null;
    this._rotationOriginPt = null;
    this._matrix = new L.Matrix(1, 0, 0, 1, 0, 0);
    this._projectedMatrix = new L.Matrix(1, 0, 0, 1, 0, 0);
    this._handlersGroup = null;
    this._rect = null;
    this._handlers = [];
  },
  enable: function (t) {
    if (this._path._map) {
      this._map = this._path._map;
      if (!this._map.getPanes()[`path-transform-handlers`]) {
        const pane = `path-transform-handlers`;
        const p = this._map.createPane(pane);
        p.style.zIndex = 601;
      }
      if (t) {
        this.setOptions(t);
      }
      L.Handler.prototype.enable.call(this);
    }
  },
  addHooks: function () {
    this._createHandlers();
    this._path
      .on("dragstart", this._onDragStart, this)
      .on("dragend", this._onDragEnd, this);
  },
  removeHooks: function () {
    this._hideHandlers();
    this._path
      .off("dragstart", this._onDragStart, this)
      .off("dragend", this._onDragEnd, this);
    this._handlersGroup = null;
    this._rect = null;
    this._handlers = [];
  },
  setOptions: function (t) {
    var i = this._enabled;
    if (i) {
      this.disable();
    }
    this.options = L.PathTransform_.merge(
      {},
      L.Handler.PathTransform_.prototype.options,
      t
    );
    if (i) {
      this.enable();
    }
    return this;
  },
  rotate: function (t, i) {
    return this.transform(t, null, i);
  },
  scale: function (t, i) {
    if (typeof t === "number") {
      t = L.point(t, t);
    }
    return this.transform(0, t, null, i);
  },
  transform: function (t, i, a, n) {
    var r = this._path.getCenter();
    a = a || r;
    n = n || r;
    this._map = this._path._map;
    this._transformPoints(this._path, t, i, a, n);
    this._transformPoints(this._rect, t, i, a, n);
    this._updateHandlers();
    return this;
  },
  _update: function () {
    var t = this._matrix;
    for (var i = 0, a = this._handlers.length; i < a; i++) {
      var n = this._handlers[i];
      if (n !== this._originMarker) {
        n._point = t.transform(n._initialPoint);
        n._updatePath();
        if (n.fakeHandler) {
          n.fakeHandler.setLatLng(this._map.layerPointToLatLng(n._point));
        }
      }
    }
    t = t.clone().flip();
    this._applyTransform(t);
    this._path.fire("transform", { layer: this._path });
  },
  _applyTransform: function (t) {
    this._path._transform(t._matrix);
    this._rect._transform(t._matrix);
  },
  _apply: function () {
    var t = this._map;
    var i = this._matrix.clone();
    var a = this._angle;
    var n = this._scale.clone();
    this._transformGeometries();
    for (var r = 0, e = this._handlers.length; r < e; r++) {
      var s = this._handlers[r];
      s._latlng = t.layerPointToLatLng(s._point);
      delete s._initialPoint;
      s.redraw();
    }
    this._matrix = L.matrix(1, 0, 0, 1, 0, 0);
    this._scale = L.point(1, 1);
    this._angle = 0;
    this._updateHandlers();
    t.dragging.enable();
    this._path.fire("transformed", {
      matrix: i,
      scale: n,
      rotation: a,
      layer: this._path,
    });
  },
  reset: function () {
    if (this._enabled) {
      if (this._rect) {
        this._handlersGroup.removeLayer(this._rect);
        this._rect = this._getBoundingPolygon().addTo(this._handlersGroup);
      }
      this._updateHandlers();
    }
  },
  _updateHandlers: function () {
    var t = this._handlersGroup;
    this._rectShape = toGeoJSON(this._rect);
    if (this._rotationMarker) {
      this._handlersGroup.removeLayer(this._rotationMarker);
    }
    this._rotationMarker = null;
    for (var i = this._handlers.length - 1; i >= 0; i--) {
      t.removeLayer(this._handlers[i]);
      if (this._handlers[i].fakeHandler) {
        t.removeLayer(this._handlers[i].fakeHandler);
      }
    }

    this._handlers = [];

    this._createHandlers();
  },
  _transformGeometries: function () {
    this._path._transform(null);
    this._rect._transform(null);
    this._transformPoints(this._path);
    this._transformPoints(this._rect);
  },
  _getProjectedMatrix: function (t, i, a, n) {
    var r = this._map;
    var e = r.getMaxZoom() || this.options.maxZoom;
    var s = L.matrix(1, 0, 0, 1, 0, 0);
    var o;
    t = t || this._angle || 0;
    i = i || this._scale || L.point(1, 1);
    if (!(i.x === 1 && i.y === 1)) {
      n = n || this._scaleOrigin;
      o = r.project(n, e);
      s = s
        ._add(L.matrix(1, 0, 0, 1, o.x, o.y))
        ._add(L.matrix(i.x, 0, 0, i.y, 0, 0))
        ._add(L.matrix(1, 0, 0, 1, -o.x, -o.y));
    }
    if (t) {
      a = a || this._rotationOrigin;
      o = r.project(a, e);
      s = s.rotate(t, o).flip();
    }
    return s;
  },
  _transformPoint: function (t, i, a, n) {
    return a.unproject(i.transform(a.project(t, n)), n);
  },
  _transformPoints: function (t, i, a, n, r) {
    var e = t._map;
    var s = e.getMaxZoom() || this.options.maxZoom;
    var o, h;
    var _ = (this._projectedMatrix = this._getProjectedMatrix(i, a, n, r));
    if (t._point) {
      t._latlng = this._transformPoint(t._latlng, _, e, s);
    } else if (t._rings || t._parts) {
      var l = t._rings;
      var d = t._latlngs;
      t._bounds = new L.LatLngBounds();
      if (!L.Util.isArray(d[0])) {
        d = [d];
      }
      for (o = 0, h = l.length; o < h; o++) {
        for (var p = 0, f = l[o].length; p < f; p++) {
          d[o][p] = this._transformPoint(d[o][p], _, e, s);
          t._bounds.extend(d[o][p]);
        }
      }
    }
    t._reset();
  },
  _createHandlers: function () {
    var t = this._map;
    this._handlersGroup = this._handlersGroup || new L.LayerGroup().addTo(t);
    this._rect =
      this._rect || this._getBoundingPolygon().addTo(this._handlersGroup);
    if (this.options.scaling) {
      this._handlers = [];
      for (var i = 0; i < this.options.edgesCount; i++) {
        this._handlers.push(
          this._createHandler(this._rect._latlngs[0][i], i * 2, i).addTo(
            this._handlersGroup
          )
        );
      }
    }
    if (this.options.rotation) {
      this._createRotationHandlers();
    }
  },
  _createRotationHandlers: function () {
    var t = this._map;
    var i = this._rect._latlngs[0];

    if (i && i.length >= 4) {
      var a = new L.LatLng(
        (i[0].lat + i[3].lat) / 2,
        (i[0].lng + i[3].lng) / 2
      );
      var n = new L.LatLng(
        (i[1].lat + i[2].lat) / 2,
        (i[1].lng + i[2].lng) / 2
      );

      var e = this.options.rotateHandleClass;
      const handlerLatlngs =
        this._path._latlngs?.length && L.Util.isArray(this._path._latlngs[0])
          ? this._path._latlngs[0]
          : this._path._latlngs;
      this._rotationOrigin = new L.LatLng(
        (n.lat + a.lat) / 2,
        (n.lng + a.lng) / 2
      );
      handlerLatlngs.forEach((item, i) => {
        this._rotationMarker = new e(item, this.options.handlerOptions)
          .addTo(this._handlersGroup)
          .on("mousedown", this._onRotateStart, this)
          .on("touchstart", this._onRotateStart, this);

        this._handlers.push(this._rotationMarker);
      });
    }

    const popDesignPosition = t.pm.getGlobalOptions().popDesignPosition;
    if (this._rotationPopMarker) {
      this._rotationPopMarker.remove();
    }
    if (this._rotationPopMarkerFake) {
      this._rotationPopMarkerFake.remove();
    }
    if (popDesignPosition) {
      const point = t.latLngToContainerPoint(popDesignPosition);
      const x = point.x + 150 * Math.cos((90 * Math.PI) / 180);
      const y = point.y + 150 * Math.sin((90 * Math.PI) / 180);
      const latlng = t.containerPointToLatLng(new L.Point(x, y));
      this._rotationPopMarker = new e(latlng, {
        ...this.options.rotateHandleOptions,
        color: "#4ec38e",
        fillOpacity: 0,
        radius: 20,
        pane: "path-transform-handlers",
      })
        .addTo(this._handlersGroup)
        .on("mousedown", this._onRotateStart, this);

      this._rotationPopMarkerFake = new L.marker(latlng, {
        pane: "path-transform-handlers",
        icon: L.divIcon({
          className: "rotate-marker-icon",
          html: '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZlcnNpb249IjEuMSI+PHJlY3QgaWQ9ImJhY2tncm91bmRyZWN0IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4PSIwIiB5PSIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz4KCjxnIGNsYXNzPSJjdXJyZW50TGF5ZXIiIHN0eWxlPSIiPjx0aXRsZT5MYXllciAxPC90aXRsZT48ZyBpZD0ic3VyZmFjZTEiIGNsYXNzPSIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMSI+CjxwYXRoIHN0eWxlPSJzdHJva2U6IG5vbmU7IGZpbGwtcnVsZTogbm9uemVybzsiIGQ9Ik0gMS4zMjgxMjUgOC4zMzU5MzggTCAzLjUxOTUzMSA4Ljg0Mzc1IEMgMy43MzQzNzUgNy45MzM1OTQgNC4xNzk2ODggNy4wNzgxMjUgNC44MDg1OTQgNi4zNzUgTCAzLjEzMjgxMiA0Ljg3NSBDIDIuMjUgNS44NTkzNzUgMS42Mjg5MDYgNy4wNTQ2ODggMS4zMjgxMjUgOC4zMzU5MzggWiBNIDEuMzI4MTI1IDguMzM1OTM4ICIgaWQ9InN2Z18xIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjEiLz4KPHBhdGggc3R5bGU9InN0cm9rZTogbm9uZTsgZmlsbC1ydWxlOiBub256ZXJvOyIgZD0iTSAxLjEyNSAxMS4yMzQzNzUgQyAxLjMzMjAzMSAxMi42OTE0MDYgMS45NDUzMTIgMTQuMDU0Njg4IDIuODk0NTMxIDE1LjE4MzU5NCBMIDQuNjI4OTA2IDEzLjczODI4MSBDIDMuOTQ5MjE5IDEyLjkzMzU5NCAzLjUxMTcxOSAxMS45NTcwMzEgMy4zNjMyODEgMTAuOTIxODc1IEMgMy4zNjMyODEgMTAuOTIxODc1IDEuMTI1IDExLjIzNDM3NSAxLjEyNSAxMS4yMzQzNzUgWiBNIDEuMTI1IDExLjIzNDM3NSAiIGlkPSJzdmdfMiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIxIi8+CjxwYXRoIHN0eWxlPSJzdHJva2U6IG5vbmU7IGZpbGwtcnVsZTogbm9uemVybzsiIGQ9Ik0gMTAuMTI1IDIuMzM5ODQ0IEwgMTAuMTI1IDAgTCA2Ljc1IDMuMzc1IEwgMTAuMTI1IDYuNzUgTCAxMC4xMjUgNC42MTMyODEgQyAxMi42ODc1IDUuMTM2NzE5IDE0LjYyNSA3LjQxMDE1NiAxNC42MjUgMTAuMTI1IEMgMTQuNjI1IDEzLjIyNjU2MiAxMi4xMDE1NjIgMTUuNzUgOSAxNS43NSBDIDguMDU0Njg4IDE1Ljc1IDcuMTIxMDk0IDE1LjUxMTcxOSA2LjMwMDc4MSAxNS4wNjI1IEwgNS4yMTg3NSAxNy4wMzUxNTYgQyA2LjM3MTA5NCAxNy42NjQwNjIgNy42Nzk2ODggMTggOSAxOCBDIDEzLjM0Mzc1IDE4IDE2Ljg3NSAxNC40NjQ4NDQgMTYuODc1IDEwLjEyNSBDIDE2Ljg3NSA2LjE2Nzk2OSAxMy45MzM1OTQgMi44ODY3MTkgMTAuMTI1IDIuMzM5ODQ0IFogTSAxMC4xMjUgMi4zMzk4NDQgIiBpZD0ic3ZnXzMiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMSIvPgo8L2c+PC9nPjwvc3ZnPg=="/>',
        }),
      }).addTo(this._handlersGroup);

      this._rotationPopMarker.fakeHandler = this._rotationPopMarkerFake;

      this._handlers.push(this._rotationPopMarker);
    }
  },
  _getRotationOrigin: function () {
    var t = this._rect._latlngs[0];
    var i = t[0];
    var a = t[2];
    return new L.LatLng((i.lat + a.lat) / 2, (i.lng + a.lng) / 2);
  },
  _onRotateStart: function (t) {
    var i = this._map;
    i.dragging.disable();
    this._originMarker = null;
    this._rotationOriginPt = i.latLngToLayerPoint(this._getRotationOrigin());
    this._rotationStart = t.layerPoint;
    this._initialMatrix = this._matrix.clone();
    this._angle = 0;
    this._path._map
      .on("mousemove", this._onRotate, this)
      .on("mouseup", this._onRotateEnd, this);
    this._cachePoints();
    this._path
      .fire("transformstart", { layer: this._path })
      .fire("rotatestart", { layer: this._path, rotation: 0 });
  },
  _onRotate: function (t) {
    var i = t.layerPoint;
    var a = this._rotationStart;
    var n = this._rotationOriginPt;
    this._angle =
      Math.atan2(i.y - n.y, i.x - n.x) - Math.atan2(a.y - n.y, a.x - n.x);
    this._matrix = this._initialMatrix.clone().rotate(this._angle, n).flip();
    this._update();
    this._path.fire("rotate", { layer: this._path, rotation: this._angle });
  },
  _onRotateEnd: function (t) {
    this._path._map
      .off("mousemove", this._onRotate, this)
      .off("mouseup", this._onRotateEnd, this);
    var i = this._angle;
    this._apply();
    this._path.fire("rotateend", { layer: this._path, rotation: i });
  },
  _onScaleStart: function (t) {
    var i = t.target;
    var a = this._map;
    a.dragging.disable();
    this._activeMarker = i;
    this._originMarker = this._handlers[(i.options.index + 2) % 4];
    this._scaleOrigin = this._originMarker.getLatLng();
    this._initialMatrix = this._matrix.clone();
    this._cachePoints();
    this._map
      .on("mousemove", this._onScale, this)
      .on("mouseup", this._onScaleEnd, this);
    this._initialDist = this._originMarker._point.distanceTo(
      this._activeMarker._point
    );
    this._initialDistX =
      this._originMarker._point.x - this._activeMarker._point.x;
    this._initialDistY =
      this._originMarker._point.y - this._activeMarker._point.y;
    this._path
      .fire("transformstart", { layer: this._path })
      .fire("scalestart", { layer: this._path, scale: L.point(1, 1) });
    this._map.removeLayer(this._rotationMarker);
  },
  _onScale: function (t) {
    var i = this._originMarker._point;
    var a, n;
    if (this.options.uniformScaling) {
      a = i.distanceTo(t.layerPoint) / this._initialDist;
      n = a;
    } else {
      a = (i.x - t.layerPoint.x) / this._initialDistX;
      n = (i.y - t.layerPoint.y) / this._initialDistY;
    }
    this._scale = new L.Point(a, n);
    this._matrix = this._initialMatrix.clone().scale(this._scale, i);
    this._update();
    this._path.fire("scale", { layer: this._path, scale: this._scale.clone() });
  },
  _onScaleEnd: function (t) {
    this._map
      .off("mousemove", this._onScale, this)
      .off("mouseup", this._onScaleEnd, this);
    this._map.addLayer(this._rotationMarker);
    this._apply();
    this._path.fire("scaleend", {
      layer: this._path,
      scale: this._scale.clone(),
    });
  },
  _cachePoints: function () {
    this._handlersGroup.eachLayer(function (t) {
      t.bringToFront && t.bringToFront();
    });
    for (var t = 0, i = this._handlers.length; t < i; t++) {
      var a = this._handlers[t];
      a._initialPoint = a._point.clone();
    }
  },
  _getBoundingPolygon: function () {
    if (this._rect) {
      return L.GeoJSON.geometryToLayer(
        toGeoJSON(this._rect),
        this.options.boundsOptions
      );
    } else {
      return new L.Rectangle(
        this._path.getBounds(),
        this.options.boundsOptions
      );
    }
  },
  _createHandler: function (t, i, a) {
    var n = this.options.handleClass;
    var r = new n(
      t,
      L.Util.extend({}, this.options.handlerOptions, {
        className:
          "leaflet-drag-transform-marker drag-marker--" +
          a +
          " drag-marker--" +
          i,
        index: a,
        type: i,
      })
    );
    r.on("mousedown", this._onScaleStart, this);
    return r;
  },
  _hideHandlers: function () {
    this._map.removeLayer(this._handlersGroup);
  },
  _onDragStart: function () {
    this._hideHandlers();
  },
  _onDragEnd: function (t) {
    var i = this._rect;
    var a = (t.layer ? t.layer : this._path).dragging._matrix.slice();
    if (!i.dragging) {
      i.dragging = new L.Handler.PathDrag(i);
    }
    i.dragging.enable();
    this._map.addLayer(i);
    i.dragging._transformPoints(a);
    i._updatePath();
    i._project();
    i.dragging.disable();
    this._map.addLayer(this._handlersGroup);
    this._updateHandlers();
    this._path.fire("transformed", {
      scale: L.point(1, 1),
      rotation: 0,
      matrix: L.matrix.apply(undefined, a),
      translate: L.point(a[4], a[5]),
      layer: this._path,
    });
  },
});
L.Path.addInitHook(function () {
  if (this.options.transform_) {
    this.transform_ = new L.Handler.PathTransform_(
      this,
      this.options.transform
    );
  }
});
