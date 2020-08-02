import {
  Children,
  cloneElement,
  useEffect,
  useState,
  useCallback,
} from "react";
import L from "leaflet";
import { useLeaflet } from "react-leaflet";

const InteractiveGeoJSON = ({
  onChangeStart,
  onChange,
  onChangeEnd,
  geoJSON,
  children,
  style,
}) => {
  const { map } = useLeaflet();
  const [layer, setLayer] = useState(null);
  const [changeStartGeoJSON, setChangeStartGeoJSON] = useState(null);

  useEffect(() => {
    if (changeStartGeoJSON) {
      onChangeStart(changeStartGeoJSON);
    }
  }, [changeStartGeoJSON, onChangeStart]);

  const handleChangeStart = useCallback((geoJSON) => {
    setChangeStartGeoJSON(geoJSON);
  }, []);

  const handleChangeEnd = useCallback(
    (geoJSON) => {
      setChangeStartGeoJSON(null);
      onChangeEnd(geoJSON);
    },
    [onChangeEnd]
  );
  useEffect(() => {
    const l = L.geoJSON(geoJSON).addTo(map);
    setLayer(l);
    return () => {
      map.removeLayer(l);
    };
  }, [geoJSON, map]);

  useEffect(() => {
    if (!layer) return;
    layer.setStyle(style);
  }, [layer, style]);

  return layer
    ? Children.map(
        children,
        (child) =>
          child &&
          cloneElement(child, {
            layer,
            onChange,
            onChangeStart: handleChangeStart,
            onChangeEnd: handleChangeEnd,
            changing: !!changeStartGeoJSON,
          })
      ) || []
    : null;
};

export default InteractiveGeoJSON;
