import { Router } from 'express';
import {
  createComment,
  deleteComment,
  getPostBySlug,
  getPostComments,
  getPublicCategories,
  getPublicPosts,
} from '../controllers/post.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/posts', getPublicPosts);
router.get('/posts/:slug', getPostBySlug);
router.get('/posts/:id/comments', getPostComments);
router.post('/posts/:id/comments', requireAuth, createComment);
router.delete('/comments/:id', requireAuth, deleteComment);
router.get('/categories', getPublicCategories);

export default router;
