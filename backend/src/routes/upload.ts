import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { adminRequired } from '../middleware/auth.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Cùng thư mục ảnh seed — docker volume ./backend/public/images đã mount sẵn */
const uploadDir = path.join(__dirname, '../../public/images/products');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/** Chỉ jpg / png / webp; đuôi lấy theo mimetype, không tin originalname */
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] || 'jpg';
    const hex = crypto.randomBytes(8).toString('hex');
    cb(null, `upload-${Date.now()}-${hex}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (MIME_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_TYPE'));
    }
  },
});

/**
 * POST /api/upload/product-image
 * adminRequired chạy trước multer; field form: "image"
 */
router.post('/product-image', adminRequired, (req, res) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Ảnh vượt quá dung lượng cho phép (tối đa 5MB)' });
        }
        return res.status(400).json({ message: 'Upload thất bại' });
      }
      if (err instanceof Error && err.message === 'INVALID_TYPE') {
        return res.status(400).json({ message: 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP' });
      }
      const message = err instanceof Error ? err.message : 'Upload thất bại';
      return res.status(400).json({ message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Chưa chọn file ảnh' });
    }

    // Đường dẫn tương đối để frontend dùng mediaUrl / lưu vào Product.images
    res.status(201).json({ url: `/images/products/${req.file.filename}` });
  });
});

export default router;