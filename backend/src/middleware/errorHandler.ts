import type { ErrorRequestHandler } from 'express';
import { BusinessError } from '../utils/errors.js';

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Dữ liệu JSON không hợp lệ' });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Dữ liệu gửi lên quá lớn' });
  }

  if (err instanceof BusinessError) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
};

export default errorHandler;
