import React, { useState, useCallback, useRef } from "react";
import { Map, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import Editable from "./Editable";
import Draggable from "./Draggable";
import UpdateLockedInteractiveGeoJSON from "./UpdateLockedInteractiveGeoJSON";
const geoJSONInit = {
  type: "Feature",
  properties: { party: "Republican" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-104.05, 48.99],
        [-97.22, 48.98],
        [-96.58, 45.94],
        [-104.03, 45.94],
        [-104.05, 48.99],
      ],
    ],
  },
};

export default () => {
  const [lng] = useState(-104.05);
  const [lat] = useState(48.99);
  const [zoom] = useState(5);
  const [geoJSON, setGeoJSON] = useState(geoJSONInit);
  const mapRef = useRef();

  const handleChangeEnd = useCallback((geoJSON) => {
    console.log("change end", geoJSON);
  }, []);

  const handleChangeStart = useCallback((geoJSON) => {
    console.log("change start", geoJSON);
  }, []);

  const handleChange = useCallback((geoJSON) => {
    setGeoJSON(geoJSON);
    console.log("change", JSON.stringify(geoJSON));
  }, []);

  const position = [lat, lng];
  return (
    <Map center={position} zoom={zoom} ref={mapRef}>
      <TileLayer
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <UpdateLockedInteractiveGeoJSON
        geoJSON={geoJSON}
        onChangeStart={handleChangeStart}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
      >
        <Editable />
        <Draggable />
      </UpdateLockedInteractiveGeoJSON>
    </Map>
  );
};
