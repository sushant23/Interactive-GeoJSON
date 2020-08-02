import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { useEffect } from "react";

const Editable = ({ layer, changing, onChangeEnd }) => {
  useEffect(() => {
    if (!changing) {
      layer.pm.enable({
        allowSelfIntersection: true,
        snappable: false,
      });
    }

    return () => {
      layer.pm.disable();
    };
  }, [layer, changing]);

  useEffect(() => {
    layer.on("pm:markerdragend", (ev) => {
      onChangeEnd(ev.target.toGeoJSON().features[0]);
    });

    layer.on("pm:vertexremoved", (ev) => {
      onChangeEnd(ev.target.toGeoJSON().features[0]);
    });
  }, [layer, onChangeEnd]);

  return null;
};

export default Editable;
