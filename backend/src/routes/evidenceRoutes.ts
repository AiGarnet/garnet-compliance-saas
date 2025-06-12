import { Router } from 'express';
import { EvidenceController, upload } from '../controllers/evidenceController';

const router = Router();
const evidenceController = new EvidenceController();

// Evidence file routes for vendors
router.post('/vendors/:vendorId/evidence', upload.single('file'), evidenceController.uploadEvidence);
router.get('/vendors/:vendorId/evidence', evidenceController.getVendorEvidence);
router.get('/vendors/:vendorId/evidence/count', evidenceController.getVendorEvidenceCount);
router.get('/vendors/:vendorId/evidence/:evidenceId/download', evidenceController.downloadEvidence);
router.delete('/vendors/:vendorId/evidence/:evidenceId', evidenceController.deleteEvidence);

// Evidence file routes for answers
router.get('/answers/:answerId/evidence', evidenceController.getAnswerEvidence);

export default router; 