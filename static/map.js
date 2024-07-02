async function initMap() {
    // Request needed libraries
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement, InfoWindow } = await google.maps.importLibrary("marker");

    // Initialize the map
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.790667, lng: -74.129868 },
        zoom: 8,
        mapId: "4504f8b37365c3d0",
    });

    // Fetch locations data from an API
    const response = await fetch('static/locations.json');
    const locations = await response.json();
    const locations_list = [];
    let currentInfoWindow = null; // Stores the currently opened infoWindow


    // Add markers to the map
    for (const key in locations) {
        if (locations.hasOwnProperty(key)) {
            locations_list.push({ lat: locations[key].Latitude, lng: locations[key].Longitude })
            // Change the background & border color.
            const pinContent= new PinElement({
                background: "#465952",
                borderColor: "#0D0D0D",
                glyphColor: "#0D0D0D",
            });
            const marker = new AdvancedMarkerElement({
                map,
                position: { lat: locations[key].Latitude, lng: locations[key].Longitude },
                content: pinContent.element
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `<b>${locations[key].Address}</b>
                          <p>Mean PreOp SNOT: ${locations[key]["Preop SNOT"]}</p>
                          <p>Aspirin Dosage 2 Month: ${locations[key]["Aspirin Dosage 2 Month"]}</p>
                          <p>Aspirin Dosage 4 Month: ${locations[key]["Aspirin Dosage 4 Month"]}</p>
                          <p>Aspirin Dosage 7 Month: ${locations[key]["Aspirin Dosage 7 Month"]}</p>
                          <p>Aspirin Dosage 13 Month: ${locations[key]["Aspirin Dosage 13 Month"]}</p>
                          <p>Aspirin Dosage 25 Month: ${locations[key]["Aspirin Dosage 25 Month"]}</p>`
            });

            marker.addListener('click', () => {
              if (currentInfoWindow) {
                currentInfoWindow.close(); // Close any previously opened infoWindow
              }
              infoWindow.open(map, marker);
              currentInfoWindow = infoWindow; // Update currentInfoWindow reference
            });
        }
    };

    // Add a click listener for the entire map
    map.addListener('click', () => {
      if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null; // Reset currentInfoWindow on map click
      }
    });

    getAirQuality(map, locations_list)

}

async function getAirQuality(map, locations) {
  const apiKey = 'AIzaSyD3s-iRsAWSHGOYcqB1LI0PQQifRHKeKE0';
  const loadingIndicator = document.getElementById('loading-indicator');

  try {
    showLoadingIndicator(loadingIndicator);
    const heatmapData = await fetchLocationsData(locations, apiKey);
    hideLoadingIndicator(loadingIndicator);

    if (heatmapData.length > 0) {
      createHeatmap(map, heatmapData);
    } else {
      console.log("No air quality data retrieved for any locations.");
    }
  } catch (error) {
    console.error(error);
    // Handle errors (e.g., display an error message to the user)
  }
}


async function fetchLocationsData(locations, apiKey) {
  const promises = locations.map(async location => {
    const apiLocation = {
      location: {
        latitude: location.lat,
        longitude: location.lng
      }
    };

    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiLocation)
    };

    const response = await fetch(url, options);
    const data = await response.json();

    const aqi = data.indexes[0].aqi;
    return { location: new google.maps.LatLng(location.lat, location.lng), weight: aqi };
  });

  return await Promise.all(promises);
}

function createHeatmap(map, heatmapData) {
  const gradient = [
    'rgba(0, 255, 0, 0)', // Green for good AQI
    'rgba(255, 255, 0, 1)', // Yellow for moderate AQI
    'rgba(255, 165, 0, 1)', // Orange for unhealthy for sensitive groups
    'rgba(255, 0, 0, 1)', // Red for unhealthy
    'rgba(128, 0, 128, 1)' // Purple for very unhealthy
  ];

  const heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: map,
    dissipating: false,
    radius: 15,
    opacity: 0.7,
    gradient: gradient
  });
}

function updateInfoWindowContent(marker, content) {
  // Check if InfoWindow exists for the marker
  if (!marker.infoWindow) {
    marker.infoWindow = new google.maps.InfoWindow({
      content: content
    });
  } else {
    // Update content if InfoWindow already exists
    marker.infoWindow.setContent(content);
  }

  // Open the InfoWindow when the marker is clicked
  marker.addListener('click', function() {
    marker.infoWindow.open(map, marker);
  });
}

// Loop through markers and set InfoWindow content
for (let i = 0; i < markers.length; i++) {
  updateInfoWindowContent(markers[i], markerContent[i]);
}



// Show the Loading Indicator on Screen
function showLoadingIndicator(indicator) {
  indicator.style.display = 'block';
}

// Hide the Loading Indicator on Screen
function hideLoadingIndicator(indicator) {
  indicator.style.display = 'none';
}






