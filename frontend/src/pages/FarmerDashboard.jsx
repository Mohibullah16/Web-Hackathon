import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Table, TextInput, Button, Group, Paper, 
  Text, Card, Grid, Badge, Alert, LoadingOverlay, ActionIcon,
  AppShell, Header
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  IconSearch, IconTrendingUp, IconCloudRain, IconThermometer, 
  IconDroplet, IconX, IconLogout, IconMessage, IconCheck, IconMap 
} from '@tabler/icons-react';
import axios from '../api/axios';
import { useAuth } from '../context/authContext';
import { getErrorMessage } from '../utils/error';
import PriceChartModal from '../components/PriceChartModal';
import WeatherMapModal from '../components/WeatherMapModal';

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
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>Farmer Dashboard</Title>
          <Group>
            <Text size="sm">Welcome, {user?.username}!</Text>
            <Button 
              leftSection={<IconMap size={16} />}
              onClick={() => setWeatherMapOpened(true)}
              variant="light"
              color="cyan"
            >
              Weather Map
            </Button>
            <Button 
              leftSection={<IconMessage size={16} />}
              onClick={() => navigate('/forum')}
              variant="light"
            >
              Forum
            </Button>
            <ActionIcon 
              variant="light" 
              color="red" 
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
            <Paper shadow="sm" p="md" mb="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Current Weather - {weather.city}</Title>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconMap size={16} />}
                  onClick={() => setWeatherMapOpened(true)}
                >
                  View Pakistan Map
                </Button>
              </Group>
              <Grid>
                <Grid.Col span={4}>
                  <Card withBorder>
                    <Group>
                      <IconThermometer size={32} color="#ff6b6b" />
                      <div>
                        <Text size="xl" fw={700}>{weather.temperature}°C</Text>
                        <Text size="sm" c="dimmed">Temperature</Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card withBorder>
                    <Group>
                      <IconDroplet size={32} color="#339af0" />
                      <div>
                        <Text size="xl" fw={700}>{weather.humidity}%</Text>
                        <Text size="sm" c="dimmed">Humidity</Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card withBorder>
                    <Group>
                      <IconCloudRain size={32} color="#868e96" />
                      <div>
                        <Text size="xl" fw={700}>{weather.condition}</Text>
                        <Text size="sm" c="dimmed">Condition</Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Produce Table Section */}
          <Paper shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Market Prices</Title>
              <TextInput
                placeholder="Search produce..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 300 }}
              />
            </Group>

            <LoadingOverlay visible={loading} />
            
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
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
                          <Badge color="green" size="lg">
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
                          >
                            View Trend
                          </Button>
                          <Button
                            size="xs"
                            color="green"
                            variant="light"
                            onClick={() => handleGetAdvice(item)}
                            loading={loadingAdvice}
                          >
                            Get Advice
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                    {advice && adviceForProduceId === item.id && (
                      <Table.Tr>
                        <Table.Td colSpan={8} style={{ padding: 0 }}>
                          <Alert 
                            title={`Smart Farming Advice for ${item.name}`}
                            color="green" 
                            withCloseButton
                            onClose={() => {
                              setAdvice('');
                              setAdviceForProduceId(null);
                            }}
                            style={{ margin: '8px', borderRadius: '8px' }}
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
      </AppShell.Main>
    </AppShell>
  );
}

export default FarmerDashboard;
