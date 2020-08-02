import React, { useState, useCallback, useEffect } from "react";
import InteractiveGeoJSON from "./InteractiveGeoJSON";

const UpdateLockedInteractiveGeoJSON = ({ onChangeEnd, ...restProps }) => {
  const [restPropsLocal, setRestPropsLocal] = useState(restProps);
  const [changeEndGeoJSON, setChangeEndGeoJSON] = useState(null);
  useEffect(() => {
    if (changeEndGeoJSON) {
      onChangeEnd(changeEndGeoJSON);
    }
  }, [changeEndGeoJSON, onChangeEnd]);

  const handleChangeEnd = useCallback(
    (geoJSON) => {
      setRestPropsLocal({ ...restPropsLocal, geoJSON });
      setChangeEndGeoJSON(geoJSON);
    },
    [restPropsLocal]
  );

  return (
    <InteractiveGeoJSON {...restPropsLocal} onChangeEnd={handleChangeEnd} />
  );
};

export default UpdateLockedInteractiveGeoJSON;
