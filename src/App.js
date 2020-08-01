import React, { useState, useEffect, useCallback } from 'react'
import { Map, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import './App.css'
import InteractiveGeoJSON from './InteractiveGeoJSON'
import Editable from './Editable';
const geoJSONInit = {
  "type": "Feature",
  "properties": {"party": "Republican"},
  "geometry": {
      "type": "Polygon",
      "coordinates": [[
          [-104.05, 48.99],
          [-97.22,  48.98],
          [-96.58,  45.94],
          [-104.03, 45.94],
          [-104.05, 48.99]
      ]]
  }
}
export default () => {
  const [lng] = useState(-104.05)
  const [lat]= useState(48.99)
  const [zoom]= useState(5)
  const [editable, setEditable] = useState(true)
  const [geoJSON, setGeoJSON] = useState(geoJSONInit) 
  useEffect(() => {
    // setInterval(() => {
    //   setEditable(e => !e)
    // }, 10000)
  }, [])

  const handleGeoJSONChangeEnd = useCallback((geoJSON) => {
    setGeoJSON(geoJSON)
  }, [])


  const position = [lat, lng]
    return (
        <Map center={position} zoom={zoom}>
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InteractiveGeoJSON geoJSON={geoJSON} onChangeEnd={handleGeoJSONChangeEnd}>
            {editable && <Editable />}
          </InteractiveGeoJSON>
        </Map>
    )
}