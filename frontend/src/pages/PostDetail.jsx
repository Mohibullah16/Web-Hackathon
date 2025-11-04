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
              onClick={() => navigate('/forum')}
              size="lg"
            >
              <IconArrowBack size={18} />
            </ActionIcon>
            <Title order={3}>Post Details</Title>
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
        <Container size="md">
          <LoadingOverlay visible={loading} />

          {post && (
            <>
              {/* Post Content */}
              <Paper shadow="sm" p="xl" mb="lg" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={2}>{post.title}</Title>
                  <Badge color="blue">
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
              <Paper shadow="sm" p="md" mb="lg" withBorder>
                <Title order={4} mb="md">Add a Comment</Title>
                <form onSubmit={form.onSubmit(handleAddComment)}>
                  <Textarea
                    placeholder="Share your thoughts..."
                    minRows={3}
                    {...form.getInputProps('content')}
                  />
                  <Button 
                    type="submit" 
                    mt="md" 
                    leftSection={<IconSend size={16} />}
                  >
                    Post Comment
                  </Button>
                </form>
              </Paper>

              {/* Comments Section */}
              <Paper shadow="sm" p="md" withBorder>
                <Title order={4} mb="md">
                  Comments ({post.comments.length})
                </Title>
                
                {post.comments.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    No comments yet. Be the first to comment!
                  </Text>
                ) : (
                  <Stack gap="md">
                    {post.comments.map((comment) => (
                      <Card key={comment.id} withBorder p="md">
                        <Text size="sm" mb="xs">
                          {comment.content}
                        </Text>
                        <Divider my="xs" />
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            <strong>{comment.author_username}</strong>
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
