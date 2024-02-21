import "./L.Path.Transform";
import { useEffect } from "react";

const geoJSONFromParams = (params) => params.target.toGeoJSON();

const dxdyFromParams = (params) => {
  const matrix = params.target.dragging._matrix;
  const dx = matrix[4];
  const dy = matrix[5];
  return { dx, dy };
};

const getTranslatedGeoJSONFromParams = (params) => {
  const geoJSON = geoJSONFromParams(params);
  //TODO implement this functions
  return geoJSON;
};

const Draggable = ({ layer, onChange, onChangeEnd, onChangeStart }) => {
  useEffect(() => {
    if (!layer) {
      return () => {};
    }
    layer.dragging.enable();
    // layer._path.style.cursor = "move";
    return () => {
      // layer._path.style.cursor = "inherit";
      layer.dragging.disable();
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
      onChange(getTranslatedGeoJSONFromParams(params), dxdyFromParams(params));
    };
    layer.on("dragstart", handleChangeStart);
    layer.on("drag", handleChange);
    layer.on("dragend", handleDragEnd);

    return () => {
      layer.off("dragstart", handleChangeStart);
      layer.off("drag", handleChange);
      layer.off("dragend", handleDragEnd);
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
