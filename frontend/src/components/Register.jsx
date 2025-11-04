import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Select, Box, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconLeaf, IconUser, IconLock, IconMail, IconUserCircle } from '@tabler/icons-react';
import axios from '../api/axios';
import { getErrorMessage } from '../utils/error';

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'farmer',
    },
    validate: {
      username: (value) => {
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return null;
      },
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = values;
      await axios.post('/auth/register', registerData);
      
      notifications.show({
        title: 'Success',
        message: 'Registration successful! Please login.',
        color: 'green',
        icon: <IconCheck />,
      });

      navigate('/login');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: getErrorMessage(error, 'Registration failed. Please try again.'),
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
            Join the Future of Farming
          </Text>
        </Stack>

        {/* Registration Form */}
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
            Create Account
          </Title>
          <Text size="sm" c="dimmed" mb={25}>
            Start managing your farm smarter
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Username"
                placeholder="Choose a username"
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
              <TextInput
                label="Email"
                placeholder="your@email.com"
                size="md"
                leftSection={<IconMail size={18} color="#4a7c2c" />}
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
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Password"
                placeholder="Choose a password"
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
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your password"
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
                {...form.getInputProps('confirmPassword')}
              />
              <Select
                label="Role"
                placeholder="Select your role"
                size="md"
                leftSection={<IconUserCircle size={18} color="#4a7c2c" />}
                data={[
                  { value: 'farmer', label: '🌾 Farmer' },
                  { value: 'admin', label: '👨‍💼 Admin' },
                ]}
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
                {...form.getInputProps('role')}
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
                Create Account
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt={25} gap={4}>
            <Text size="sm" c="dimmed">
              Already have an account?
            </Text>
            <Link 
              to="/login" 
              style={{ 
                color: '#4a7c2c',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign In
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

export default Register;
