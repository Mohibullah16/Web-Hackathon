import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
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
    <Container size={420} my={40}>
      <Title ta="center" style={{ fontWeight: 900 }}>
        Smart Agriculture Tracker
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Track produce prices and get smart farming advice
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Username"
            placeholder="Your username"
            required
            {...form.getInputProps('username')}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Sign in
          </Button>
        </form>
        <Text ta="center" mt="md" size="sm">
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 500 }}>
            Register
          </Link>
        </Text>
      </Paper>
    </Container>
  );
}

export default Login;
