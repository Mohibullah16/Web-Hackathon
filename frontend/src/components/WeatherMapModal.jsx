import { useState, useEffect, useRef } from 'react';
import { Modal, Paper, Text, Group, Badge, Grid, LoadingOverlay, Card, SegmentedControl, ActionIcon } from '@mantine/core';
import { IconThermometer, IconDroplet, IconWind, IconCloudRain, IconCloud, IconUmbrella, IconZoomIn, IconZoomOut, IconFocus } from '@tabler/icons-react';
import axios from '../api/axios';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';

// OpenWeatherMap API Key
const OPENWEATHER_API_KEY = '376d235fabe6a35847d4689579d7d1c9';

// Weather layer options
const WEATHER_LAYERS = [
  { value: 'TA2', label: 'Temperature', icon: IconThermometer, color: '#ff6b6b' },
  { value: 'PA0', label: 'Precipitation', icon: IconUmbrella, color: '#339af0' },
  { value: 'CL', label: 'Clouds', icon: IconCloud, color: '#868e96' },
  { value: 'WND', label: 'Wind', icon: IconWind, color: '#20c997' },
];

// Key cities
const pakistanCities = [
  { name: 'Karachi', region: 'Sindh' },
  { name: 'Lahore', region: 'Punjab' },
  { name: 'Islamabad', region: 'Capital' },
  { name: 'Multan', region: 'Punjab' },
  { name: 'Quetta', region: 'Balochistan' },
  { name: 'Peshawar', region: 'KPK' },
];

