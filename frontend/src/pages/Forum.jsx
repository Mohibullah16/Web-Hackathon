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
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <ActionIcon 
              variant="light" 
              onClick={goBack}
              size="lg"
            >
              <IconArrowBack size={18} />
            </ActionIcon>
            <Title order={3}>Community Forum</Title>
          </Group>
          <Group>
            <Text size="sm">Welcome, {user?.username}!</Text>
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
        <Container size="lg">
          <Group justify="space-between" mb="lg">
            <Title order={4}>Discussion Board</Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setModalOpened(true)}
            >
              Create Post
            </Button>
          </Group>

          <LoadingOverlay visible={loading} />

          <Stack gap="md">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                shadow="sm" 
                padding="lg" 
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => handleViewPost(post.id)}
              >
                <Group justify="space-between" mb="xs">
                  <Title order={4}>{post.title}</Title>
                  <Badge color="blue" leftSection={<IconMessage size={12} />}>
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
            <Paper p="xl" ta="center" withBorder>
              <Text c="dimmed">No posts yet. Be the first to create one!</Text>
            </Paper>
          )}

          {/* Create Post Modal */}
          <Modal
            opened={modalOpened}
            onClose={() => setModalOpened(false)}
            title="Create New Post"
            size="lg"
          >
            <form onSubmit={form.onSubmit(handleCreatePost)}>
              <TextInput
                label="Title"
                placeholder="Post title..."
                required
                {...form.getInputProps('title')}
              />
              <Textarea
                label="Content"
                placeholder="Share your thoughts..."
                required
                mt="md"
                minRows={6}
                {...form.getInputProps('content')}
              />
              <Button fullWidth mt="xl" type="submit">
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
