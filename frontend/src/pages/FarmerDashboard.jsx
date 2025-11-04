import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Table, TextInput, Button, Group, Paper, 
  Text, Card, Grid, Badge, Alert, LoadingOverlay, ActionIcon,
  AppShell, Header, Checkbox
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  IconSearch, IconTrendingUp, IconCloudRain, IconThermometer, 
  IconDroplet, IconX, IconLogout, IconMessage, IconCheck, IconMap,
  IconChartLine
} from '@tabler/icons-react';
import axios from '../api/axios';
import { useAuth } from '../context/authContext';
import { getErrorMessage } from '../utils/error';
import PriceChartModal from '../components/PriceChartModal';
import WeatherMapModal from '../components/WeatherMapModal';
import CompareProduceModal from '../components/CompareProduceModal';

function FarmerDashboard() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [produceList, setProduceList] = useState([]);
  const [filteredProduce, setFilteredProduce] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [advice, setAdvice] = useState('');
  const [adviceForProduceId, setAdviceForProduceId] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [selectedProduce, setSelectedProduce] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [weatherMapOpened, setWeatherMapOpened] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [compareModalOpened, setCompareModalOpened] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking user
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Redirect admin users to admin dashboard
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }
    
    fetchProduceData();
    fetchWeather();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Filter produce based on search query
    const filtered = produceList.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProduce(filtered);
  }, [searchQuery, produceList]);

  const fetchProduceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/produce/');
      setProduceList(response.data);
      setFilteredProduce(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: getErrorMessage(error, 'Failed to load produce data'),
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (city = 'Islamabad') => {
    try {
      const response = await axios.get(`/api/weather?city=${city}`);
      setWeather(response.data);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    }
  };

  const handleViewTrend = (produce) => {
    setSelectedProduce(produce);
    setModalOpened(true);
  };

  const handleCompareCheckbox = (produceId, checked) => {
    if (checked) {
      if (selectedForComparison.length < 5) {
        setSelectedForComparison([...selectedForComparison, produceId]);
      } else {
        notifications.show({
          title: 'Limit Reached',
          message: 'You can only compare up to 5 items at once',
          color: 'yellow',
        });
      }
    } else {
      setSelectedForComparison(selectedForComparison.filter(id => id !== produceId));
    }
  };

  const handleCompare = () => {
    if (selectedForComparison.length < 2) {
      notifications.show({
        title: 'Selection Required',
        message: 'Please select at least 2 items to compare',
        color: 'yellow',
      });
      return;
    }
    setCompareModalOpened(true);
  };

  const handleGetAdvice = async (produce) => {
    if (!weather) {
      notifications.show({
        title: 'Error',
        message: 'Weather data not available',
        color: 'red',
        icon: <IconX />,
      });
      return;
    }

    setLoadingAdvice(true);
    try {
      console.log('Getting advice for produce:', produce);
      console.log('Weather data:', weather);
      
      // First get price history
      const historyResponse = await axios.get(`/produce/${produce.id}/history`);
      console.log('Price history response:', historyResponse.data);
      
      // Then get advice
      const advicePayload = {
        produce_name: produce.name,
        price_history: historyResponse.data.history,
        weather_data: {
          temperature: weather.temperature,
          condition: weather.condition,
          humidity: weather.humidity
        },
        city: weather.city
      };
      
      console.log('Advice request payload:', advicePayload);
      
      const adviceResponse = await axios.post('/api/advice', advicePayload);
      console.log('Advice response:', adviceResponse.data);
      
      setAdvice(adviceResponse.data.advice);
      setAdviceForProduceId(produce.id);
      
      notifications.show({
        title: 'Smart Advice',
        message: 'AI-generated advice is ready!',
        color: 'green',
        icon: <IconCheck />,
      });
    } catch (error) {
      console.error('Error getting advice:', error);
      console.error('Error response:', error.response?.data);
      
      notifications.show({
        title: 'Error',
        message: getErrorMessage(error, 'Failed to get smart advice'),
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      styles={{
        main: {
          background: 'linear-gradient(to bottom, #f0f9ff 0%, #e8f5e9 100%)',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Header
        style={{
          background: 'linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%)',
          borderBottom: '3px solid #90EE90',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(144, 238, 144, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size="xl" fw={700} style={{ color: '#90EE90' }}>🌾</Text>
            </div>
            <div>
              <Title order={3} style={{ color: 'white', margin: 0, fontSize: '20px' }}>
                CropSense
              </Title>
              <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: '-2px' }}>
                Farmer Portal
              </Text>
            </div>
          </Group>
          <Group>
            <Text size="sm" fw={500} style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              {user?.username}
            </Text>
            <Button 
              leftSection={<IconMap size={16} />}
              onClick={() => setWeatherMapOpened(true)}
              variant="filled"
              color="#90EE90"
              style={{
                background: 'rgba(144, 238, 144, 0.2)',
                color: 'white',
                border: '1px solid rgba(144, 238, 144, 0.3)',
              }}
            >
              Weather
            </Button>
            <Button 
              leftSection={<IconMessage size={16} />}
              onClick={() => navigate('/forum')}
              variant="filled"
              style={{
                background: 'rgba(144, 238, 144, 0.2)',
                color: 'white',
                border: '1px solid rgba(144, 238, 144, 0.3)',
              }}
            >
              Forum
            </Button>
            <ActionIcon 
              variant="filled"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
              }}
              onClick={handleLogout}
              size="lg"
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          {/* Weather Section */}
          {weather && (
            <Paper 
              shadow="md" 
              p="lg" 
              mb="lg" 
              style={{
                background: 'white',
                border: '2px solid #d4edda',
                borderRadius: '12px',
              }}
            >
              <Group justify="space-between" mb="md">
                <Title order={4} style={{ color: '#2d5016' }}>
                  Current Weather - {weather.city}
                </Title>
                <Button
                  size="sm"
                  leftSection={<IconMap size={16} />}
                  onClick={() => setWeatherMapOpened(true)}
                  style={{
                    background: 'linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%)',
                    color: 'white',
                  }}
                >
                  View Pakistan Map
                </Button>
              </Group>
              <Grid>
                <Grid.Col span={4}>
                  <Card 
                    withBorder
                    style={{
                      background: 'linear-gradient(135deg, #fff8f0 0%, #fff 100%)',
                      border: '2px solid #ffd8a8',
                    }}
                  >
                    <Group>
                      <IconThermometer size={32} color="#fd7e14" />
                      <div>
                        <Text size="xl" fw={700} style={{ color: '#2d5016' }}>
                          {weather.temperature}°C
                        </Text>
                        <Text size="sm" c="dimmed">Temperature</Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card 
                    withBorder
                    style={{
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #fff 100%)',
                      border: '2px solid #a5d8ff',
                    }}
                  >
                    <Group>
                      <IconDroplet size={32} color="#1971c2" />
                      <div>
                        <Text size="xl" fw={700} style={{ color: '#2d5016' }}>
                          {weather.humidity}%
                        </Text>
                        <Text size="sm" c="dimmed">Humidity</Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card 
                    withBorder
                    style={{
                      background: 'linear-gradient(135deg, #e8f5e9 0%, #fff 100%)',
                      border: '2px solid #b2dfdb',
                    }}
                  >
                    <Group>
                      <IconCloudRain size={32} color="#2e7d32" />
                      <div>
                        <Text size="xl" fw={700} style={{ color: '#2d5016' }}>
                          {weather.condition}</Text>
                        <Text size="sm" c="dimmed">Condition</Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Produce Table Section */}
          <Paper 
            shadow="md" 
            p="lg" 
            style={{
              background: 'white',
              border: '2px solid #d4edda',
              borderRadius: '12px',
            }}
          >
            <Group justify="space-between" mb="md">
              <Title order={4} style={{ color: '#2d5016' }}>Market Prices</Title>
              <Group>
                {selectedForComparison.length >= 2 && (
                  <Button
                    leftSection={<IconChartLine size={16} />}
                    style={{
                      background: 'linear-gradient(135deg, #7950f2 0%, #5f3dc4 100%)',
                      color: 'white',
                    }}
                    onClick={handleCompare}
                  >
                    Compare ({selectedForComparison.length})
                  </Button>
                )}
                <TextInput
                  placeholder="Search produce..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 300 }}
                  styles={{
                    input: {
                      borderColor: '#d4edda',
                      '&:focus': {
                        borderColor: '#4a7c2c',
                      },
                    },
                  }}
                />
              </Group>
            </Group>

            <LoadingOverlay visible={loading} />
            
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '50px' }}>
                    <Text size="xs" fw={500}>Compare</Text>
                  </Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Latest Price</Table.Th>
                  <Table.Th>Avg Price</Table.Th>
                  <Table.Th>Min Price</Table.Th>
                  <Table.Th>Max Price</Table.Th>
                  <Table.Th>Region</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredProduce.map((item) => (
                  <>
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedForComparison.includes(item.id)}
                          onChange={(e) => handleCompareCheckbox(item.id, e.currentTarget.checked)}
                          color="grape"
                          styles={{
                            input: {
                              borderColor: '#9775fa',
                              '&:checked': {
                                backgroundColor: '#7950f2',
                                borderColor: '#7950f2',
                              },
                            },
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {item.image_url && (
                            <img 
                              src={`http://localhost:8000${item.image_url}`} 
                              alt={item.name}
                              style={{ width: 40, height: 40, borderRadius: '4px', objectFit: 'cover' }}
                            />
                          )}
                          <Text fw={500}>{item.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {item.latest_price ? (
                          <Badge 
                            size="lg"
                            style={{
                              background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          >
                            Rs. {item.latest_price.toFixed(2)}
                          </Badge>
                        ) : (
                          <Text c="dimmed" size="sm">No data</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {item.avg_price ? (
                          <Text size="sm" fw={500}>Rs. {item.avg_price.toFixed(2)}</Text>
                        ) : (
                          <Text c="dimmed" size="sm">N/A</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {item.min_price ? (
                          <Text size="sm" c="blue">Rs. {item.min_price.toFixed(2)}</Text>
                        ) : (
                          <Text c="dimmed" size="sm">N/A</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {item.max_price ? (
                          <Text size="sm" c="red">Rs. {item.max_price.toFixed(2)}</Text>
                        ) : (
                          <Text c="dimmed" size="sm">N/A</Text>
                        )}
                      </Table.Td>
                      <Table.Td>{item.region || 'N/A'}</Table.Td>
                      <Table.Td>
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            leftSection={<IconTrendingUp size={14} />}
                            variant="light"
                            onClick={() => handleViewTrend(item)}
                            style={{
                              backgroundColor: '#e7f5ff',
                              color: '#1971c2',
                              border: '1px solid #a5d8ff',
                            }}
                          >
                            View Trend
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => handleGetAdvice(item)}
                            loading={loadingAdvice}
                            style={{
                              backgroundColor: '#d3f9d8',
                              color: '#2f9e44',
                              border: '1px solid #8ce99a',
                            }}
                          >
                            Get Advice
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                    {advice && adviceForProduceId === item.id && (
                      <Table.Tr>
                        <Table.Td colSpan={9} style={{ padding: 0 }}>
                          <Alert 
                            title={`Smart Farming Advice for ${item.name}`}
                            withCloseButton
                            onClose={() => {
                              setAdvice('');
                              setAdviceForProduceId(null);
                            }}
                            style={{ 
                              margin: '8px', 
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #d3f9d8 0%, #b2f2bb 100%)',
                              border: '2px solid #8ce99a',
                              color: '#2d5016',
                            }}
                            styles={{
                              title: {
                                color: '#2d5016',
                                fontWeight: 600,
                              },
                              message: {
                                color: '#2f9e44',
                              },
                            }}
                          >
                            {advice}
                          </Alert>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </>
                ))}
              </Table.Tbody>
            </Table>

            {filteredProduce.length === 0 && !loading && (
              <Text ta="center" c="dimmed" py="xl">
                No produce found
              </Text>
            )}
          </Paper>
        </Container>

        {/* Price Chart Modal */}
        <PriceChartModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          produceId={selectedProduce?.id}
          produceName={selectedProduce?.name}
        />

        {/* Weather Map Modal */}
        <WeatherMapModal
          opened={weatherMapOpened}
          onClose={() => setWeatherMapOpened(false)}
        />

        {/* Compare Produce Modal */}
        <CompareProduceModal
          opened={compareModalOpened}
          onClose={() => setCompareModalOpened(false)}
          selectedProduceIds={selectedForComparison}
          produceList={produceList}
        />
      </AppShell.Main>
    </AppShell>
  );
}

export default FarmerDashboard;
