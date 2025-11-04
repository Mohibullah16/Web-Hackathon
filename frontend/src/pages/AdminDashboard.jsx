import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Paper, TextInput, Button, Group, 
  Table, Badge, ActionIcon, AppShell, Text,
  NumberInput, Select, Modal, LoadingOverlay, Grid,
  Card, Stack, Tooltip, SimpleGrid, rem, FileInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { 
  IconPlus, IconLogout, IconMessage, IconCheck, IconX, 
  IconEdit, IconTrash, IconChartBar, IconShoppingCart,
  IconCurrencyRupee, IconTrendingUp, IconUpload
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import axios from '../api/axios';
import { useAuth } from '../context/authContext';
import { getErrorMessage } from '../utils/error';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [produceList, setProduceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [produceModalOpened, setProduceModalOpened] = useState(false);
  const [editingProduce, setEditingProduce] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalPrices: 0,
    avgPrice: 0,
    recentUpdates: 0
  });

  const produceForm = useForm({
    initialValues: {
      name: '',
      price: '',
      region: '',
    },
    validate: {
      name: (value) => (!value || !value.trim() ? 'Produce name is required' : null),
      price: (value, values) => {
        // Skip validation if editing (we check below if both price and region are provided together)
        return null;
      },
      region: (value, values) => {
        // Skip validation if editing
        return null;
      },
    },
  });

  useEffect(() => {
    // Wait for auth to load before checking user
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchProduceData();
  }, [user, authLoading, navigate]);

  const fetchProduceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/produce/');
      setProduceList(response.data);
      
      // Calculate stats
      const totalItems = response.data.length;
      const itemsWithPrices = response.data.filter(item => item.latest_price !== null);
      const totalPrices = itemsWithPrices.length;
      const avgPrice = totalPrices > 0 
        ? itemsWithPrices.reduce((sum, item) => sum + item.latest_price, 0) / totalPrices 
        : 0;
      
      // Count items updated in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUpdates = response.data.filter(item => 
        item.date && new Date(item.date) >= sevenDaysAgo
      ).length;
      
      setStats({
        totalItems,
        totalPrices,
        avgPrice: avgPrice.toFixed(2),
        recentUpdates
      });
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

  const handleSubmitProduce = async (values) => {
    try {
      // Validation for add mode
      if (!editingProduce) {
        if (!values.price || parseFloat(values.price) <= 0) {
          notifications.show({
            title: 'Error',
            message: 'Price must be greater than 0',
            color: 'red',
            icon: <IconX />,
          });
          return;
        }
        if (!values.region || !values.region.trim()) {
          notifications.show({
            title: 'Error',
            message: 'Region is required',
            color: 'red',
            icon: <IconX />,
          });
          return;
        }
      }
      
      // Validation for edit mode - validate price if provided
      if (editingProduce) {
        const hasPrice = values.price !== '' && values.price !== null && values.price !== undefined;
        
        if (hasPrice && parseFloat(values.price) <= 0) {
          notifications.show({
            title: 'Error',
            message: 'Price must be greater than 0',
            color: 'red',
            icon: <IconX />,
          });
          return;
        }
      }
      
      const formData = new FormData();
      formData.append('name', values.name.trim());
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      if (editingProduce) {
        // Update existing produce with optional price/region
        const hasPrice = values.price !== '' && values.price !== null && values.price !== undefined;
        const hasRegion = values.region && values.region.trim();
        
        if (hasPrice) {
          formData.append('price', parseFloat(values.price).toString());
          // If region is provided, use it; otherwise backend will use the last region
          if (hasRegion) {
            formData.append('region', values.region.trim());
          }
        } else if (hasRegion) {
          // If only region is provided without price, don't send it (region update needs price)
          // Just skip it
        }
        
        console.log('Updating produce with ID:', editingProduce.id);
        console.log('Form values:', { name: values.name, price: values.price, region: values.region });
        console.log('FormData price:', formData.get('price'));
        console.log('FormData region:', formData.get('region'));
        
        const response = await axios.put(`/produce/${editingProduce.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('Update response:', response.data);
        
        notifications.show({
          title: 'Success',
          message: 'Produce updated successfully',
          color: 'green',
          icon: <IconCheck />,
        });
      } else {
        // Create new produce
        const produceResponse = await axios.post('/produce/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        const produceId = produceResponse.data.id || produceResponse.data._id;
        
        // Add initial price
        await axios.post('/produce/prices', {
          produce_id: produceId,
          price: parseFloat(values.price),
          region: values.region.trim()
        });
        
        notifications.show({
          title: 'Success',
          message: 'Produce and price added successfully',
          color: 'green',
          icon: <IconCheck />,
        });
      }
      
      produceForm.reset();
      setImageFile(null);
      setProduceModalOpened(false);
      setEditingProduce(null);
      fetchProduceData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: getErrorMessage(error, editingProduce ? 'Failed to update produce' : 'Failed to add produce'),
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  const handleEditProduce = (item) => {
    console.log('Editing item:', item);
    console.log('Item ID:', item.id);
    setEditingProduce(item);
    produceForm.setValues({
      name: item.name,
      price: '',
      region: ''
    });
    setImageFile(null);
    setProduceModalOpened(true);
  };

  const handleDeleteProduce = (item) => {
    modals.openConfirmModal({
      title: 'Delete Produce',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{item.name}</strong>? 
          This action cannot be undone and will also delete all associated price entries.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await axios.delete(`/produce/${item.id}`);
          notifications.show({
            title: 'Success',
            message: `${item.name} deleted successfully`,
            color: 'green',
            icon: <IconCheck />,
          });
          fetchProduceData();
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: getErrorMessage(error, 'Failed to delete produce'),
            color: 'red',
            icon: <IconX />,
          });
        }
      },
    });
  };

  const handleCloseProduceModal = () => {
    setProduceModalOpened(false);
    setEditingProduce(null);
    setImageFile(null);
    produceForm.reset();
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
          <Title order={3}>Admin Dashboard</Title>
          <Group>
            <Text size="sm">Welcome, {user?.username}!</Text>
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
          {/* KPI Dashboard */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="apart" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Total Items</Text>
                <IconShoppingCart size={20} color="blue" />
              </Group>
              <Text size="xl" fw={700}>{stats.totalItems}</Text>
              <Text size="xs" c="dimmed" mt="xs">Produce items in catalog</Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="apart" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Items with Prices</Text>
                <IconChartBar size={20} color="green" />
              </Group>
              <Text size="xl" fw={700}>{stats.totalPrices}</Text>
              <Text size="xs" c="dimmed" mt="xs">Items with price data</Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="apart" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Average Price</Text>
                <IconCurrencyRupee size={20} color="orange" />
              </Group>
              <Text size="xl" fw={700}>Rs. {stats.avgPrice}</Text>
              <Text size="xs" c="dimmed" mt="xs">Across all items</Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="apart" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Recent Updates</Text>
                <IconTrendingUp size={20} color="violet" />
              </Group>
              <Text size="xl" fw={700}>{stats.recentUpdates}</Text>
              <Text size="xs" c="dimmed" mt="xs">Updated in last 7 days</Text>
            </Card>
          </SimpleGrid>

          {/* Produce Management Table */}
          <Paper shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Manage Produce & Prices</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setProduceModalOpened(true)}
              >
                Add Produce
              </Button>
            </Group>

            <LoadingOverlay visible={loading} />

            {produceList.length === 0 && !loading ? (
              <Text ta="center" c="dimmed" py="xl">
                No produce items yet. Add your first item to get started!
              </Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Latest Price</Table.Th>
                    <Table.Th>Avg Price</Table.Th>
                    <Table.Th>Min Price</Table.Th>
                    <Table.Th>Max Price</Table.Th>
                    <Table.Th>Region</Table.Th>
                    <Table.Th>Last Updated</Table.Th>
                    <Table.Th style={{ width: 120 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {produceList.map((item) => (
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
                        <Group gap={4}>
                          <Tooltip label="Edit">
                            <ActionIcon 
                              variant="light" 
                              color="blue"
                              onClick={() => handleEditProduce(item)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon 
                              variant="light" 
                              color="red"
                              onClick={() => handleDeleteProduce(item)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Container>

        {/* Add/Edit Produce Modal */}
        <Modal
          opened={produceModalOpened}
          onClose={handleCloseProduceModal}
          title={editingProduce ? 'Edit Produce' : 'Add New Produce'}
          size="md"
        >
          <form onSubmit={produceForm.onSubmit(handleSubmitProduce)}>
            <Stack gap="md">
              <TextInput
                label="Produce Name"
                placeholder="e.g., Tomato"
                required
                {...produceForm.getInputProps('name')}
              />
              
              <FileInput
                label="Image"
                placeholder="Upload image"
                accept="image/*"
                leftSection={<IconUpload size={16} />}
                value={imageFile}
                onChange={setImageFile}
                clearable
              />
              
              <NumberInput
                label={editingProduce ? "New Price (Rs.) - Optional" : "Initial Price (Rs.)"}
                placeholder="150.00"
                min={0}
                step={0.01}
                decimalScale={2}
                required={!editingProduce}
                {...produceForm.getInputProps('price')}
              />
              
              <TextInput
                label={editingProduce ? "Region - Optional" : "Region"}
                placeholder="e.g., Punjab"
                required={!editingProduce}
                {...produceForm.getInputProps('region')}
              />
              
              {editingProduce && (
                <Text size="xs" c="dimmed">
                  • Leave price empty to only update name/image<br/>
                  • Enter price to add new price entry (region optional - will use last region if not provided)
                </Text>
              )}
              
              <Button fullWidth type="submit">
                {editingProduce ? 'Update Produce' : 'Add Produce with Price'}
              </Button>
            </Stack>
          </form>
        </Modal>
      </AppShell.Main>
    </AppShell>
  );
}

export default AdminDashboard;
