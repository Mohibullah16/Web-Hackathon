import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, Title, Paper, Button, Group, Text, 
  AppShell, ActionIcon, Textarea, Stack, Card,
  Divider, LoadingOverlay, Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowBack, IconLogout, IconSend, IconCheck, IconX } from '@tabler/icons-react';
import axios from '../api/axios';
import { useAuth } from '../context/authContext';

function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { user, logout } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      content: '',
    },
    validate: {
      content: (value) => (!value || value.length < 1 ? 'Comment cannot be empty' : null),
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPostDetail();
  }, [user, navigate, postId]);

  const fetchPostDetail = async () => {
    setLoading(true);
    try {
      console.log('Fetching post detail for ID:', postId);
      const response = await axios.get(`/forum/posts/${postId}`);
      console.log('Post detail response:', response.data);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post detail:', error);
      console.error('Error response:', error.response?.data);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to load post details',
        color: 'red',
        icon: <IconX />,
      });
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (values) => {
    try {
      console.log('Adding comment to post:', postId);
      console.log('Comment content:', values);
      const response = await axios.post(`/forum/posts/${postId}/comments`, values);
      console.log('Comment response:', response.data);
      notifications.show({
        title: 'Success',
        message: 'Comment added successfully',
        color: 'green',
        icon: <IconCheck />,
      });
      form.reset();
      fetchPostDetail();
    } catch (error) {
      console.error('Error adding comment:', error);
      console.error('Error response:', error.response?.data);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to add comment',
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToDashboard = () => {
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
                  Post Details
                </Text>
              </div>
            </Group>
          </Group>
          
          <Group gap="sm">
            <Button
              variant="light"
              onClick={() => navigate('/forum')}
              leftSection={<IconArrowBack size={16} />}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              Back to Forum
            </Button>
            <Button
              variant="light"
              onClick={goToDashboard}
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
        <Container size="md">
          <LoadingOverlay visible={loading} />

          {post && (
            <>
              {/* Post Content */}
              <Paper 
                shadow="md" 
                p="xl" 
                mb="lg"
                style={{
                  background: 'white',
                  border: '2px solid #d4edda',
                  borderRadius: '12px',
                }}
              >
                <Group justify="space-between" mb="md">
                  <Title order={2} style={{ color: '#2d5016' }}>
                    {post.title}
                  </Title>
                  <Badge
                    style={{
                      background: 'linear-gradient(135deg, #339af0 0%, #1971c2 100%)',
                      color: 'white',
                    }}
                  >
                    {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                  </Badge>
                </Group>
                <Text size="md" mb="md">
                  {post.content}
                </Text>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Posted by <strong>{post.author_username}</strong>
                  </Text>
                  <Text size="sm" c="dimmed">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </Group>
              </Paper>

              {/* Add Comment Form */}
              <Paper 
                shadow="md" 
                p="md" 
                mb="lg"
                style={{
                  background: 'white',
                  border: '2px solid #d4edda',
                  borderRadius: '12px',
                }}
              >
                <Title order={4} mb="md" style={{ color: '#2d5016' }}>
                  Add a Comment
                </Title>
                <form onSubmit={form.onSubmit(handleAddComment)}>
                  <Textarea
                    placeholder="Share your thoughts..."
                    minRows={3}
                    {...form.getInputProps('content')}
                    styles={{
                      input: {
                        borderColor: '#d4edda',
                        '&:focus': {
                          borderColor: '#4a7c2c',
                        },
                      },
                    }}
                  />
                  <Button 
                    type="submit" 
                    mt="md" 
                    leftSection={<IconSend size={16} />}
                    style={{
                      background: 'linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%)',
                      color: 'white',
                    }}
                  >
                    Post Comment
                  </Button>
                </form>
              </Paper>

              {/* Comments Section */}
              <Paper 
                shadow="md" 
                p="md"
                style={{
                  background: 'white',
                  border: '2px solid #d4edda',
                  borderRadius: '12px',
                }}
              >
                <Title order={4} mb="md" style={{ color: '#2d5016' }}>
                  Comments ({post.comments.length})
                </Title>
                
                {post.comments.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    No comments yet. Be the first to comment!
                  </Text>
                ) : (
                  <Stack gap="md">
                    {post.comments.map((comment) => (
                      <Card 
                        key={comment.id} 
                        p="md"
                        style={{
                          background: '#f8fdf9',
                          border: '1px solid #d4edda',
                          borderRadius: '8px',
                        }}
                      >
                        <Text size="sm" mb="xs" style={{ color: '#2d5016' }}>
                          {comment.content}
                        </Text>
                        <Divider my="xs" style={{ borderColor: '#d4edda' }} />
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            <strong style={{ color: '#4a7c2c' }}>{comment.author_username}</strong>
                          </Text>
                          <Text size="xs" c="dimmed">
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
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
                )}
              </Paper>
            </>
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default PostDetail;