function WeatherMapModal({ opened, onClose }) {
  const [selectedLayer, setSelectedLayer] = useState('TA2');
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(5);
  const [centerTile, setCenterTile] = useState({ x: 23, y: 12 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);

  useEffect(() => {
    if (opened && Object.keys(weatherData).length === 0) {
      fetchCityWeather();
    }
  }, [opened]);

  const fetchCityWeather = async () => {
    setLoading(true);
    try {
      const promises = pakistanCities.map(city =>
        axios.get(`/api/weather?city=${city.name}`)
          .then(response => ({ city: city.name, data: response.data }))
          .catch(error => ({ city: city.name, error: true }))
      );

      const results = await Promise.all(promises);
      const weatherMap = {};
      results.forEach(result => {
        if (!result.error) {
          weatherMap[result.city] = result.data;
        }
      });

      setWeatherData(weatherMap);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch weather data',
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 35) return '#ff6b6b';
    if (temp >= 25) return '#ffa94d';
    if (temp >= 15) return '#74c0fc';
    return '#339af0';
  };

  const handleZoomIn = () => {
    if (zoom < 8) {
      const newZoom = zoom + 1;
      setZoom(newZoom);
      // Adjust center tile for new zoom level - maintain Pakistan's position
      // Pakistan is at lat: 30°N, lon: 70°E
      const lat = 30;
      const lon = 70;
      const n = Math.pow(2, newZoom);
      const newX = Math.floor((lon + 180) / 360 * n);
      const newY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
      setCenterTile({ x: newX, y: newY });
    }
  };

  const handleZoomOut = () => {
    if (zoom > 3) {
      const newZoom = zoom - 1;
      setZoom(newZoom);
      // Adjust center tile for new zoom level - maintain Pakistan's position
      const lat = 30;
      const lon = 70;
      const n = Math.pow(2, newZoom);
      const newX = Math.floor((lon + 180) / 360 * n);
      const newY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
      setCenterTile({ x: newX, y: newY });
    }
  };

  const handleResetView = () => {
    setZoom(5);
    setCenterTile({ x: 23, y: 12 });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Move tile if dragged more than 50 pixels
    if (Math.abs(deltaX) > 50) {
      setCenterTile(prev => ({
        ...prev,
        x: prev.x + (deltaX > 0 ? -1 : 1)
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
    if (Math.abs(deltaY) > 50) {
      setCenterTile(prev => ({
        ...prev,
        y: prev.y + (deltaY > 0 ? -1 : 1)
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Get tiles around center tile
  const getTileGrid = () => {
    const tiles = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        tiles.push([centerTile.x + dx, centerTile.y + dy]);
      }
    }
    return tiles;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="🇵🇰 Pakistan Weather Map"
      size="xl"
      centered
    >
      <LoadingOverlay visible={loading} />
      
      {/* Weather Layer Selector */}
      <Group justify="center" mb="md">
        <SegmentedControl
          value={selectedLayer}
          onChange={setSelectedLayer}
          data={WEATHER_LAYERS.map(layer => ({
            value: layer.value,
            label: (
              <Group gap="xs">
                <layer.icon size={16} />
                <Text size="sm">{layer.label}</Text>
              </Group>
            ),
          }))}
        />
      </Group>

      {/* Interactive Weather Map */}
      <Paper 
        ref={mapRef}
        withBorder 
        style={{ 
          position: 'relative', 
          height: '500px',
          overflow: 'hidden',
          background: '#1a1a2e',
          borderRadius: '8px',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Zoom Controls */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          <ActionIcon
            onClick={handleZoomIn}
            variant="filled"
            size="lg"
            color="blue"
            disabled={zoom >= 8}
          >
            <IconZoomIn size={20} />
          </ActionIcon>
          <ActionIcon
            onClick={handleZoomOut}
            variant="filled"
            size="lg"
            color="blue"
            disabled={zoom <= 3}
          >
            <IconZoomOut size={20} />
          </ActionIcon>
          <ActionIcon
            onClick={handleResetView}
            variant="filled"
            size="lg"
            color="green"
          >
            <IconFocus size={20} />
          </ActionIcon>
          <Text size="xs" ta="center" c="dimmed">Zoom: {zoom}</Text>
        </div>

        {/* Base Map Layer - OpenStreetMap tiles */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
          }}
        >
          {getTileGrid().map(([x, y], index) => (
            <img
              key={`base-${index}`}
              src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
              alt={`Map tile ${index}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ))}
        </div>

        {/* Weather Layer Overlay using OpenWeatherMap */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            zIndex: 10,
          }}
        >
          {/* Temperature Layer */}
          {selectedLayer === 'TA2' && (
            <>
              {getTileGrid().map(([x, y], index) => (
                <img
                  key={`temp-${index}`}
                  src={`https://tile.openweathermap.org/map/temp_new/${zoom}/${x}/${y}.png?appid=${OPENWEATHER_API_KEY}`}
                  alt={`Temperature tile ${index}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ))}
            </>
          )}
          
          {/* Precipitation Layer */}
          {selectedLayer === 'PA0' && (
            <>
              {getTileGrid().map(([x, y], index) => (
                <img
                  key={`precip-${index}`}
                  src={`https://tile.openweathermap.org/map/precipitation_new/${zoom}/${x}/${y}.png?appid=${OPENWEATHER_API_KEY}`}
                  alt={`Precipitation tile ${index}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ))}
            </>
          )}
          
          {/* Clouds Layer */}
          {selectedLayer === 'CL' && (
            <>
              {getTileGrid().map(([x, y], index) => (
                <img
                  key={`cloud-${index}`}
                  src={`https://tile.openweathermap.org/map/clouds_new/${zoom}/${x}/${y}.png?appid=${OPENWEATHER_API_KEY}`}
                  alt={`Cloud tile ${index}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ))}
            </>
          )}
          
          {/* Wind Layer */}
          {selectedLayer === 'WND' && (
            <>
              {getTileGrid().map(([x, y], index) => (
                <img
                  key={`wind-${index}`}
                  src={`https://tile.openweathermap.org/map/wind_new/${zoom}/${x}/${y}.png?appid=${OPENWEATHER_API_KEY}`}
                  alt={`Wind tile ${index}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ))}
            </>
          )}
        </div>

        {/* Layer Info Badge */}
        <Badge
          size="lg"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 100,
            background: WEATHER_LAYERS.find(l => l.value === selectedLayer)?.color || '#339af0',
            color: 'white',
          }}
        >
          {WEATHER_LAYERS.find(l => l.value === selectedLayer)?.label} Layer
        </Badge>

        {/* Legend */}
        <Paper
          p="sm"
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <Text size="xs" fw={700} mb={4}>
            {selectedLayer === 'TA2' && 'Temperature (°C)'}
            {selectedLayer === 'PA0' && 'Precipitation (mm)'}
            {selectedLayer === 'CL' && 'Cloud Cover (%)'}
            {selectedLayer === 'WND' && 'Wind Speed (m/s)'}
          </Text>
          <Text size="xs" c="dimmed">
            Real-time weather overlay
          </Text>
        </Paper>
      </Paper>

      {/* City Weather Cards */}
      <Grid mt="md" gutter="sm">
        {pakistanCities.map((city) => {
          const weather = weatherData[city.name];
          if (!weather) return null;

          return (
            <Grid.Col key={city.name} span={4}>
              <Card 
                withBorder 
                padding="md"
                style={{
                  background: `linear-gradient(135deg, ${getTemperatureColor(weather.temperature)}15, ${getTemperatureColor(weather.temperature)}05)`,
                  borderColor: getTemperatureColor(weather.temperature),
                }}
              >
                <Group justify="space-between" mb="xs">
                  <div>
                    <Text fw={700} size="md">{city.name}</Text>
                    <Text size="xs" c="dimmed">{city.region}</Text>
                  </div>
                  <Badge 
                    size="lg"
                    style={{
                      background: getTemperatureColor(weather.temperature),
                      color: 'white'
                    }}
                  >
                    {weather.temperature}°C
                  </Badge>
                </Group>
                <Group gap="md" mt="xs">
                  <Group gap={4}>
                    <IconCloudRain size={18} color={getTemperatureColor(weather.temperature)} />
                    <Text size="sm">{weather.condition}</Text>
                  </Group>
                  <Group gap={4}>
                    <IconDroplet size={18} color="#339af0" />
                    <Text size="sm">{weather.humidity}%</Text>
                  </Group>
                </Group>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
      
      <Text size="xs" c="dimmed" ta="center" mt="md">
        Weather overlay powered by OpenWeatherMap • City data refreshed in real-time
      </Text>
    </Modal>
  );
}

export default WeatherMapModal;
