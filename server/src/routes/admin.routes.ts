import { Router } from 'express';
import {
  createAdminAccount,
  createCategory,
  createPost,
  deleteAdminAccount,
  deleteAdminUser,
  deleteCategory,
  deletePost,
  getAdminAccounts,
  getAdminCategories,
  getAdminPostById,
  getAdminPosts,
  getAdminStats,
  getAdminUsers,
  updateAdminPassword,
  updateAdminStatus,
  updateAdminUser,
  updateCategory,
  updatePost,
  updatePostStatus,
} from '../controllers/admin.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', getAdminStats);

// Bài viết
router.get('/posts', getAdminPosts);
router.get('/posts/:id', getAdminPostById);
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.patch('/posts/:id/status', updatePostStatus);
router.delete('/posts/:id', deletePost);

// Danh mục
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Tài khoản người dùng
router.get('/users', getAdminUsers);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

// Tài khoản quản trị viên
router.get('/admins', getAdminAccounts);
router.post('/admins', createAdminAccount);
router.patch('/admins/:id/password', updateAdminPassword);
router.patch('/admins/:id/status', updateAdminStatus);
router.delete('/admins/:id', deleteAdminAccount);

export default router;
