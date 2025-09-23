import { Router } from 'express';
import { PostController } from '../controllers/postController.js';
import { authmiddleware } from '../middlewares/authmiddleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authmiddleware);

// Post routes
router.post('/create', PostController.createPost);
router.get('/', PostController.getUserPosts);
router.get('/:id', PostController.getPost);
router.put('/:id', PostController.updatePost);
router.delete('/:id', PostController.deletePost);

export default router;
