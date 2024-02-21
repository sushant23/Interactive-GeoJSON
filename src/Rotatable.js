import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { useEffect } from "react";

const Rotatable = ({ layer, onChange, onChangeStart, onChangeEnd }) => {
  useEffect(() => {
    layer.getLayers().forEach((l) => {
      l.pm.enableRotate();
    });
    return () => {
      layer.getLayers().forEach((l) => {
        l.pm.disableRotate();
      });
    };
  }, [layer]);

  useEffect(() => {
    layer.on("pm:rotate", (ev) => {
      onChange(ev.target.toGeoJSON().features[0]);
    });
    layer.on("pm:rotatestart", (ev) => {
      onChangeStart(ev.target.toGeoJSON().features[0]);
    });
    layer.on("pm:rotateend", (ev) => {
      onChangeEnd(ev.target.toGeoJSON().features[0]);
    });
  }, [layer, onChange, onChangeEnd, onChangeStart]);

  return null;
};

export default Rotatable;
