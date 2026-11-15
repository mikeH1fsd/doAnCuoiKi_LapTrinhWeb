import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError('Vui lòng chọn một tệp hình ảnh.', 400);
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    // Ưu tiên upload lên Supabase Storage nếu đã cấu hình
    if (env.supabaseUrl && env.supabaseServiceRoleKey) {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      const filePath = `uploads/${fileName}`;

      const { error } = await supabase.storage
        .from(env.supabaseBucket)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new AppError(`Lỗi upload Supabase Storage: ${error.message}`, 500);
      }

      const { data: publicUrlData } = supabase.storage
        .from(env.supabaseBucket)
        .getPublicUrl(filePath);

      return res.status(201).json({
        url: publicUrlData.publicUrl,
        storage: 'supabase',
      });
    }

    // Fallback lưu local khi chưa cấu hình Supabase Storage keys
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, fileName), req.file.buffer);
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/${fileName}`;

    return res.status(201).json({
      url,
      storage: 'local',
    });
  } catch (err) {
    next(err);
  }
}
