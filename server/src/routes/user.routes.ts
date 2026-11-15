import { Router } from 'express';
import {
  changePassword,
  createMyPost,
  deleteMyPost,
  getMyPostById,
  getMyPosts,
  getProfile,
  updateMyPost,
  updateMyPostStatus,
  updateProfile,
} from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

router.get('/posts', getMyPosts);
router.get('/posts/:id', getMyPostById);
router.post('/posts', createMyPost);
router.put('/posts/:id', updateMyPost);
router.patch('/posts/:id/status', updateMyPostStatus);
router.delete('/posts/:id', deleteMyPost);

export default router;
