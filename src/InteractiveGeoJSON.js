import { Children, cloneElement, useEffect, useState } from 'react'
import L from 'leaflet'
import { useLeaflet } from 'react-leaflet'

const InteractiveGeoJSON = ({onChangeStart, onChange, onChangeEnd, geoJSON, children}) => {
    const {map} = useLeaflet()
    const [layer, setLayer] = useState(null)
    useEffect(() => {
        const l = L.geoJSON(geoJSON).addTo(map)
        setLayer(l)
        return () => {
            map.removeLayer(l)
        }
    }, [geoJSON, map])
    return layer ? Children.map(
        children, 
        child => child && cloneElement(
            child, 
            { layer, onChange, onChangeStart, onChangeEnd }
        ),
    ) || [] : null;
}

export default InteractiveGeoJSON