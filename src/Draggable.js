import "./L.Path.Transform";
import { useEffect } from "react";

const geoJSONFromParams = (params) => params.target.toGeoJSON();

const Draggable = ({ layer, onChange, onChangeEnd, onChangeStart }) => {
  useEffect(() => {
    layer.getLayers().forEach((l) => {
      l.makeDraggable();
      l.dragging.enable();
    });

    return () => {
      layer.getLayers().forEach((l) => l.dragging.disable());
    };
  }, [layer]);

  useEffect(() => {
    const handleDragEnd = (params) => {
      setTimeout(() => onChangeEnd(geoJSONFromParams(params)));
    };
    const handleChangeStart = (params) => {
      onChangeStart(geoJSONFromParams(params));
    };

    const handleChange = (params) => {
      onChange(geoJSONFromParams(params));
    };
    layer.eachLayer((_layer) => {
      _layer.on("dragstart", handleChangeStart);
      _layer.on("drag", handleChange);
      _layer.on("dragend", handleDragEnd);
    });

    return () => {
      layer.eachLayer((_layer) => {
        _layer.off("dragstart", handleChangeStart);
        _layer.off("drag", handleChange);
        _layer.off("dragend", handleDragEnd);
      });
    };
  }, [layer, onChange, onChangeEnd, onChangeStart]);

  return null;
};

Draggable.defaultProps = {
  onChange: () => {},
  onChangeStart: () => {},
  onChangeEnd: () => {},
};

export default Draggable;
