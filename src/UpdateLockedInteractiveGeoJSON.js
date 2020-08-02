import React, { useState, useCallback, useEffect } from "react";
import InteractiveGeoJSON from "./InteractiveGeoJSON";

const UpdateLockedInteractiveGeoJSON = ({
  onChangeStart,
  onChangeEnd,
  geoJSON,
  ...rest
}) => {
  const [geoJSONLocal, setGeoJSONLocal] = useState(null);
  const [changeEndGeoJSON, setChangeEndGeoJSON] = useState(null);
  const [changeStartGeoJSON, setChangeStartGeoJSON] = useState(null);

  useEffect(() => {
    if (!changeStartGeoJSON) {
      setGeoJSONLocal(geoJSON);
    }
  }, [changeStartGeoJSON, geoJSON]);

  useEffect(() => {
    if (changeEndGeoJSON) {
      onChangeEnd(changeEndGeoJSON);
      setChangeStartGeoJSON(null);
      setChangeEndGeoJSON(null);
    }
  }, [changeEndGeoJSON, onChangeEnd]);

  useEffect(() => {
    if (changeStartGeoJSON) {
      onChangeStart(changeStartGeoJSON);
    }
  }, [changeStartGeoJSON, onChangeStart]);

  const handleChangeEnd = useCallback((geoJSON) => {
    setGeoJSONLocal(geoJSON);
    setChangeEndGeoJSON(geoJSON);
  }, []);

  const handleChangeStart = useCallback((geoJSON) => {
    setChangeStartGeoJSON(geoJSON);
  }, []);

  return (
    <InteractiveGeoJSON
      {...rest}
      geoJSON={geoJSONLocal}
      onChangeEnd={handleChangeEnd}
      onChangeStart={handleChangeStart}
    />
  );
};

export default UpdateLockedInteractiveGeoJSON;
