import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Paper, Button, Group, Card, Text, 
  AppShell, ActionIcon, Modal, TextInput, Textarea,
  Badge, Stack, LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconLogout, IconArrowBack, IconMessage, IconCheck, IconX } from '@tabler/icons-react';
import axios from '../api/axios';
import { useAuth } from '../context/authContext';

function Forum() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      content: '',
    },
    validate: {
      title: (value) => {
        if (!value) return 'Title is required';
        if (value.length < 3) return 'Title must be at least 3 characters';
        return null;
      },
      content: (value) => {
        if (!value) return 'Content is required';
        if (value.length < 10) return 'Content must be at least 10 characters';
        return null;
      },
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPosts();
  }, [user, navigate]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/forum/posts');
      setPosts(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load forum posts',
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (values) => {
    try {
      await axios.post('/forum/posts', values);
      notifications.show({
        title: 'Success',
        message: 'Post created successfully',
        color: 'green',
        icon: <IconCheck />,
      });
      form.reset();
      setModalOpened(false);
      fetchPosts();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create post',
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  const handleViewPost = (postId) => {
    console.log('Navigating to post:', postId);
    navigate(`/forum/${postId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goBack = () => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      styles={{
        main: {
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%)',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Header
        style={{
          background: 'linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%)',
          borderBottom: 'none',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="md">
            {/* CropSense Logo */}
            <Group gap="xs">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#2d5016',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                🌾
              </div>
              <div>
                <Text size="lg" fw={700} style={{ color: 'white', lineHeight: 1.2 }}>
                  CropSense
                </Text>
                <Text size="xs" style={{ color: '#b2f2bb', lineHeight: 1 }}>
                  Community Forum
                </Text>
              </div>
            </Group>
          </Group>
          
          <Group gap="sm">
            <Button
              variant="light"
              onClick={goBack}
              leftSection={<IconArrowBack size={16} />}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              Dashboard
            </Button>
            <Text size="sm" style={{ color: 'white' }}>
              Welcome, {user?.username}!
            </Text>
            <ActionIcon 
              variant="light"
              onClick={handleLogout}
              size="lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          <Group justify="space-between" mb="lg">
            <Title order={4} style={{ color: '#2d5016' }}>
              Discussion Board
            </Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setModalOpened(true)}
              style={{
                background: 'linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%)',
                color: 'white',
              }}
            >
              Create Post
            </Button>
          </Group>

          <LoadingOverlay visible={loading} />

          <Stack gap="md">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                shadow="md" 
                padding="lg"
                style={{ 
                  cursor: 'pointer',
                  background: 'white',
                  border: '2px solid #d4edda',
                  borderRadius: '12px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 124, 44, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleViewPost(post.id)}
              >
                <Group justify="space-between" mb="xs">
                  <Title order={4} style={{ color: '#2d5016' }}>
                    {post.title}
                  </Title>
                  <Badge 
                    leftSection={<IconMessage size={12} />}
                    style={{
                      background: 'linear-gradient(135deg, #339af0 0%, #1971c2 100%)',
                      color: 'white',
                    }}
                  >
                    {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed" mb="md">
                  {post.content.length > 200 
                    ? `${post.content.substring(0, 200)}...` 
                    : post.content}
                </Text>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    By {post.author_username}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </Group>
              </Card>
            ))}
          </Stack>

          {posts.length === 0 && !loading && (
            <Paper 
              p="xl" 
              ta="center"
              style={{
                background: 'white',
                border: '2px solid #d4edda',
                borderRadius: '12px',
              }}
            >
              <Text c="dimmed">No posts yet. Be the first to create one!</Text>
            </Paper>
          )}

          {/* Create Post Modal */}
          <Modal
            opened={modalOpened}
            onClose={() => setModalOpened(false)}
            title={
              <Text fw={600} size="lg" style={{ color: '#2d5016' }}>
                Create New Post
              </Text>
            }
            size="lg"
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
            <form onSubmit={form.onSubmit(handleCreatePost)}>
              <TextInput
                label="Title"
                placeholder="Post title..."
                required
                {...form.getInputProps('title')}
                styles={{
                  input: {
                    borderColor: '#d4edda',
                    '&:focus': {
                      borderColor: '#4a7c2c',
                    },
                  },
                  label: {
                    color: '#2d5016',
                    fontWeight: 500,
                  },
                }}
              />
              <Textarea
                label="Content"
                placeholder="Share your thoughts..."
                required
                mt="md"
                minRows={6}
                {...form.getInputProps('content')}
                styles={{
                  input: {
                    borderColor: '#d4edda',
                    '&:focus': {
                      borderColor: '#4a7c2c',
                    },
                  },
                  label: {
                    color: '#2d5016',
                    fontWeight: 500,
                  },
                }}
              />
              <Button 
                fullWidth 
                mt="xl" 
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%)',
                  color: 'white',
                }}
              >
                Create Post
              </Button>
            </form>
          </Modal>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default Forum;
