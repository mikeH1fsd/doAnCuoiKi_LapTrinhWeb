import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/error.middleware';

const router = Router();

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Chỉ chấp nhận ảnh định dạng JPG, PNG, WEBP hoặc GIF.', 400));
    }
  },
});

router.post('/', requireAuth, upload.single('image'), uploadImage);

export default router;
