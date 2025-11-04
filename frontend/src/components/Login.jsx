import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Box, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconLeaf, IconUser, IconLock } from '@tabler/icons-react';
import axios from '../api/axios';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../context/authContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? 'Username is required' : null),
      password: (value) => (!value ? 'Password is required' : null),
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('password', values.password);

      const response = await axios.post('/auth/login', formData);
      
      login(response.data.access_token, response.data.user);
      
      notifications.show({
        title: 'Success',
        message: 'Login successful!',
        color: 'green',
        icon: <IconCheck />,
      });

      // Navigate based on role
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: getErrorMessage(error, 'Login failed. Please try again.'),
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8C8 50%, #90EE90 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
      }}
    >
      {/* Decorative elements */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />
      <Container size={460} style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo and Header */}
        <Stack align="center" gap="xs" mb={30}>
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(45, 80, 22, 0.3)',
              border: '3px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <IconLeaf size={40} color="#90EE90" />
          </Box>
          <Title 
            order={1} 
            style={{ 
              color: '#2d5016',
              fontWeight: 800,
              fontSize: '36px',
              textShadow: '0 2px 4px rgba(255, 255, 255, 0.5)',
              letterSpacing: '-0.5px',
            }}
          >
            CropSense
          </Title>
          <Text 
            size="md" 
            style={{ 
              color: '#3d6b1f',
              fontWeight: 500,
            }}
          >
            Smart Farming, Better Harvest
          </Text>
        </Stack>

        {/* Login Form */}
        <Paper 
          shadow="xl" 
          p={40} 
          radius="lg"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(144, 238, 144, 0.3)',
          }}
        >
          <Title order={3} mb={8} style={{ color: '#2d5016' }}>
            Welcome Back
          </Title>
          <Text size="sm" c="dimmed" mb={25}>
            Sign in to access your farm dashboard
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Username"
                placeholder="Enter your username"
                size="md"
                leftSection={<IconUser size={18} color="#4a7c2c" />}
                required
                styles={{
                  label: {
                    color: '#2d5016',
                    fontWeight: 500,
                  },
                  input: {
                    borderRadius: '10px',
                    border: '2px solid #d4edda',
                    backgroundColor: '#fefffe',
                    '&:focus': {
                      borderColor: '#4a7c2c',
                      backgroundColor: '#ffffff',
                    },
                  },
                }}
                {...form.getInputProps('username')}
              />
              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                size="md"
                leftSection={<IconLock size={18} color="#4a7c2c" />}
                required
                styles={{
                  label: {
                    color: '#2d5016',
                    fontWeight: 500,
                  },
                  input: {
                    borderRadius: '10px',
                    border: '2px solid #d4edda',
                    backgroundColor: '#fefffe',
                    '&:focus': {
                      borderColor: '#4a7c2c',
                      backgroundColor: '#ffffff',
                    },
                  },
                }}
                {...form.getInputProps('password')}
              />
              <Button 
                fullWidth 
                size="md" 
                type="submit" 
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%)',
                  borderRadius: '10px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  marginTop: '10px',
                  boxShadow: '0 4px 12px rgba(45, 80, 22, 0.3)',
                }}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt={25} gap={4}>
            <Text size="sm" c="dimmed">
              Don't have an account?
            </Text>
            <Link 
              to="/register" 
              style={{ 
                color: '#4a7c2c',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create Account
            </Link>
          </Group>
        </Paper>

        {/* Footer Text */}
        <Text 
          ta="center" 
          size="xs" 
          mt={20}
          style={{ 
            color: '#2d5016',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
          }}
        >
          Monitor crops • Track markets • Harvest success
        </Text>
      </Container>
    </Box>
  );
}

export default Login;
