import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
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
    <Container size={420} my={40}>
      <Title ta="center" style={{ fontWeight: 900 }}>
        Create Account
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Join the Smart Agriculture community
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Username"
            placeholder="Choose a username"
            required
            {...form.getInputProps('username')}
          />
          <TextInput
            label="Email"
            placeholder="your@email.com"
            required
            mt="md"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="Choose a password"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Select
            label="Role"
            placeholder="Select your role"
            data={[
              { value: 'farmer', label: 'Farmer' },
              { value: 'admin', label: 'Admin' },
            ]}
            required
            mt="md"
            {...form.getInputProps('role')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Register
          </Button>
        </form>
        <Text ta="center" mt="md" size="sm">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 500 }}>
            Login
          </Link>
        </Text>
      </Paper>
    </Container>
  );
}

export default Register;
