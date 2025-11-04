import { Modal, LoadingOverlay } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';

const COLORS = ['#339af0', '#f03e3e', '#37b24d', '#f59f00', '#7950f2', '#f06595'];

function CompareProduceModal({ opened, onClose, selectedProduceIds, produceList }) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (opened && selectedProduceIds.length > 0) {
      fetchComparisonData();
    }
  }, [opened, selectedProduceIds]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      // Fetch price history for all selected produce
      const promises = selectedProduceIds.map(id => 
        axios.get(`/produce/${id}/history`)
      );
      
      const responses = await Promise.all(promises);
      
      // Combine all histories into a single dataset
      const allDates = new Set();
      const dataByProduce = {};

      responses.forEach((response, index) => {
        const produceId = selectedProduceIds[index];
        const produce = produceList.find(p => p.id === produceId);
        const history = response.data.history || [];
        
        dataByProduce[produce.name] = {};
        
        history.forEach(entry => {
          const date = new Date(entry.date);
          const timeLabel = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          });
          allDates.add(timeLabel);
          dataByProduce[produce.name][timeLabel] = entry.price;
        });
      });

      // Create chart data with all times
      const sortedTimes = Array.from(allDates).sort((a, b) => {
        // Convert time strings back to Date objects for proper sorting
        const timeA = new Date('1970/01/01 ' + a);
        const timeB = new Date('1970/01/01 ' + b);
        return timeA - timeB;
      });

      const formattedData = sortedTimes.map(time => {
        const dataPoint = { date: time };
        Object.keys(dataByProduce).forEach(produceName => {
          dataPoint[produceName] = dataByProduce[produceName][time] || null;
        });
        return dataPoint;
      });

      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch comparison data',
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  const getProduceNames = () => {
    return selectedProduceIds.map(id => {
      const produce = produceList.find(p => p.id === id);
      return produce ? produce.name : '';
    }).filter(Boolean);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`📊 Comparing: ${getProduceNames().join(' vs ')}`}
      size="xl"
      centered
    >
      <LoadingOverlay visible={loading} />
      
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Price (Rs.)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => value ? `Rs. ${value.toFixed(2)}` : 'No data'}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            {getProduceNames().map((name, index) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No price history data available for comparison
          </div>
        )
      )}
    </Modal>
  );
}

export default CompareProduceModal;
