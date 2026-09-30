import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getLocations);
router.get('/:id', getLocationById);
router.post('/', authorizeRoles('ADMIN'), createLocation);
router.put('/:id', authorizeRoles('ADMIN'), updateLocation);
router.delete('/:id', authorizeRoles('ADMIN'), deleteLocation);

export default router;
