import { useEffect, useState } from 'react';
import { Modal, Title, Text, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from '../api/axios';

function PriceChartModal({ opened, onClose, produceId, produceName }) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (opened && produceId) {
      fetchPriceHistory();
    }
  }, [opened, produceId]);

  const fetchPriceHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/produce/${produceId}/history`);
      
      // Transform data for recharts
      const formattedData = response.data.history.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: item.price,
        region: item.region
      }));
      
      setChartData(formattedData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load price history',
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={
        <Title order={3} style={{ color: '#2d5016' }}>
          Price Trend - {produceName}
        </Title>
      }
      size="xl"
      styles={{
        header: {
          borderBottom: '2px solid #d4edda',
          paddingBottom: '12px',
        },
        body: {
          padding: '20px',
        },
      }}
    >
      <LoadingOverlay visible={loading} />
      {chartData.length > 0 ? (
        <>
          <Text size="sm" c="dimmed" mb="md">
            7-Day Price History
          </Text>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Price (Rs.)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#4a7c2c" 
                strokeWidth={3}
                activeDot={{ r: 8, fill: '#2d5016' }} 
                dot={{ fill: '#51cf66', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        !loading && (
          <Text ta="center" c="dimmed" py="xl">
            No price history available for this produce
          </Text>
        )
      )}
    </Modal>
  );
}

export default PriceChartModal;
