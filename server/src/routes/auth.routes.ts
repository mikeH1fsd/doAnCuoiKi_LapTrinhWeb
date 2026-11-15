import { Router } from 'express';
import { adminLogin, getMe, login, register } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', requireAuth, getMe);

export default router;
